import type { Clip } from './store'
export const EFFECTS = ['Yok', 'Bulanık', 'Glitch', 'RGB Kayma', 'Piksel', 'VHS', 'Gren', 'Vinyet', 'Ayna', 'Titreme', 'Dalga', 'Parlama', 'Negatif', 'Flaş']
export const FILTERS = ['Yok', 'Canlı', 'Sıcak', 'Soğuk', 'Sinema', 'Vintage', 'Siyah-Beyaz', 'Soluk', 'Drama', 'Pembe']
export const MOTIONS = ['Yok', 'Yakınlaş', 'Uzaklaş', 'Sola Kay', 'Sağa Kay', 'Yukarı', 'Aşağı', 'Ken Burns', 'Titreşim', 'Nabız', 'Salınım', 'Dönüş']
export const TRANS = ['Yok', 'Karart', 'Yakınlaş', 'Parlama', 'Kaydır', 'Dönerek']
export const ASPECTS: [string, number][] = [['16:9', 16 / 9], ['9:16', 9 / 16], ['1:1', 1], ['4:5', 4 / 5], ['4:3', 4 / 3], ['21:9', 21 / 9]]
export const BGS = ['#000000', '#ffffff', '#1e1a2e', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6']
export const COLORS = ['#ffffff', '#ffcf5c', '#ff5d7a', '#b794ff', '#5cd6ff', '#7dff9b', '#000000']
export const TSTYLES = ['Düz', 'Kutu', 'Neon', 'Gölge']
export const arOf = (k: string) => ASPECTS.find(a => a[0] === k)?.[1] ?? 16 / 9
export const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

export type Xf = { zoom: number; px: number; py: number; rot: number; alpha: number; flash: number }
const ease = (x: number) => x * x * (3 - 2 * x)
/** Transform for a clip at timeline time t: manual sliders + motion preset + transition-in. */
export function xform(c: Clip, t: number, ca: number): Xf {
  const d = Math.max(0.01, c.dur), p = Math.min(1, Math.max(0, (t - c.start) / d)), ts = t - c.start
  let zoom = c.sc ?? 1, px = (c.px ?? 0) * ca * 0.5, py = (c.py ?? 0) * 0.5, rot = ((c.rot ?? 0) * Math.PI) / 180, alpha = 1, flash = 0
  const m = c.motion ?? 0
  if (m === 1) zoom *= 1 + 0.3 * p
  else if (m === 2) zoom *= 1.3 - 0.3 * p
  else if (m === 3) { zoom *= 1.2; px += ca * (0.1 - 0.2 * p) }
  else if (m === 4) { zoom *= 1.2; px += ca * (-0.1 + 0.2 * p) }
  else if (m === 5) { zoom *= 1.2; py += 0.1 - 0.2 * p }
  else if (m === 6) { zoom *= 1.2; py += -0.1 + 0.2 * p }
  else if (m === 7) { zoom *= 1.05 + 0.2 * p; px += ca * (0.04 - 0.08 * p) }
  else if (m === 8) { px += (Math.sin(ts * 70) * 0.012) * ca; py += Math.cos(ts * 83) * 0.012; zoom *= 1.04 }
  else if (m === 9) zoom *= 1 + 0.07 * Math.sin(ts * 7)
  else if (m === 10) { rot += 0.06 * Math.sin(ts * 3); zoom *= 1.08 }
  else if (m === 11) rot += p * Math.PI * 2
  const tr = c.trans ?? 0, td = Math.min(c.td ?? 0.6, d / 2)
  if (tr && ts < td) {
    const k = ease(ts / td)
    if (tr === 1) alpha = k
    else if (tr === 2) { alpha = k; zoom *= 1.5 - 0.5 * k }
    else if (tr === 3) { flash = 1 - k; alpha = 0.4 + 0.6 * k }
    else if (tr === 4) px += ca * (1 - k)
    else if (tr === 5) { rot += (1 - k) * 1.2; alpha = k; zoom *= 0.6 + 0.4 * k }
  }
  return { zoom: Math.max(0.05, zoom), px, py, rot, alpha, flash }
}

export const TEMPLATES = [
  { n: 'Vlog', ar: '9:16', filter: 1, effect: 0, title: 'Günlük Vlog', ic: '🎒' },
  { n: 'Sinematik', ar: '21:9', filter: 4, effect: 7, title: 'S İ N E M A', ic: '🎬' },
  { n: 'Retro VHS', ar: '4:3', filter: 5, effect: 5, title: '▶ PLAY', ic: '📼' },
  { n: 'Glitch', ar: '9:16', filter: 8, effect: 2, title: 'GLITCH', ic: '⚡' },
  { n: 'Siyah Beyaz', ar: '1:1', filter: 6, effect: 6, title: 'Anılar', ic: '🖤' },
  { n: 'Rüya', ar: '4:5', filter: 9, effect: 11, title: 'Rüya', ic: '🌸' },
]
