import { create } from 'zustand'
import { isPhone, Quality } from './perf'
export type Clip = {
  id: string; name: string; url: string; start: number; dur: number; trim: number; track: number
  kind?: 'video' | 'image' | 'text' | 'audio'; text?: string; vol?: number; speed?: number; src?: number
  effect?: number; amt?: number; filter?: number; fa?: number
  adj?: { b?: number; c?: number; s?: number; temp?: number; vig?: number; sharp?: number; blur?: number }
  motion?: number; sc?: number; px?: number; py?: number; rot?: number; flip?: boolean; cover?: boolean; trans?: number; td?: number
  color?: string; size?: number; y?: number; style?: number; fadeIn?: number; fadeOut?: number
}
type S = {
  past: Clip[][]; future: Clip[][]; snap: () => void; undo: () => void; redo: () => void
  clips: Clip[]; playhead: number; playing: boolean; selected: string | null
  quality: Quality; auto: boolean; perfMode: boolean
  fx: { brightness: number; contrast: number; saturation: number }
  ar: string; bg: string; tpl: { filter: number; effect: number } | null
  addClip: (c: Clip) => void; updateClip: (id: string, p: Partial<Clip>) => void; removeClip: (id: string) => void
  setPlayhead: (t: number) => void; setPlaying: (p: boolean) => void; select: (id: string | null) => void
  setQuality: (q: Quality, auto?: boolean) => void; setPerf: (p: boolean) => void
  setFx: (p: Partial<S['fx']>) => void; split: () => void; dup: () => void
  setAr: (a: string) => void; setBg: (b: string) => void; setTpl: (t: S['tpl']) => void; reset: () => void
}
export const useStore = create<S>((set, get) => ({
  past: [], future: [],
  snap: () => set(s => ({ past: [...s.past.slice(-50), s.clips], future: [] })),
  undo: () => set(s => s.past.length ? { future: [s.clips, ...s.future], clips: s.past[s.past.length - 1], past: s.past.slice(0, -1), selected: null } : s),
  redo: () => set(s => s.future.length ? { past: [...s.past, s.clips], clips: s.future[0], future: s.future.slice(1), selected: null } : s),
  clips: [], playhead: 0, playing: false, selected: null,
  quality: isPhone ? 'half' : 'full', auto: true, perfMode: isPhone,
  fx: { brightness: 0, contrast: 1, saturation: 1 },
  ar: '16:9', bg: '#000000', tpl: null,
  addClip: c => set(s => ({ past: [...s.past.slice(-50), s.clips], future: [], clips: [...s.clips, c], selected: c.id })),
  updateClip: (id, p) => set(s => ({ clips: s.clips.map(c => (c.id === id ? { ...c, ...p } : c)) })),
  removeClip: id => set(s => ({ past: [...s.past.slice(-50), s.clips], future: [], clips: s.clips.filter(c => c.id !== id), selected: null })),
  setPlayhead: t => set({ playhead: Math.max(0, t) }),
  setPlaying: playing => set({ playing }),
  select: selected => set({ selected }),
  setQuality: (quality, auto = false) => set(s => ({ quality, auto: auto ? s.auto : false })),
  setPerf: perfMode => set({ perfMode, quality: perfMode ? 'half' : 'full' }),
  setFx: p => set(s => ({ fx: { ...s.fx, ...p } })),
  setAr: ar => set({ ar }), setBg: bg => set({ bg }), setTpl: tpl => set({ tpl }),
  reset: () => set({ clips: [], past: [], future: [], playhead: 0, playing: false, selected: null, ar: '16:9', bg: '#000000', tpl: null, fx: { brightness: 0, contrast: 1, saturation: 1 } }),
  split: () => {
    const { clips, playhead, selected } = get(); const c = clips.find(x => x.id === selected)
    if (!c || playhead <= c.start + 0.05 || playhead >= c.start + c.dur - 0.05) return
    const a = playhead - c.start; get().snap()
    set({ clips: [...clips.filter(x => x !== c), { ...c, dur: a },
      { ...c, id: crypto.randomUUID(), start: playhead, dur: c.dur - a, trim: c.trim + a * (c.speed ?? 1), trans: 0 }] })
  },
  dup: () => {
    const { clips, selected } = get(); const c = clips.find(x => x.id === selected); if (!c) return
    get().addClip({ ...c, id: crypto.randomUUID(), start: c.start + c.dur })
  },
}))
