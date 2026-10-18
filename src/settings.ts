import { create } from 'zustand'
const K = 'lumora.settings'
type V = { res: string; fps: number; auto: boolean; theme: 'light' | 'dark'; haptic: boolean; sub: string }
type S = V & { set: (p: Partial<V>) => void }
const def: V = { res: '1080p', fps: 30, auto: true, theme: 'light', haptic: true, sub: 'Türkçe' }
const load = (): V => { try { return { ...def, ...JSON.parse(localStorage.getItem(K) || '{}') } } catch { return def } }
export const useSettings = create<S>(set => ({ ...load(), set: p => set(p) }))
useSettings.subscribe(st => { const { set: _s, ...v } = st; try { localStorage.setItem(K, JSON.stringify(v)) } catch {} })
export const resetSettings = () => useSettings.getState().set(def)
export const buzz = () => { if (useSettings.getState().haptic) navigator.vibrate?.(12) }
