# Lumora
Browser video editor. No login, opens straight to the editor.

## Run
    npm install
    npm run dev

## Deploy (GitHub Pages)
Push to `main`; Settings > Pages > Source: GitHub Actions. The service worker adds COOP/COEP on first load (page reloads once).

## Done
Yeni Proje → boş editör ekranı (Fotoğraf/video seç, Şablonla başla). Araç çubuğu: Medya, Ses, Metin, Altyazı (manuel + SRT), Efektler (13), Filtre (9), Hareket (11 + ölçek/konum/döndür/aynala), Geçiş (5), Ayarla (7), Hız, Böl, Kopyala, Sil, Boyut (6 oran + arka plan). Fotoğraf + ses klipleri, ortalanmış playhead'li timeline (pinch zoom), şablonlar, 480p–4K dışa aktarma, ses karışımı.

WebGL preview + color adjust, adaptive quality, performance mode, virtualized canvas timeline (move, trim both edges, split, delete), undo/redo (Ctrl+Z / Ctrl+Y), text overlays, per-clip volume and speed, real WebM export (real time), service worker cache + COOP/COEP, dev FPS/memory meter.

## Not done yet
WebCodecs decode, 480p proxies, IndexedDB thumbnails/waveforms, ffmpeg.wasm export (faster than real time, MP4), auto captions (speech-to-text), motion tracking, background removal, project save/load.
