export const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4',
  folder: 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z', star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-2.9-5.3 2.9 1.2-6L3.4 9.3l6-.7z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0', play: 'M5 4h14v16H5zM10 9l5 3-5 3z', cc: 'M3 6h18v12H3zM10 10H8v4h2M16 10h-2v4h2',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', copy: 'M8 8h12v12H8zM4 16V4h12', wand: 'M4 20L16 8M14 6l4 4M18 3v3M16.5 4.5h3',
  plus: 'M12 5v14M5 12h14', chev: 'M9 6l6 6-6 6', bell: 'M6 17v-6a6 6 0 1112 0v6l2 2H4zM10 21h4', bolt: 'M13 3L5 14h6l-1 7 8-11h-6z'
}
export const Ic = ({ n, s = 24 }: { n: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>

Object.assign(P, {
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4', hq: 'M3 5h18v14H3zM8 9v6M12 9v6M8 12h4M16 9v6h2', speed: 'M4 18a8 8 0 1116 0M12 18l4-6',
  dl: 'M12 4v10M8 10l4 4 4-4M4 18v2h16v-2', db: 'M4 6h16v4H4zM4 14h16v4H4z', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6', mail: 'M3 6h18v12H3zM3 7l9 7 9-7', bug: 'M9 8h6v8a3 3 0 01-6 0zM9 8a3 3 0 016 0M5 10h4M15 10h4M5 15h4M15 15h4',
  list: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h4', info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v6M12 7.5v.5', medal: 'M12 3a6 6 0 100 12 6 6 0 000-12zM9 14l-2 7 5-3 5 3-2-7',
  vib: 'M8 6h8v12H8zM4 9v6M20 9v6', undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3', redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  split: 'M12 3v18M5 8h4M5 16h4M15 8h4M15 16h4', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', text: 'M5 6h14M12 6v14M9 20h6',
  vol: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 010 6', pause: 'M8 5v14M16 5v14', tri: 'M7 4l13 8-13 8z', check: 'M5 12l5 5 9-10', phone: 'M8 3h8v18H8zM11 18h2'
})
Object.assign(P, {
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', more: 'M12 5v.01M12 12v.01M12 19v.01', back: 'M15 6l-6 6 6 6', film: 'M4 8h16v12H4zM4 8l3-4h3l-3 4M11 8l3-4h3l-3 4',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9v.01', music: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  fx: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4M5 17v3M3.5 18.5h3', motion: 'M12 9a3 3 0 100 6 3 3 0 000-6zM4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  scissors: 'M6 6a2 2 0 100 4 2 2 0 000-4zM6 14a2 2 0 100 4 2 2 0 000-4zM8 9l12 9M8 15L20 6', filter: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18M3 12h9', trans: 'M3 7h8v10H3zM13 7h8v10h-8zM11 12h2',
  size: 'M4 4h16v16H4zM8 8h8v8H8z', close: 'M6 6l12 12M18 6L6 18', camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 11a3 3 0 100 6 3 3 0 000-6z', dup: 'M8 8h12v12H8zM4 16V4h12', file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  flip: 'M12 3v18M8 7L3 12l5 5zM16 7l5 5-5 5z', fit: 'M4 4h16v16H4zM9 9h6v6H9z', clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4'
})
