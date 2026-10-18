import { useRef, useState } from 'react'
import { Ic } from './icons'
import { useSettings } from './settings'
const MODES: [string, string, string][] = [['bolt', 'Hızlı', 'Hızlı renk düzeltme, keskinleştirme yok'], ['spark', 'Dengeli', 'Dengeli renk ve hafif keskinleştirme'], ['medal', 'Maksimum', 'Güçlü renk ve keskinleştirme'], ['sliders', 'Özel', 'Dengeli ayarlarla başlar, çözünürlüğü sen seç']]
const SH = [0, 0.25, 0.5, 0.25]
const CF = ['contrast(1.04) saturate(1.05)', 'contrast(1.08) saturate(1.12) brightness(1.02)', 'contrast(1.12) saturate(1.18) brightness(1.03)', 'contrast(1.08) saturate(1.12) brightness(1.02)']
export function Enhance({ onToast }: { onToast: (m: string) => void }) {
  const [file, setFile] = useState<File | null>(null), [mode, setMode] = useState(1), [res, setRes] = useState('Otomatik'), [keep, setKeep] = useState(true)
  const [pct, setPct] = useState(-1), [out, setOut] = useState('')
  const inp = useRef<HTMLInputElement>(null), auto = useSettings(s => s.auto)
  const save = (url: string) => { const a = document.createElement('a'); a.href = url; a.download = 'lumora-enhanced.webm'; a.click() }
  const run = async () => {
    if (!file) return onToast('Önce bir video seç')
    setPct(0); setOut('')
    const v = document.createElement('video'); v.src = URL.createObjectURL(file); v.playsInline = true; v.muted = !keep; v.preload = 'auto'
    const ok = await new Promise<boolean>(r => { v.onloadedmetadata = () => r(true); v.onerror = () => r(false) })
    if (!ok || !v.videoWidth) { setPct(-1); return onToast('Video açılamadı') }
    const th = res === 'Otomatik' ? v.videoHeight : parseInt(res), h = Math.round(th / 2) * 2, w = Math.round((h * v.videoWidth) / v.videoHeight / 2) * 2
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!
    const ms = new MediaStream(); c.captureStream(30).getVideoTracks().forEach(t => ms.addTrack(t))
    try { await v.play() } catch { v.muted = true; await v.play() }
    if (keep && !v.muted) try { (v as any).captureStream().getAudioTracks().forEach((t: MediaStreamTrack) => ms.addTrack(t)) } catch {}
    const rec = new MediaRecorder(ms, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm', videoBitsPerSecond: Math.min(20e6, w * h * 6) })
    const chunks: Blob[] = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data)
    const done = new Promise<void>(r => (rec.onstop = () => r())); v.onended = () => rec.stop()
    const f = (SH[mode] ? `url(#sh${Math.round(SH[mode] * 100)}) ` : '') + CF[mode]; let last = -1
    rec.start(1000)
    const tick = () => {
      x.filter = f; x.drawImage(v, 0, 0, w, h)
      const p = Math.round((v.currentTime / (v.duration || 1)) * 100); if (p !== last) { last = p; setPct(p) }
      if (!v.ended && rec.state === 'recording') requestAnimationFrame(tick)
    }
    tick(); await done
    const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); setOut(url); setPct(-1)
    if (auto) save(url); onToast('Video hazır')
  }
  return <>
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="sh25"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.25 0 -0.25 2 -0.25 0 -0.25 0" /></filter>
      <filter id="sh50"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.5 0 -0.5 3 -0.5 0 -0.5 0" /></filter></svg>
    <h1 className="eh">Video İyileştirme</h1><p className="es">Renkleri ve keskinliği iyileştir.</p>
    <span className="badge"><Ic n="phone" s={20} /> Cihazda işlenir</span>
    <div className="drop"><div><h3>{file ? 'Video seçildi' : 'Geliştirilecek videoyu seç'}</h3><p>{file ? file.name : 'MP4, MOV ve galeri videoları'}</p>
      <button className="big" onClick={() => inp.current?.click()}>{file ? 'Başka video seç' : '+  Video seç'}</button></div></div>
    <input ref={inp} type="file" accept="video/*" hidden onChange={e => { setFile(e.target.files?.[0] ?? null); setOut(''); e.target.value = '' }} />
    <p className="note"><Ic n="info" s={22} /> Yalnızca sana ait veya kullanım izniniz bulunan videoları yükleyin.</p>
    <h2 className="eh2">Kalite modu</h2>
    <div className="modes">{MODES.map(([ic, l], i) => <button key={l} className={'mode' + (mode === i ? ' on' : '')} onClick={() => setMode(i)}>
      {mode === i && <span className="ck"><Ic n="check" s={18} /></span>}<Ic n={ic} s={34} />{l}</button>)}</div>
    <div className="scard" style={{ marginTop: 14 }}><div className="srow"><Ic n="sliders" /><span>{MODES[mode][2]}</span></div></div>
    <h2 className="eh2">Çıktı ayarları</h2>
    <div className="scard" style={{ padding: 18 }}>
      <select className="sel" value={res} onChange={e => setRes(e.target.value)}>{['Otomatik', '720p', '1080p', '1440p'].map(r => <option key={r}>{r}</option>)}</select>
      <div className="orow"><Ic n="speed" /><span>Kare hızı</span><em>30 FPS</em></div>
      <div className="orow"><span>Orijinal sesi koru</span><button className={'sw' + (keep ? ' on' : '')} onClick={() => setKeep(!keep)}><i /></button></div>
      <p className="note" style={{ marginBottom: 0 }}>Bu işlem renk ve keskinliği iyileştirir; yapay zekâ ile yeni detay üretmez. Ses açıksa işlem sırasında duyulur.</p></div>
    {pct >= 0 && <div className="prog"><i style={{ width: pct + '%' }} /></div>}
    <button className="big" style={{ marginTop: 18, opacity: file && pct < 0 ? 1 : 0.5 }} disabled={!file || pct >= 0} onClick={run}>{pct >= 0 ? `İşleniyor %${pct}` : '✦  Kaliteyi yükselt'}</button>
    <p className="note" style={{ justifyContent: 'center' }}>Video cihazında işlenir (gerçek zamanlı) ve dosya olarak kaydedilir.</p>
    {out && <><video src={out} controls playsInline style={{ width: '100%', borderRadius: 20, background: '#000' }} /><button className="big" style={{ marginTop: 12 }} onClick={() => save(out)}>Kaydet</button></>}
  </>
}
