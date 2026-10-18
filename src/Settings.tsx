import { useState } from 'react'
import { Ic } from './icons'
import { useSettings, resetSettings } from './settings'
import { useStore } from './store'
const nx = <T,>(a: T[], v: T) => a[(a.indexOf(v) + 1) % a.length]
const INFO: Record<string, [string, string]> = {
  terms: ['Kullanım şartları', 'Lumora, kendi videolarını düzenlemen için ücretsiz bir araçtır. Yalnızca sana ait veya kullanım iznin olan videoları işle. Uygulama olduğu gibi sunulur.'],
  privacy: ['Gizlilik', 'Videoların ve projelerin cihazından çıkmaz. Hesap yoktur, sunucuya yükleme yapılmaz. Son projeler listesi yalnızca bu cihazda saklanır.'],
  contact: ['Bize ulaşın', 'GitHub: github.com/DarkXofiz/Lumora'],
  lic: ['Açık kaynak lisansları', 'React, Zustand, Vite ve Capacitor MIT lisansı ile dağıtılır.'],
  ver: ['Sürüm', 'Lumora 1.0.0 (1)']
}
const Row = ({ ic, l, v, on }: { ic: string; l: string; v?: string; on: () => void }) => <button className="srow" onClick={on}><Ic n={ic} /><span>{l}</span>{v && <em>{v}</em>}<Ic n="chev" s={18} /></button>
const Tog = ({ ic, l, v, on }: { ic: string; l: string; v: boolean; on: (b: boolean) => void }) => <div className="srow"><Ic n={ic} /><span>{l}</span><button className={'sw' + (v ? ' on' : '')} onClick={() => on(!v)}><i /></button></div>
const Sec = ({ t }: { t: string }) => <div className="sec2">{t}</div>
export function Settings() {
  const st = useSettings(), s = useStore(), [msg, setMsg] = useState(''), [info, setInfo] = useState('')
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1600) }
  const q = s.auto ? 'Otomatik' : ({ full: 'Tam', half: 'Yarım', quarter: 'Çeyrek' } as Record<string, string>)[s.quality]
  const cycleQ = () => s.auto ? s.setQuality('full') : s.quality === 'full' ? s.setQuality('half') : s.quality === 'half' ? s.setQuality('quarter') : useStore.setState({ auto: true })
  const clear = async () => { localStorage.removeItem('lumora.recent'); try { for (const k of await caches.keys()) await caches.delete(k) } catch {} flash('Önbellek temizlendi') }
  return <>
    <h1 className="eh">Ayarlar</h1><p className="es">Düzenleme deneyimini ve çıktı tercihlerini yönet.</p>
    <div className="scard"><div className="srow"><span className="av">L</span><span><b>Lumora Kullanıcısı</b><br /><small style={{ color: '#7b7690' }}>Projelerin yalnızca bu cihazda</small></span></div></div>
    <Sec t="GÖRÜNÜM" /><div className="scard"><Row ic="sun" l="Uygulama teması" v={st.theme === 'light' ? 'Açık' : 'Koyu'} on={() => st.set({ theme: st.theme === 'light' ? 'dark' : 'light' })} /></div>
    <Sec t="DÜZENLEME" /><div className="scard">
      <Row ic="sliders" l="Düzenleme tercihleri" v="Sıfırla" on={() => { resetSettings(); s.setFx({ brightness: 0, contrast: 1, saturation: 1 }); flash('Sıfırlandı') }} />
      <Row ic="cc" l="Altyazı dili" v={st.sub} on={() => st.set({ sub: nx(['Türkçe', 'English'], st.sub) })} />
      <Tog ic="vib" l="Dokunsal geri bildirim" v={st.haptic} on={b => st.set({ haptic: b })} /></div>
    <Sec t="PERFORMANS" /><div className="scard">
      <Tog ic="bolt" l="Performans modu" v={s.perfMode} on={s.setPerf} />
      <Row ic="play" l="Önizleme kalitesi" v={q} on={cycleQ} /></div>
    <Sec t="DIŞA AKTARMA" /><div className="scard">
      <Row ic="hq" l="Varsayılan çözünürlük" v={st.res} on={() => st.set({ res: nx(['720p', '1080p', '1440p'], st.res) })} />
      <Row ic="speed" l="Varsayılan kare hızı" v={st.fps + ' FPS'} on={() => st.set({ fps: nx([24, 30, 60], st.fps) })} />
      <Tog ic="dl" l="Galeriye otomatik kaydet" v={st.auto} on={b => st.set({ auto: b })} /></div>
    <Sec t="DEPOLAMA VE GİZLİLİK" /><div className="scard">
      <Row ic="db" l="Önbellek ve depolama" on={clear} /><Row ic="shield" l="Gizlilik" on={() => setInfo('privacy')} /></div>
    <Sec t="HAKKINDA" /><div className="scard">
      <Row ic="doc" l="Kullanım şartları" on={() => setInfo('terms')} /><Row ic="mail" l="Bize ulaşın" on={() => setInfo('contact')} />
      <Row ic="bug" l="Sorun bildir" on={() => window.open('https://github.com/DarkXofiz/Lumora/issues', '_blank')} />
      <Row ic="list" l="Açık kaynak lisansları" on={() => setInfo('lic')} /><Row ic="info" l="Sürüm" v="1.0.0 (1)" on={() => setInfo('ver')} /></div>
    {msg && <div className="toast">{msg}</div>}
    {info && <div className="modal" onClick={() => setInfo('')}><div className="card" style={{ color: '#14101f', background: '#fff' }}><h3>{INFO[info][0]}</h3><p>{INFO[info][1]}</p><div className="row"><button className="big" style={{ width: 'auto', padding: '10px 22px!important' }}>Tamam</button></div></div></div>}
  </>
}
