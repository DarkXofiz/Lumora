import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { endOf } from './Preview'
let PX = 80
const ROW = 38, GAP = 6, HEAD = 40, EDGE = 16
const COL: Record<string, string> = { video: '#5b4fa8', image: '#3f6fb5', text: '#b03a6a', audio: '#2f8f6f' }
export const fmt = (t: number) => `${(t / 60) | 0}:${(t % 60).toFixed(1).padStart(4, '0')}`
const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h) }

export function Timeline({ onAdd }: { onAdd: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null), dirty = useRef(true)
  const ptrs = useRef(new Map<number, { x: number; y: number }>()), g = useRef<any>(null)
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!
    const unsub = useStore.subscribe(() => (dirty.current = true))
    const fit = () => { const r = c.getBoundingClientRect(); c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio; dirty.current = true }
    fit(); addEventListener('resize', fit); const ro = new ResizeObserver(fit); ro.observe(c)
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw); if (!dirty.current) return; dirty.current = false
      const s = useStore.getState(), W = c.width / devicePixelRatio, H = c.height / devicePixelRatio, sc = s.playhead * PX - W / 2
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#6f6a85'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
      const step = PX >= 60 ? 1 : PX >= 30 ? 2 : 5
      for (let t = Math.max(0, Math.floor(sc / PX / step) * step); t * PX - sc < W; t += step) { const x = t * PX - sc; ctx.fillRect(x, HEAD - 10, 1, 6); if (x > 0) ctx.fillText(`${(t / 60) | 0}:${String(t % 60).padStart(2, '0')}`, x + 3, HEAD - 12) }
      for (const cl of s.clips) {
        const x = cl.start * PX - sc, w = cl.dur * PX; if (x + w < 0 || x > W) continue
        const y = HEAD + cl.track * (ROW + GAP), sel = cl.id === s.selected, k = cl.kind ?? 'video'
        ctx.fillStyle = COL[k]; rr(ctx, x, y, w, ROW, 8); ctx.fill()
        ctx.save(); rr(ctx, x, y, w, ROW, 8); ctx.clip(); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'
        ctx.fillText((k === 'text' ? 'T  ' : k === 'audio' ? '♪  ' : '') + (k === 'text' ? cl.text : cl.name), Math.max(x, 0) + 10, y + 23)
        if (cl.effect || cl.filter || cl.motion || cl.trans) { ctx.fillStyle = '#ffcf5c'; ctx.fillRect(x + w - 14, y + 5, 8, 8) }
        ctx.restore()
        if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rr(ctx, x, y, w, ROW, 8); ctx.stroke(); ctx.fillStyle = '#fff'; rr(ctx, x - 5, y + 6, 9, ROW - 12, 4); ctx.fill(); rr(ctx, x + w - 4, y + 6, 9, ROW - 12, 4); ctx.fill() }
      }
      const ax = Math.max(0, ...s.clips.filter(k => k.track === 0).map(k => k.start + k.dur)) * PX - sc + 10
      ctx.fillStyle = '#2a2442'; rr(ctx, ax, HEAD, ROW, ROW, 10); ctx.fill(); ctx.strokeStyle = '#d9d2f2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax + 12, HEAD + ROW / 2); ctx.lineTo(ax + ROW - 12, HEAD + ROW / 2); ctx.moveTo(ax + ROW / 2, HEAD + 12); ctx.lineTo(ax + ROW / 2, HEAD + ROW - 12); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 1, 16, 2, H - 16); ctx.beginPath(); ctx.moveTo(W / 2 - 7, 6); ctx.lineTo(W / 2 + 7, 6); ctx.lineTo(W / 2, 15); ctx.fill()
      ctx.fillStyle = '#a79fc7'; ctx.font = '12px system-ui'; ctx.fillText(fmt(s.playhead), W / 2 + 6, 13)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); unsub(); ro.disconnect(); removeEventListener('resize', fit) }
  }, [])
  const xy = (e: React.PointerEvent) => { const r = cv.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, W: r.width } }
  return <canvas ref={cv} className="timeline"
    onWheel={e => { const s = useStore.getState(); if (e.ctrlKey) { PX = Math.min(400, Math.max(20, PX * (e.deltaY > 0 ? 0.9 : 1.1))); dirty.current = true } else s.setPlayhead(s.playhead + (e.deltaX + e.deltaY) / PX) }}
    onPointerDown={e => {
      cv.current!.setPointerCapture(e.pointerId); const p = xy(e), s = useStore.getState(); ptrs.current.set(e.pointerId, p)
      if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; g.current = { m: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, px: PX }; return }
      const sc = s.playhead * PX - p.W / 2, t = (p.x + sc) / PX
      const ax = Math.max(0, ...s.clips.filter(k => k.track === 0).map(k => k.start + k.dur)) * PX - sc + 10
      if (p.x >= ax && p.x <= ax + ROW && p.y >= HEAD && p.y <= HEAD + ROW) { g.current = { m: 'add' }; return }
      const hit = s.clips.find(c => t >= c.start && t <= c.start + c.dur && p.y >= HEAD + c.track * (ROW + GAP) && p.y <= HEAD + c.track * (ROW + GAP) + ROW)
      const base = { x0: p.x, ph0: s.playhead, moved: false, snapped: false }
      if (hit && hit.id === s.selected) {
        const e0 = EDGE / PX, m = t - hit.start < e0 ? 'l' : hit.start + hit.dur - t < e0 ? 'r' : 'move'
        g.current = { ...base, m, id: hit.id, dx: t - hit.start, c0: hit }
      } else g.current = { ...base, m: 'pan', id: hit?.id ?? null }
    }}
    onPointerMove={e => {
      const p = xy(e); if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, p)
      const d = g.current; if (!d) return
      if (d.m === 'pinch') { if (ptrs.current.size < 2) return; const [a, b] = [...ptrs.current.values()]; PX = Math.min(400, Math.max(20, d.px * (Math.hypot(a.x - b.x, a.y - b.y) / d.d))); dirty.current = true; return }
      if (d.m === 'add') return
      const st = useStore.getState()
      if (Math.abs(p.x - d.x0) > 6) d.moved = true; if (!d.moved) return
      if (d.m === 'pan') return st.setPlayhead(d.ph0 - (p.x - d.x0) / PX)
      if (!d.snapped) { st.snap(); d.snapped = true }
      const sc = st.playhead * PX - p.W / 2, t = (p.x + sc) / PX, c = d.c0, sp = c.speed ?? 1
      const room = c.src ? Math.max(0.2, (c.src - c.trim) / sp) : Infinity
      if (d.m === 'move') st.updateClip(d.id, { start: Math.max(0, t - d.dx) })
      else if (d.m === 'r') st.updateClip(d.id, { dur: Math.min(room, Math.max(0.2, t - c.start)) })
      else { const ns = Math.min(Math.max(0, t), c.start + c.dur - 0.2), dl = ns - c.start; if (c.trim + dl * sp >= 0) st.updateClip(d.id, { start: ns, dur: c.dur - dl, trim: c.trim + dl * sp }) }
    }}
    onPointerUp={e => {
      const d = g.current; ptrs.current.delete(e.pointerId); if (ptrs.current.size) return; g.current = null; if (!d) return
      const s = useStore.getState()
      if (d.m === 'add') onAdd(); else if (d.m === 'pan' && !d.moved) s.select(d.id)
    }}
    onPointerCancel={e => { ptrs.current.delete(e.pointerId); g.current = null }} />
}
