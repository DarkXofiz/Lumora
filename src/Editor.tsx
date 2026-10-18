import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore, type Clip } from './store'
import { Preview, endOf } from './Preview'
import { Timeline, fmt } from './Timeline'
import { Ic } from './icons'
import { saveRecent } from './Home'
import { useSettings, buzz } from './settings'
import { EFFECTS, FILTERS, MOTIONS, TRANS, ASPECTS, BGS, COLORS, TSTYLES, TEMPLATES } from './fx'
const Export = lazy(() => import('./ExportPanel'))
const uid = () => crypto.randomUUID()
const RES = ['480p', '720p', '1080p', '1440p', '4K']

const Clock = () => { const t = useStore(s => s.playhead), e = useStore(s => endOf(s.clips)); return <span>{fmt(t)} / {fmt(e)}</span> }
const Rng = ({ l, v, a, b, st = 0.01, f, on }: { l: string; v: number; a: number; b: number; st?: number; f?: (x: number) => string; on: (x: number) => void }) =>
  <label>{l} <em>{f ? f(v) : v.toFixed(2)}</em><input type="range" min={a} max={b} step={st} value={v} onPointerDown={() => useStore.getState().snap()} onChange={e => on(+e.target.value)} /></label>
const Chips = ({ list, cur, on }: { list: string[]; cur: number; on: (i: number) => void }) =>
  <div className="chips">{list.map((n, i) => <button key={n} className={'chip' + (cur === i ? ' on' : '')} onClick={() => { useStore.getState().snap(); on(i); buzz() }}>{n}</button>)}</div>
const Btn = ({ ic, l, on, dis }: { ic: string; l: string; on: () => void; dis?: boolean }) => <button className="pbtn" disabled={dis} onClick={() => { on(); buzz() }}><Ic n={ic} s={20} />{l}</button>

function parseSrt(txt: string) {
  const tm = (s: string) => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0 }
  return txt.replace(/\r/g, '').split(/\n\n+/).flatMap(b => {
    const ln = b.split('\n').filter(Boolean), i = ln.findIndex(x => x.includes('-->')); if (i < 0) return []
    const [a, z] = ln[i].split('-->'); return [{ start: tm(a), dur: Math.max(0.3, tm(z) - tm(a)), text: ln.slice(i + 1).join('\n') }]
  })
}

export function Editor({ onBack }: { onBack: () => void }) {
  const clips = useStore(s => s.clips), selId = useStore(s => s.selected), playing = useStore(s => s.playing), quality = useStore(s => s.quality)
  const nPast = useStore(s => s.past.length), nFut = useStore(s => s.future.length), ar = useStore(s => s.ar), bg = useStore(s => s.bg)
  const st = useStore.getState, res = useSettings(s => s.res), setSet = useSettings(s => s.set)
  const [tool, setTool] = useState(''), [fps, setFps] = useState(0), [showExport, setShowExport] = useState(false), [menu, setMenu] = useState(''), [tpl, setTpl] = useState(false)
  const [toast, setToast] = useState(''), [txt, setTxt] = useState(''), [photoDur, setPhotoDur] = useState(4)
  const fMedia = useRef<HTMLInputElement>(null), fCam = useRef<HTMLInputElement>(null), fAud = useRef<HTMLInputElement>(null), fSrt = useRef<HTMLInputElement>(null)
  const sel = clips.find(c => c.id === selId), vis = sel && sel.kind !== 'text' && sel.kind !== 'audio', end = endOf(clips)
  const say = (m: string) => setToast(m)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 1800); return () => clearTimeout(t) }, [toast])
  useEffect(() => { st().setPlaying(false); return () => st().setPlaying(false) }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement; if (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'range' || el.tagName === 'TEXTAREA') return
      const s = st()
      if (e.code === 'Space') { e.preventDefault(); play() }
      if (e.key === 's') s.split()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); s.redo() }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.selected) s.removeClip(s.selected)
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const play = () => { const s = st(); if (!s.playing && s.playhead >= endOf(s.clips) - 0.05) s.setPlayhead(0); s.setPlaying(!s.playing) }
  const up = (p: Partial<Clip>) => sel && st().updateClip(sel.id, p)
  const upAdj = (p: NonNullable<Clip['adj']>) => up({ adj: { ...sel?.adj, ...p } })

  const importFiles = (fl: FileList | null, forceAudio = false) => [...(fl ?? [])].forEach(f => {
    const url = URL.createObjectURL(f), isA = forceAudio || f.type.startsWith('audio'), isI = f.type.startsWith('image'), s0 = st()
    const base = { id: uid(), name: f.name, url, trim: 0 }
    const tp = s0.tpl ? { filter: s0.tpl.filter, effect: s0.tpl.effect, amt: 0.5 } : {}
    if (isI) {
      const im = new Image(); im.src = url
      im.onload = () => {
        const s = st(), at = Math.max(0, ...s.clips.filter(c => c.track === 0).map(c => c.start + c.dur))
        s.addClip({ ...base, kind: 'image', start: at, dur: photoDur, track: 0, ...tp }); s.setPlayhead(at)
        const cv = document.createElement('canvas'); cv.width = 320; cv.height = 200
        try { cv.getContext('2d')!.drawImage(im, 0, 0, 320, 200); saveRecent({ name: f.name, dur: photoDur, ts: Date.now(), thumb: cv.toDataURL('image/jpeg', 0.6) }) } catch {}
      }
      im.onerror = () => say('Fotoğraf açılamadı')
      return
    }
    const v = document.createElement(isA ? 'audio' : 'video') as HTMLMediaElement; v.preload = 'metadata'; v.muted = true; v.src = url
    v.onerror = () => say('Dosya açılamadı')
    v.onloadedmetadata = () => {
      const s = st(), d = isFinite(v.duration) ? v.duration : 5
      if (isA) { s.addClip({ ...base, kind: 'audio', start: s.playhead, dur: d, src: d, track: 2 }); say('Ses eklendi'); return }
      const at = Math.max(0, ...s.clips.filter(c => c.track === 0).map(c => c.start + c.dur))
      s.addClip({ ...base, kind: 'video', start: at, dur: d, src: d, track: 0, ...tp }); s.setPlayhead(at)
      const rec = { name: f.name, dur: d, ts: Date.now() }; saveRecent(rec)
      v.onseeked = () => { try { const c = document.createElement('canvas'); c.width = 320; c.height = 200; c.getContext('2d')!.drawImage(v as HTMLVideoElement, 0, 0, 320, 200); saveRecent({ ...rec, thumb: c.toDataURL('image/jpeg', 0.6) }) } catch {} v.onseeked = null }
      v.currentTime = Math.min(0.5, d / 2)
    }
  })
  const addText = (text: string, o: Partial<Clip> = {}) => { const s = st(); s.addClip({ id: uid(), kind: 'text', text, name: text, url: '', start: s.playhead, dur: 3, trim: 0, track: 1, style: 0, ...o }) }
  const importSrt = async (fl: FileList | null) => {
    const f = fl?.[0]; if (!f) return; const items = parseSrt(await f.text()); if (!items.length) return say('Altyazı okunamadı')
    st().snap(); items.forEach(i => useStore.setState(s => ({ clips: [...s.clips, { id: uid(), kind: 'text', text: i.text, name: i.text, url: '', start: i.start, dur: i.dur, trim: 0, track: 1, style: 1, size: 0.05, y: 0.88 }] })))
    say(`${items.length} altyazı eklendi`)
  }
  const pickTemplate = (t: typeof TEMPLATES[number]) => {
    const s = st(); s.setAr(t.ar); s.setTpl({ filter: t.filter, effect: t.effect })
    s.clips.filter(c => !c.kind || c.kind === 'video' || c.kind === 'image').forEach(c => s.updateClip(c.id, { filter: t.filter, effect: t.effect, amt: 0.5 }))
    addText(t.title, { start: 0, dur: 3, style: 2, size: 0.09, y: 0.5, name: t.title }); setTpl(false)
    if (!s.clips.some(c => !c.kind || c.kind === 'video' || c.kind === 'image')) fMedia.current?.click()
  }
  const openTool = (k: string) => setTool(tool === k ? '' : k)
  const TB = (ic: string, l: string, on: () => void, o: { dis?: boolean; active?: boolean } = {}) =>
    <button key={l} className={'tl' + (o.active ? ' on' : '')} disabled={o.dis} onClick={() => { on(); buzz() }}><Ic n={ic} s={22} />{l}</button>
  const needClip = <p className="hint">Önce zaman çizelgesinden bir klip seç.</p>
  const needVis = <p className="hint">Bu araç fotoğraf ve video klipleri için. Zaman çizelgesinden bir görüntü klibi seç.</p>
  const TextEdit = () => sel?.kind === 'text' ? <>
    <label>Metin<textarea rows={2} value={sel.text} onChange={e => up({ text: e.target.value, name: e.target.value })} /></label>
    <Chips list={TSTYLES} cur={sel.style ?? 0} on={i => up({ style: i })} />
    <div className="sw">{COLORS.map(c => <button key={c} className={'cs' + (sel.color === c || (!sel.color && c === '#ffffff') ? ' on' : '')} style={{ background: c }} onClick={() => up({ color: c })} />)}</div>
    <Rng l="Boyut" v={sel.size ?? 0.07} a={0.03} b={0.2} st={0.005} on={x => up({ size: x })} />
    <Rng l="Dikey konum" v={sel.y ?? 0.85} a={0.05} b={0.95} on={x => up({ y: x })} />
    <Rng l="Süre" v={sel.dur} a={0.5} b={15} st={0.1} f={x => x.toFixed(1) + ' sn'} on={x => up({ dur: x })} />
  </> : null
  const speedChange = (n: number) => sel && up({ speed: n, dur: Math.max(0.2, sel.dur * (sel.speed ?? 1) / n) })

  let panel: ReactNode = null
  if (tool === 'media') panel = <>
    <div className="prow"><Btn ic="image" l="Galeriden seç" on={() => fMedia.current?.click()} /><Btn ic="camera" l="Kamera" on={() => fCam.current?.click()} /><Btn ic="grid" l="Şablon" on={() => setTpl(true)} /></div>
    <Rng l="Fotoğraf süresi" v={photoDur} a={1} b={15} st={0.5} f={x => x + ' sn'} on={setPhotoDur} />
  </>
  else if (tool === 'audio') panel = <>
    <div className="prow"><Btn ic="music" l="Müzik / ses ekle" on={() => fAud.current?.click()} /></div>
    {sel && sel.kind !== 'text' && sel.kind !== 'image' ? <>
      <Rng l="Ses seviyesi" v={sel.vol ?? 1} a={0} b={1} f={x => Math.round(x * 100) + '%'} on={x => up({ vol: x })} />
      <Rng l="Yavaş açıl" v={sel.fadeIn ?? 0} a={0} b={5} st={0.1} f={x => x.toFixed(1) + ' sn'} on={x => up({ fadeIn: x })} />
      <Rng l="Yavaş kapan" v={sel.fadeOut ?? 0} a={0} b={5} st={0.1} f={x => x.toFixed(1) + ' sn'} on={x => up({ fadeOut: x })} />
    </> : <p className="hint">Ses ayarı için bir video veya ses klibi seç.</p>}
  </>
  else if (tool === 'text') panel = sel?.kind === 'text' ? TextEdit() : <>
    <label>Yeni metin<input value={txt} placeholder="Metni yaz…" onChange={e => setTxt(e.target.value)} /></label>
    <div className="prow"><Btn ic="plus" l="Metin ekle" dis={!txt.trim()} on={() => { addText(txt.trim()); setTxt('') }} /><Btn ic="text" l="Başlık" on={() => addText('Başlık', { size: 0.12, y: 0.5, style: 2 })} /></div>
  </>
  else if (tool === 'cc') panel = <>
    <div className="prow"><Btn ic="cc" l="Altyazı ekle" on={() => { addText('Altyazı', { dur: 2, style: 1, size: 0.05, y: 0.88, name: 'Altyazı' }); say('Metni aşağıdan düzenle') }} /><Btn ic="file" l="SRT içe aktar" on={() => fSrt.current?.click()} /><Btn ic="mic" l="Otomatik (yakında)" dis on={() => {}} /></div>
    {TextEdit()}
  </>
  else if (!sel) panel = needClip
  else if (tool === 'speed') panel = sel.kind === 'text' || sel.kind === 'image' ? <p className="hint">Hız yalnızca video ve ses klipleri için.</p> : <>
    <Chips list={['0.25x', '0.5x', '1x', '1.5x', '2x', '4x']} cur={[0.25, 0.5, 1, 1.5, 2, 4].indexOf(sel.speed ?? 1)} on={i => speedChange([0.25, 0.5, 1, 1.5, 2, 4][i])} />
    <Rng l="Hız" v={sel.speed ?? 1} a={0.25} b={4} st={0.05} f={x => x.toFixed(2) + 'x'} on={speedChange} />
  </>
  else if (!vis) panel = needVis
  else if (tool === 'fx') panel = <><Chips list={EFFECTS} cur={sel.effect ?? 0} on={i => up({ effect: i })} />{!!sel.effect && <Rng l="Şiddet" v={sel.amt ?? 0.5} a={0} b={1} on={x => up({ amt: x })} />}</>
  else if (tool === 'filter') panel = <><Chips list={FILTERS} cur={sel.filter ?? 0} on={i => up({ filter: i })} />{!!sel.filter && <Rng l="Yoğunluk" v={sel.fa ?? 1} a={0} b={1} on={x => up({ fa: x })} />}</>
  else if (tool === 'motion') panel = <>
    <Chips list={MOTIONS} cur={sel.motion ?? 0} on={i => up({ motion: i })} />
    <Rng l="Ölçek" v={sel.sc ?? 1} a={0.2} b={3} on={x => up({ sc: x })} /><Rng l="Yatay konum" v={sel.px ?? 0} a={-1} b={1} on={x => up({ px: x })} />
    <Rng l="Dikey konum" v={sel.py ?? 0} a={-1} b={1} on={x => up({ py: x })} /><Rng l="Döndür" v={sel.rot ?? 0} a={-180} b={180} st={1} f={x => Math.round(x) + '°'} on={x => up({ rot: x })} />
    <div className="prow"><Btn ic="flip" l={sel.flip ? 'Aynalı' : 'Aynala'} on={() => up({ flip: !sel.flip })} /><Btn ic="undo" l="Sıfırla" on={() => up({ motion: 0, sc: 1, px: 0, py: 0, rot: 0, flip: false })} /></div>
  </>
  else if (tool === 'trans') panel = <><Chips list={TRANS} cur={sel.trans ?? 0} on={i => up({ trans: i })} />{!!sel.trans && <Rng l="Süre" v={sel.td ?? 0.6} a={0.2} b={2} f={x => x.toFixed(1) + ' sn'} on={x => up({ td: x })} />}</>
  else if (tool === 'adj') { const a = sel.adj ?? {}; panel = <>
    <Rng l="Parlaklık" v={a.b ?? 0} a={-0.5} b={0.5} on={x => upAdj({ b: x })} /><Rng l="Kontrast" v={a.c ?? 1} a={0.5} b={1.5} on={x => upAdj({ c: x })} />
    <Rng l="Doygunluk" v={a.s ?? 1} a={0} b={2} on={x => upAdj({ s: x })} /><Rng l="Sıcaklık" v={a.temp ?? 0} a={-1} b={1} on={x => upAdj({ temp: x })} />
    <Rng l="Vinyet" v={a.vig ?? 0} a={0} b={1} on={x => upAdj({ vig: x })} /><Rng l="Keskinlik" v={a.sharp ?? 0} a={0} b={1} on={x => upAdj({ sharp: x })} />
    <Rng l="Bulanıklık" v={a.blur ?? 0} a={0} b={1} on={x => upAdj({ blur: x })} />
    <div className="prow"><Btn ic="undo" l="Sıfırla" on={() => up({ adj: undefined })} /></div></> }
  if (tool === 'size') panel = <>
    <Chips list={ASPECTS.map(a => a[0])} cur={ASPECTS.findIndex(a => a[0] === ar)} on={i => st().setAr(ASPECTS[i][0])} />
    <div className="sw">{BGS.map(c => <button key={c} className={'cs' + (bg === c ? ' on' : '')} style={{ background: c }} onClick={() => st().setBg(c)} />)}</div>
    {vis && <div className="prow"><Btn ic="fit" l={sel!.cover ? 'Doldur (açık)' : 'Sığdır (açık)'} on={() => up({ cover: !sel!.cover })} /></div>}
  </>
  const titles: Record<string, string> = { media: 'Medya', audio: 'Ses', text: 'Metin', cc: 'Altyazı', fx: 'Efektler', filter: 'Filtreler', motion: 'Hareket', trans: 'Geçiş', adj: 'Ayarla', speed: 'Hız', size: 'Boyut' }
  const clear = () => { if (confirm('Proje temizlensin mi?')) { st().reset(); setTool(''); setMenu('') } }

  return <div className="ed">
    <div className="edh">
      <button className="ib" aria-label="Geri" onClick={onBack}><Ic n="back" s={26} /></button>
      <button className="ib" aria-label="Geri al" disabled={!nPast} onClick={() => st().undo()}><Ic n="undo" /></button>
      <button className="ib" aria-label="İleri al" disabled={!nFut} onClick={() => st().redo()}><Ic n="redo" /></button>
      <button className="ib" aria-label="Menü" onClick={() => setMenu(menu === 'more' ? '' : 'more')}><Ic n="more" /></button>
      <span className="sp" />
      <button className="rs" onClick={() => setMenu(menu === 'res' ? '' : 'res')}><Ic n="hq" s={20} />{res}</button>
      <button className="exp" onClick={() => setShowExport(true)}>Dışa aktar</button>
    </div>
    {menu === 'more' && <div className="menu l" onClick={() => setMenu('')}>
      <button onClick={clear}>Projeyi temizle</button><button onClick={() => st().setPerf(!st().perfMode)}>Performans modu</button>
      <button onClick={() => say('Boşluk: oynat · S: böl · Del: sil · Ctrl+Z: geri al')}>Kısayollar</button></div>}
    {menu === 'res' && <div className="menu r">{RES.map(r => <button key={r} className={r === res ? 'on' : ''} onClick={() => { setSet({ res: r }); setMenu('') }}>{r}</button>)}</div>}
    <Preview onFps={setFps}>
      {!clips.length && <div className="empty-st">
        <div className="eorb"><Ic n="film" s={46} /></div>
        <h2>Fotoğraf veya video ile başla</h2>
        <p>Galeriden fotoğraf veya video seç; timeline üzerinde metin, efekt, hareket ve ses katmanlarıyla düzenle.</p>
        <button className="big" onClick={() => fMedia.current?.click()}><Ic n="plus" s={22} /> Fotoğraf veya video seç</button>
        <button className="big o" onClick={() => setTpl(true)}><Ic n="grid" s={22} /> Şablonla başla</button>
      </div>}
    </Preview>
    {!!clips.length && <div className="tp"><Clock /><span className="sp" /><button className="pl" aria-label="Oynat" onClick={() => { play(); buzz() }}><Ic n={playing ? 'pause' : 'tri'} s={24} /></button><span className="sp" /><span className="q">{quality}</span></div>}
    <Timeline onAdd={() => setTool('media')} />
    {tool && <div className="pn"><div className="ph"><b>{titles[tool]}</b><button className="ib s" aria-label="Kapat" onClick={() => setTool('')}><Ic n="close" s={18} /></button></div><div className="pb">{panel}</div></div>}
    <div className="tb">
      {TB('image', 'Medya', () => openTool('media'), { active: tool === 'media' })}
      {TB('music', 'Ses', () => openTool('audio'), { active: tool === 'audio' })}
      {TB('text', 'Metin', () => openTool('text'), { active: tool === 'text' })}
      {TB('cc', 'Altyazı', () => openTool('cc'), { active: tool === 'cc' })}
      {TB('fx', 'Efektler', () => openTool('fx'), { active: tool === 'fx' })}
      {TB('motion', 'Hareket', () => openTool('motion'), { active: tool === 'motion' })}
      {TB('scissors', 'Böl', () => st().split(), { dis: !sel })}
      {TB('filter', 'Filtre', () => openTool('filter'), { active: tool === 'filter' })}
      {TB('trans', 'Geçiş', () => openTool('trans'), { active: tool === 'trans' })}
      {TB('sliders', 'Ayarla', () => openTool('adj'), { active: tool === 'adj' })}
      {TB('speed', 'Hız', () => openTool('speed'), { active: tool === 'speed' })}
      {TB('dup', 'Kopyala', () => st().dup(), { dis: !sel })}
      {TB('trash', 'Sil', () => sel && st().removeClip(sel.id), { dis: !sel })}
      {TB('size', 'Boyut', () => openTool('size'), { active: tool === 'size' })}
    </div>
    <input ref={fMedia} type="file" accept="image/*,video/*" multiple hidden onChange={e => { importFiles(e.target.files); e.target.value = '' }} />
    <input ref={fCam} type="file" accept="video/*,image/*" capture="environment" hidden onChange={e => { importFiles(e.target.files); e.target.value = '' }} />
    <input ref={fAud} type="file" accept="audio/*,video/*" multiple hidden onChange={e => { importFiles(e.target.files, true); e.target.value = '' }} />
    <input ref={fSrt} type="file" accept=".srt,.vtt,text/plain" hidden onChange={e => { importSrt(e.target.files); e.target.value = '' }} />
    {tpl && <div className="modal sheet" onClick={() => setTpl(false)}><div className="card" onClick={e => e.stopPropagation()}><h3>Şablonla başla</h3>
      <div className="tpls">{TEMPLATES.map(t => <button key={t.n} onClick={() => pickTemplate(t)}><span>{t.ic}</span><b>{t.n}</b><small>{t.ar}</small></button>)}</div></div></div>}
    {import.meta.env.DEV && <div className="dbg">{fps} FPS · {quality}</div>}
    {clips.length > 8 && <div className="warn">Büyük proje: Performans modunu aç.</div>}
    {toast && <div className="toast">{toast}</div>}
    {showExport && <Suspense fallback={null}><Export onClose={() => setShowExport(false)} /></Suspense>}
  </div>
}
