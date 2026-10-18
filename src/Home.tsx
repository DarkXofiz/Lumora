import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
export type Recent = { name: string; dur: number; ts: number; thumb?: string }
const KEY = 'lumora.recent'
export const loadRecent = (): Recent[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
export const saveRecent = (r: Recent) => { try { localStorage.setItem(KEY, JSON.stringify([r, ...loadRecent().filter(x => x.name !== r.name)].slice(0, 20))) } catch {} }
import { Ic } from './icons'
import { Enhance } from './Enhance'
import { Settings } from './Settings'
import { buzz } from './settings'
const fmt = (t: number) => `${String((t / 60) | 0).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`
const ago = (ts: number) => { const d = new Date(ts); return (new Date().toDateString() === d.toDateString() ? 'Bugün' : d.toLocaleDateString('tr-TR')) + ' · ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
const TOOLS = [['play', 'Video Düzenle', 'edit'], ['spark', 'Kalite Artır', 'q'], ['cc', 'Otomatik Altyazı', ''], ['grid', 'Şablonlar', 'tpl'], ['copy', 'Referans Edit', ''], ['wand', 'Otomatik İyileştir', 'q']]
const SLIDES = [['KASMA YOK', 'Akıcı önizleme. Her telefonda.', 'GPU ile çizilir, kalite cihaza göre otomatik ayarlanır.', 'Performans ayarları', 'perf'],
  ['HESAP YOK', 'Aç ve kes.', 'Giriş yapmadan, doğrudan düzenlemeye başla.', 'Hemen başla', 'new']]

export function Home({ open }: { open: (importNow: boolean) => void }) {
  const [tab, setTab] = useState(0), [slide, setSlide] = useState(0), [toast, setToast] = useState('')
  const perf = useStore(s => s.perfMode), setPerf = useStore(s => s.setPerf), recent = loadRecent()
  const car = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 1600); return () => clearTimeout(t) }, [toast])
  const tool = (k: string) => k === 'edit' ? open(false) : k === 'tpl' ? setTab(3) : k === 'q' ? setTab(1) : setToast('Yakında')
  const Tool = ([ic, name, k]: string[]) => <button key={name} className="tool" onClick={() => tool(k)}><span className="ti"><Ic n={ic} s={32} />{!['edit', 'tpl', 'q'].includes(k) && <i className="dot" />}</span>{name}</button>
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
      {tab === 1 && <Enhance onToast={setToast} />}
      {tab === 2 && <><h1 className="pt">Projeler</h1>{recent.length ? <div className="projs">{recent.map(Proj)}</div> : <Empty t="Henüz proje yok." />}</>}
      {tab === 3 && <><h1 className="pt">Şablonlar</h1><div className="soon"><span className="plus sm"><Ic n="grid" s={30} /></span><div><b>Şablonlar <em>YAKINDA</em></b><p>Tek dokunuşla kullanılacak hazır editler hazırlanıyor.</p></div></div></>}
      {tab === 4 && <Settings />}
      <div style={{ height: 110 }} />
    </div>
    {toast && <div className="toast">{toast}</div>}
    <nav>{[['home', 'Ana Sayfa'], ['spark', 'Araçlar'], ['folder', 'Projeler'], ['star', 'Şablonlar'], ['user', 'Ben']].map(([ic, l], i) =>
      <button key={l} className={tab === i ? 'on' : ''} onClick={() => { setTab(i); buzz() }}><Ic n={ic} />{l}</button>)}</nav>
  </div>
}
