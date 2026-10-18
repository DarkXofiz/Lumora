import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { Preview } from './Preview'
import { Timeline } from './Timeline'
import { isPhone } from './perf'
import { Home, saveRecent } from './Home'
import { Ic } from './icons'
import { useSettings, buzz } from './settings'
const Export = lazy(() => import('./ExportPanel'))
const fmt = (t: number) => `${String((t / 60) | 0).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`

function Intro({ done }: { done: () => void }) {
  useEffect(() => { import('./ExportPanel'); const t = setTimeout(done, 2200); return () => clearTimeout(t) }, [])
  return <div className="intro"><div className="orb" /><h1>Lumora</h1></div>
}

export function App() {
  const [view, setView] = useState<'home' | 'editor'>('home'), [intro, setIntro] = useState(true), [fps, setFps] = useState(0)
  const [showExport, setShowExport] = useState(false), [tool, setTool] = useState('')
  const s = useStore(), theme = useSettings(x => x.theme), file = useRef<HTMLInputElement>(null)
  const sel = s.clips.find(c => c.id === s.selected)
  const end = Math.max(0, ...s.clips.map(c => c.start + c.dur))
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  const importFiles = (fl: FileList | null) => [...(fl ?? [])].forEach(f => {
    const url = URL.createObjectURL(f), v = document.createElement('video')
    v.preload = 'metadata'; v.muted = true; v.src = url
    v.onloadedmetadata = () => {
      const st = useStore.getState(), at = Math.max(0, ...st.clips.map(c => c.start + c.dur))
      st.addClip({ id: crypto.randomUUID(), name: f.name, url, start: at, dur: v.duration || 5, trim: 0, track: 0 })
      const rec = { name: f.name, dur: v.duration || 5, ts: Date.now() }; saveRecent(rec)
      v.onseeked = () => { try { const c = document.createElement('canvas'); c.width = 320; c.height = 200; c.getContext('2d')!.drawImage(v, 0, 0, 320, 200); saveRecent({ ...rec, thumb: c.toDataURL('image/jpeg', 0.6) }) } catch {} v.onseeked = null }
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2)
    }
  })
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const st = useStore.getState()
      if (e.code === 'Space') { e.preventDefault(); st.setPlaying(!st.playing) }
      if (e.key === 's') st.split()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? st.redo() : st.undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); st.redo() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && st.selected) st.removeClip(st.selected)
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const T = (ic: string, l: string, on: () => void, dis = false, active = false) =>
    <button key={l} className={'tl' + (active ? ' on' : '')} disabled={dis} onClick={() => { on(); buzz() }}><Ic n={ic} s={22} />{l}</button>
  const addText = () => { const t = prompt('Metin'); if (t) s.addClip({ id: crypto.randomUUID(), kind: 'text', text: t, name: t, url: '', start: s.playhead, dur: 3, trim: 0, track: 1 }) }
  const FX: [keyof typeof s.fx, string, number, number][] = [['brightness', 'Parlaklık', -0.5, 0.5], ['contrast', 'Kontrast', 0, 2], ['saturation', 'Doygunluk', 0, 2]]
  let panel: any = <p className="hint">Aşağıdan bir araç seç. Klibi düzenlemek için zaman çizelgesinde klibe dokun.</p>
  if (tool === 'adj') panel = FX.map(([k, l, a, b]) => <label key={k}>{l}<input type="range" min={a} max={b} step={0.01} value={s.fx[k]} onChange={e => s.setFx({ [k]: +e.target.value } as any)} /></label>)
  else if (sel?.kind === 'text') panel = <label>Metin<input value={sel.text} onChange={e => s.updateClip(sel.id, { text: e.target.value })} /></label>
  else if (tool === 'vol' || tool === 'speed') panel = !sel ? <p className="hint">Önce zaman çizelgesinden bir klip seç.</p> : tool === 'vol'
    ? <label>Ses {Math.round((sel.vol ?? 1) * 100)}%<input type="range" min={0} max={1} step={0.01} value={sel.vol ?? 1} onChange={e => s.updateClip(sel.id, { vol: +e.target.value })} /></label>
    : <label>Hız {(sel.speed ?? 1).toFixed(2)}x<input type="range" min={0.25} max={4} step={0.25} value={sel.speed ?? 1} onChange={e => s.updateClip(sel.id, { speed: +e.target.value })} /></label>
  return <>
    {intro && <Intro done={() => setIntro(false)} />}
    {view === 'home' && !intro && <Home open={now => { setView('editor'); if (now) setTimeout(() => file.current?.click(), 60) }} />}
    {view === 'editor' && <div className="ed">
      <div className="edh">
        <button className="ib" onClick={() => setView('home')}><span style={{ transform: 'rotate(180deg)', display: 'flex' }}><Ic n="chev" /></span></button>
        <b>{s.clips.find(c => c.kind !== 'text')?.name ?? 'Yeni proje'}</b>
        <button className="exp" onClick={() => setShowExport(true)}>Dışa aktar</button>
      </div>
      <Preview onFps={setFps} />
      <div className="tp"><span>{fmt(s.playhead)} / {fmt(end)}</span><span className="sp" />
        <button className="ib" disabled={!s.past.length} onClick={s.undo}><Ic n="undo" /></button>
        <button className="pl" onClick={() => { s.setPlaying(!s.playing); buzz() }}><Ic n={s.playing ? 'pause' : 'tri'} s={26} /></button>
        <button className="ib" disabled={!s.future.length} onClick={s.redo}><Ic n="redo" /></button></div>
      <Timeline />
      <div className="pn">{panel}</div>
      <div className="tb">
        {T('plus', 'İçe aktar', () => file.current?.click())}
        {T('split', 'Böl', s.split, !s.selected)}
        {T('trash', 'Sil', () => s.selected && s.removeClip(s.selected), !s.selected)}
        {T('text', 'Metin', addText)}
        {T('vol', 'Ses', () => setTool(tool === 'vol' ? '' : 'vol'), false, tool === 'vol')}
        {T('speed', 'Hız', () => setTool(tool === 'speed' ? '' : 'speed'), false, tool === 'speed')}
        {T('sliders', 'Ayarla', () => setTool(tool === 'adj' ? '' : 'adj'), false, tool === 'adj')}
      </div>
      <input ref={file} type="file" accept="video/*" multiple hidden onChange={e => { importFiles(e.target.files); e.target.value = '' }} />
      {import.meta.env.DEV && <div className="dbg">{fps} FPS · {s.quality}</div>}
      {s.clips.length > 8 && <div className="warn">Büyük proje: Ayarlar'dan Performans modunu aç{isPhone ? '' : ''}.</div>}
      {showExport && <Suspense fallback={null}><Export onClose={() => setShowExport(false)} /></Suspense>}
    </div>}
  </>
}
