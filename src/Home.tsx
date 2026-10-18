import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
export type Recent = { name: string; dur: number; ts: number; thumb?: string }
const KEY = 'lumora.recent'
export const loadRecent = (): Recent[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
export const saveRecent = (r: Recent) => { try { localStorage.setItem(KEY, JSON.stringify([r, ...loadRecent().filter(x => x.name !== r.name)].slice(0, 20))) } catch {} }
const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4',
  folder: 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z', star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-2.9-5.3 2.9 1.2-6L3.4 9.3l6-.7z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0', play: 'M5 4h14v16H5zM10 9l5 3-5 3z', cc: 'M3 6h18v12H3zM10 10H8v4h2M16 10h-2v4h2',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', copy: 'M8 8h12v12H8zM4 16V4h12', wand: 'M4 20L16 8M14 6l4 4M18 3v3M16.5 4.5h3',
  plus: 'M12 5v14M5 12h14', chev: 'M9 6l6 6-6 6', bell: 'M6 17v-6a6 6 0 1112 0v6l2 2H4zM10 21h4', bolt: 'M13 3L5 14h6l-1 7 8-11h-6z'
}
const Ic = ({ n, s = 24 }: { n: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
const fmt = (t: number) => `${String((t / 60) | 0).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`
const ago = (ts: number) => { const d = new Date(ts); return (new Date().toDateString() === d.toDateString() ? 'Bugün' : d.toLocaleDateString('tr-TR')) + ' · ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
const TOOLS = [['play', 'Video Düzenle', 'edit'], ['spark', 'Kalite Artır', ''], ['cc', 'Otomatik Altyazı', ''], ['grid', 'Şablonlar', 'tpl'], ['copy', 'Referans Edit', ''], ['wand', 'Otomatik İyileştir', '']]
const SLIDES = [['KASMA YOK', 'Akıcı önizleme. Her telefonda.', 'GPU ile çizilir, kalite cihaza göre otomatik ayarlanır.', 'Performans ayarları', 'perf'],
  ['HESAP YOK', 'Aç ve kes.', 'Giriş yapmadan, doğrudan düzenlemeye başla.', 'Hemen başla', 'new']]

export function Home({ open }: { open: (importNow: boolean) => void }) {
  const [tab, setTab] = useState(0), [slide, setSlide] = useState(0), [toast, setToast] = useState('')
  const perf = useStore(s => s.perfMode), setPerf = useStore(s => s.setPerf), [recent] = useState(loadRecent)
  const car = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 1600); return () => clearTimeout(t) }, [toast])
  const tool = (k: string) => k === 'edit' ? open(false) : k === 'tpl' ? setTab(3) : setToast('Yakında')
  const Tool = ([ic, name, k]: string[]) => <button key={name} className="tool" onClick={() => tool(k)}><span className="ti"><Ic n={ic} s={32} />{!['edit', 'tpl'].includes(k) && <i className="dot" />}</span>{name}</button>
  const Proj = (r: Recent) => <button key={r.name} className="proj" onClick={() => open(false)}>
    <div className="th" style={r.thumb ? { backgroundImage: `url(${r.thumb})` } : undefined}><b>{fmt(r.dur)}</b></div><h4>{r.name}</h4><small>{ago(r.ts)}</small></button>
  const Empty = ({ t }: { t: string }) => <p className="empty">{t}</p>
  return <div className="home">
    <div className="hscroll">
      {tab === 0 && <>
        <button className="pill" onClick={() => setPerf(!perf)}><Ic n="bolt" s={18} /> Performans modu: {perf ? 'Açık' : 'Kapalı'} <Ic n="chev" s={16} /></button>
        <div className="top"><h1>Lumora</h1><button className="bell" onClick={() => setToast('Bildirim yok')}><Ic n="bell" /></button><div className="av">L</div></div>
        <p className="sub">Yeni bir şeyler oluşturalım</p><p className="sub2">Bugün ne keseceğiz?</p>
        <div className="car" ref={car} onScroll={e => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {SLIDES.map(([tag, h, p, b, a]) => <div className="slide" key={tag}><span className="tag">{tag}</span><h2>{h}</h2><p>{p}</p>
            <button onClick={() => a === 'new' ? open(true) : setTab(4)}>{b} <Ic n="chev" s={16} /></button></div>)}
          <div className="dots">{SLIDES.map((_, i) => <i key={i} className={i === slide ? 'on' : ''} />)}</div></div>
        <button className="newp" onClick={() => open(true)}><span className="plus"><Ic n="plus" s={36} /></span><span><b>Yeni Proje</b><small>Sıfırdan başla</small></span><span className="go"><Ic n="chev" /></span></button>
        <div className="sec"><h3>Hızlı Araçlar</h3><button onClick={() => setTab(1)}>Tüm araçlar <Ic n="chev" s={16} /></button></div>
        <div className="tools">{TOOLS.map(Tool)}</div>
        <div className="sec"><h3>Son Projeler</h3><button onClick={() => setTab(2)}>Tümünü gör <Ic n="chev" s={16} /></button></div>
        {recent.length ? <div className="projs">{recent.slice(0, 6).map(Proj)}</div> : <Empty t="Henüz proje yok. Yeni Proje ile başla." />}
        <div className="soon"><span className="plus sm"><Ic n="grid" s={30} /></span><div><b>Şablonlar <em>YAKINDA</em></b><p>Tek dokunuşla kullanılacak hazır editler hazırlanıyor.</p></div></div>
      </>}
      {tab === 1 && <><h1 className="pt">Araçlar</h1><div className="tools">{TOOLS.map(Tool)}</div></>}
      {tab === 2 && <><h1 className="pt">Projeler</h1>{recent.length ? <div className="projs">{recent.map(Proj)}</div> : <Empty t="Henüz proje yok." />}</>}
      {tab === 3 && <><h1 className="pt">Şablonlar</h1><div className="soon"><span className="plus sm"><Ic n="grid" s={30} /></span><div><b>Şablonlar <em>YAKINDA</em></b><p>Tek dokunuşla kullanılacak hazır editler hazırlanıyor.</p></div></div></>}
      {tab === 4 && <><h1 className="pt">Ben</h1><div className="soon"><div><b>Performans modu</b><p>Telefonda ağır efektleri hafifletir ve önizlemeyi küçültür.</p>
        <button className="pill" onClick={() => setPerf(!perf)}>{perf ? 'Açık' : 'Kapalı'}</button></div></div></>}
      <div style={{ height: 110 }} />
    </div>
    {toast && <div className="toast">{toast}</div>}
    <nav>{[['home', 'Ana Sayfa'], ['spark', 'Araçlar'], ['folder', 'Projeler'], ['star', 'Şablonlar'], ['user', 'Ben']].map(([ic, l], i) =>
      <button key={l} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}><Ic n={ic} />{l}</button>)}</nav>
  </div>
}
