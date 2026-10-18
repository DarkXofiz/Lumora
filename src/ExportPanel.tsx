import { useState } from 'react'
import { useStore } from './store'
import { surfaces } from './surfaces'
import { useSettings } from './settings'
import { arOf } from './fx'
import { endOf } from './Preview'
const H: Record<string, number> = { '480p': 480, '720p': 720, '1080p': 1080, '1440p': 1440, '4K': 2160 }
export default function ExportPanel({ onClose }: { onClose: () => void }) {
  const [msg, setMsg] = useState('Proje tek seferde oynatılarak WebM dosyasına kaydedilir (gerçek zamanlı).'), [pct, setPct] = useState(0), [busy, setBusy] = useState(false)
  const run = async () => {
    const st = useStore.getState(), g = surfaces.gl, tx = surfaces.txt, v = surfaces.video, end = endOf(st.clips)
    if (!g || !tx || !v || !end) return setMsg('Önce bir klip ekle.')
    setBusy(true); const q = st.quality, au = st.auto; st.setQuality('full'); useStore.setState({ auto: false })
    const sh = H[useSettings.getState().res] ?? 1080, ar = arOf(st.ar), ev = (n: number) => Math.round(n / 2) * 2
    const out = document.createElement('canvas'), ctx = out.getContext('2d')!
    out.width = ev(ar >= 1 ? sh * ar : sh); out.height = ev(ar >= 1 ? sh : sh / ar)
    const ms = new MediaStream(); out.captureStream(useSettings.getState().fps).getVideoTracks().forEach(t => ms.addTrack(t))
    try { // video + müzik seslerini tek parçada karıştır
      const ac = new AudioContext(), dest = ac.createMediaStreamDestination()
      const srcs = [v, ...surfaces.audio.values()]
      srcs.forEach(el => { try { const s = (el as any).captureStream(); if (s.getAudioTracks().length) ac.createMediaStreamSource(s).connect(dest) } catch {} })
      dest.stream.getAudioTracks().forEach(t => ms.addTrack(t))
    } catch {}
    const rec = new MediaRecorder(ms, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm', videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data)
    const done = new Promise<void>(r => (rec.onstop = () => r()))
    st.setPlayhead(0); st.setPlaying(true); rec.start(1000); setMsg('Dışa aktarılıyor…')
    const tick = () => {
      const s = useStore.getState(); ctx.drawImage(g, 0, 0, out.width, out.height); ctx.drawImage(tx, 0, 0, out.width, out.height)
      setPct(Math.min(100, (s.playhead / end) * 100))
      if (s.playing && s.playhead < end) requestAnimationFrame(tick); else rec.stop()
    }
    requestAnimationFrame(tick); await done
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); a.download = 'lumora-export.webm'; a.click()
    st.setPlaying(false); st.setQuality(q); useStore.setState({ auto: au }); setBusy(false); setPct(100); setMsg('Bitti. Dosya indirildi.')
  }
  return <div className="modal"><div className="card"><h3>Dışa aktar</h3><p>{msg}</p><progress value={pct} max={100} />
    <div className="row"><button onClick={onClose} disabled={busy}>Kapat</button><button className="pri" onClick={run} disabled={busy}>Başlat</button></div></div></div>
}
