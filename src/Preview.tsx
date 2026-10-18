import { useEffect, useRef, type ReactNode } from 'react'
import { useStore, type Clip } from './store'
import { GLRenderer, type GP } from './gl'
import { surfaces } from './surfaces'
import { makeAdaptor, scaleOf } from './perf'
import { arOf, hex, xform } from './fx'
import { Ic } from './icons'

const imgs = new Map<string, HTMLImageElement>()
const isVis = (c: Clip) => c.kind !== 'text' && c.kind !== 'audio'
const gain = (c: Clip, t: number) => { let g = c.vol ?? 1; if (c.fadeIn) g *= Math.min(1, t / c.fadeIn); if (c.fadeOut) g *= Math.min(1, (c.dur - t) / c.fadeOut); return Math.max(0, Math.min(1, g)) }
export const endOf = (cl: Clip[]) => Math.max(0, ...cl.map(c => c.start + c.dur))

function drawText(t2: CanvasRenderingContext2D, c: Clip, W: number, H: number, ts: number) {
  const size = (c.size ?? 0.07) * H, lines = (c.text ?? '').split('\n'), lh = size * 1.2, y0 = (c.y ?? 0.85) * H - ((lines.length - 1) * lh) / 2
  const st = c.style ?? 0, col = c.color ?? '#fff', k = Math.min(1, ts / 0.2)
  t2.save(); t2.globalAlpha = k; t2.font = `800 ${size}px system-ui,sans-serif`; t2.textAlign = 'center'; t2.textBaseline = 'middle'; t2.lineJoin = 'round'
  if (st === 1) { const w = Math.max(...lines.map(l => t2.measureText(l).width)) + size, h = lines.length * lh + size * 0.2; t2.fillStyle = '#000b'; t2.beginPath(); (t2 as any).roundRect ? (t2 as any).roundRect(W / 2 - w / 2, y0 - lh / 2 - size * 0.1, w, h, size * 0.3) : t2.rect(W / 2 - w / 2, y0 - lh / 2 - size * 0.1, w, h); t2.fill() }
  lines.forEach((l, i) => {
    const y = y0 + i * lh
    if (st === 0) { t2.lineWidth = size * 0.14; t2.strokeStyle = '#000'; t2.strokeText(l, W / 2, y) }
    if (st === 2) { t2.shadowColor = col; t2.shadowBlur = size * 0.7; t2.fillStyle = col; t2.fillText(l, W / 2, y); t2.fillText(l, W / 2, y) }
    if (st === 3) { t2.shadowColor = '#000'; t2.shadowBlur = size * 0.25; t2.shadowOffsetY = size * 0.07 }
    t2.fillStyle = st === 2 ? '#fff' : col; t2.fillText(l, W / 2, y)
  })
  t2.restore()
}

export function Preview({ onFps, children }: { onFps?: (f: number) => void; children?: ReactNode }) {
  const cv = useRef<HTMLCanvasElement>(null), tx = useRef<HTMLCanvasElement>(null), vid = useRef<HTMLVideoElement>(null)
  const wrap = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const gl = new GLRenderer(cv.current!), v = vid.current!, t2 = tx.current!.getContext('2d')!
    surfaces.gl = cv.current; surfaces.txt = tx.current; surfaces.video = v
    const layout = () => {
      const r = wrap.current!.getBoundingClientRect(), ar = arOf(useStore.getState().ar); let w = r.width, h = w / ar
      if (h > r.height) { h = r.height; w = h * ar }
      stage.current!.style.width = Math.floor(w) + 'px'; stage.current!.style.height = Math.floor(h) + 'px'
    }
    const ro = new ResizeObserver(layout); ro.observe(wrap.current!); layout()
    let lastAr = useStore.getState().ar; const unsub = useStore.subscribe(s => { if (s.ar !== lastAr) { lastAr = s.ar; layout() } })
    const adapt = makeAdaptor(() => useStore.getState().quality, q => useStore.getState().auto && useStore.getState().setQuality(q, true))
    let raf = 0, last = performance.now(), curUrl = '', frames = 0, fpsT = last
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const s = useStore.getState(), dt = Math.min(100, now - last); last = now
      const vis = s.clips.filter(c => isVis(c) && s.playhead >= c.start && s.playhead < c.start + c.dur).sort((a, b) => b.track - a.track)[0]
      let advance = s.playing
      if (vis && vis.kind !== 'image') {
        if (curUrl !== vis.url) { curUrl = vis.url; v.src = vis.url }
        const sp = vis.speed ?? 1; v.playbackRate = sp; v.volume = gain(vis, s.playhead - vis.start)
        const want = (s.playhead - vis.start) * sp + vis.trim
        if (s.playing) { if (v.paused) v.play().catch(() => {}); if (Math.abs(v.currentTime - want) > 0.3) v.currentTime = want; s.setPlayhead(vis.start + (v.currentTime - vis.trim) / sp); advance = false }
        else { v.pause(); if (Math.abs(v.currentTime - want) > 0.03) v.currentTime = want }
      } else if (!v.paused) v.pause()
      if (advance) { if (s.playhead >= endOf(s.clips)) s.setPlaying(false); else s.setPlayhead(s.playhead + dt / 1000) }
      for (const c of s.clips) if (c.kind === 'audio') {
        let a = surfaces.audio.get(c.id); if (!a) { a = new Audio(c.url); a.preload = 'auto'; surfaces.audio.set(c.id, a) }
        const on = s.playhead >= c.start && s.playhead < c.start + c.dur, sp = c.speed ?? 1, want = (s.playhead - c.start) * sp + c.trim
        a.volume = gain(c, s.playhead - c.start); a.playbackRate = sp
        if (on && s.playing) { if (a.paused) a.play().catch(() => {}); if (Math.abs(a.currentTime - want) > 0.3) a.currentTime = want }
        else { if (!a.paused) a.pause(); if (on && Math.abs(a.currentTime - want) > 0.1) a.currentTime = want }
      }
      for (const [id, a] of surfaces.audio) if (!s.clips.some(c => c.id === id)) { a.pause(); surfaces.audio.delete(id) }
      const st = stage.current!, W0 = st.clientWidth, H0 = st.clientHeight, k = scaleOf(s.quality)
      gl.resize(Math.max(2, (W0 * k * devicePixelRatio) | 0), Math.max(2, (H0 * k * devicePixelRatio) | 0))
      const T = tx.current!, C = cv.current!; if (T.width !== C.width || T.height !== C.height) { T.width = C.width; T.height = C.height }
      t2.clearRect(0, 0, T.width, T.height)
      for (const c of s.clips) if (c.kind === 'text' && s.playhead >= c.start && s.playhead < c.start + c.dur) drawText(t2, c, T.width, T.height, s.playhead - c.start)
      const ca = arOf(s.ar), ad = vis?.adj ?? {}, f = s.fx
      let src: TexImageSource | null = null, sw = 0, sh = 0
      if (vis?.kind === 'image') {
        let im = imgs.get(vis.url); if (!im) { im = new Image(); im.src = vis.url; imgs.set(vis.url, im) }
        if (im.complete && im.naturalWidth) { src = im; sw = im.naturalWidth; sh = im.naturalHeight }
      } else if (vis && v.readyState >= 2) { src = v; sw = v.videoWidth; sh = v.videoHeight }
      const q: GP = { b: f.brightness + (ad.b ?? 0), c: f.contrast * (ad.c ?? 1), s: f.saturation * (ad.s ?? 1), temp: ad.temp ?? 0, vig: ad.vig ?? 0, sharp: ad.sharp ?? 0, blur: ad.blur ?? 0,
        fx: vis?.effect ?? 0, amt: vis?.amt ?? 0.5, flt: vis?.filter ?? 0, fa: vis?.fa ?? 1, cover: !!vis?.cover, flip: !!vis?.flip, ca, bg: hex(s.bg), tm: now / 1000,
        xf: vis ? xform(vis, s.playhead, ca) : { zoom: 1, px: 0, py: 0, rot: 0, alpha: 1, flash: 0 } }
      gl.draw(src, sw, sh, q)
      if (s.playing) adapt(dt)
      frames++; if (now - fpsT > 1000) { onFps?.(frames); frames = 0; fpsT = now }
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); unsub() }
  }, [])
  const full = () => { const el = wrap.current as any; document.fullscreenElement ? document.exitFullscreen() : (el?.requestFullscreen ?? el?.webkitRequestFullscreen)?.call(el) }
  return <div className="preview" ref={wrap}>
    <div className="stage" ref={stage}><canvas ref={cv} /><canvas ref={tx} className="ov" /><video ref={vid} playsInline preload="auto" hidden /></div>
    {children}
    <button className="fs" aria-label="Tam ekran" onClick={full}><Ic n="full" s={22} /></button>
  </div>
}
