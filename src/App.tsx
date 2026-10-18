import { useEffect, useState } from 'react'
import { useStore } from './store'
import { Home } from './Home'
import { Editor } from './Editor'
import { useSettings } from './settings'

function Intro({ done }: { done: () => void }) {
  useEffect(() => { import('./ExportPanel'); const t = setTimeout(done, 2200); return () => clearTimeout(t) }, [])
  return <div className="intro"><div className="orb" /><h1>Lumora</h1></div>
}

export function App() {
  const [view, setView] = useState<'home' | 'editor'>('home'), [intro, setIntro] = useState(true)
  const theme = useSettings(x => x.theme)
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  // open(true) = "Yeni Proje": temiz bir proje ile boş editör ekranı açılır (dosya seçici kendiliğinden açılmaz)
  const open = (fresh: boolean) => { if (fresh) useStore.getState().reset(); setView('editor') }
  return <>
    {intro && <Intro done={() => setIntro(false)} />}
    {view === 'home' && !intro && <Home open={open} />}
    {view === 'editor' && <Editor onBack={() => { useStore.getState().setPlaying(false); setView('home') }} />}
  </>
}
