# 🎛️ Adaptive UI Modality Engine

An accessibility-first web interface that **notices how you are interacting and reshapes itself** to fit. No frameworks, no build step: just HTML, CSS and JavaScript.

## Why it is useful

| Who | How the interface helps |
|-----|-------------------------|
| People with limited hand movement | Dwell-to-click eye control, voice commands and very large targets |
| Hands-free situations (cooking, gloves, public kiosks) | Voice commands and camera air-swipes |
| Everyone else | Thumb-sized buttons on phones, compact precision layout on desktop, strong focus rings for keyboard users |

It also includes an **editable communication board**: look at (or tap) a phrase and it is spoken aloud. Phrases are saved in the browser.

## Features

- **Six input modes:** Mouse, Touch, Keyboard, Voice, Gesture and Eye, with automatic detection and a manual override
- **Adaptive layouts:** each mode changes target size, spacing, focus ring and accent colour
- **Voice control** (Web Speech API): "touch mode", "dark mode", "text bigger", "next", "like", "save", "help" and more, with spoken replies
- **Gesture pad:** swipe, pinch, double tap and press-and-hold (touch or mouse)
- **Eye control:** dwell-to-click gaze pointer with adjustable dwell time; mouse or finger can simulate gaze, or use the camera head-motion pointer
- **Camera air-swipe:** wave left or right to switch modes
- **Playground gallery:** one app controlled by every input method
- **Mission tracker:** unlock all six input modes
- **Diagnostics panel:** shows which browser features are available
- Light and dark theme, adjustable text size, live event log, reduced-motion support, saved settings

## Project structure

```
adaptive-ui/
├── index.html              Page markup
├── css/styles.css          Design tokens, per-mode adaptive rules, components
├── js/
│   ├── core.js             Mode registry, detection, override, log, diagnostics
│   ├── voice.js            Speech recognition, spoken replies, command table
│   ├── gestures-eye.js     Gesture pad, dwell-click gaze pointer, camera tracking
│   ├── gallery.js          Gallery playground and editable communication board
│   └── main.js             Startup: restore settings, choose initial mode
├── .github/workflows/pages.yml   Auto-deploy to GitHub Pages
├── LICENSE
└── README.md
```

The scripts are plain classic scripts loaded in order and share globals, so no bundler is needed.

## Run it locally

Camera and microphone only work on `https://` or `http://localhost`, so use a local server instead of double-clicking the file:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repository (for example `adaptive-ui`) and push this folder to the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The included workflow publishes the site at `https://YOUR-USERNAME.github.io/adaptive-ui/`.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/adaptive-ui.git
git push -u origin main
```

Then replace `YOUR-USERNAME` and `YOUR NAME` in `index.html`, `README.md` and `LICENSE`.

## Browser support

| Feature | Chrome / Edge | Safari | Firefox |
|---------|:-:|:-:|:-:|
| Mouse, touch, keyboard, gestures | ✅ | ✅ | ✅ |
| Voice recognition | ✅ | ✅ (partial) | ❌ |
| Spoken replies | ✅ | ✅ | ✅ |
| Camera motion tracking | ✅ | ✅ | ✅ |

## Known limits

- Eye control is **dwell-to-click driven by a pointer**. The camera option tracks head and hand *motion*, not pupils, so it is coarse and needs good lighting. For true gaze tracking, integrate a library such as [WebGazer.js](https://webgazer.cs.brown.edu/) and feed its coordinates into the `tx` / `ty` variables in `js/gestures-eye.js`.
- Voice recognition needs an internet connection in most browsers and is set to English (US) in `js/voice.js`.

## Extending it

- **New voice command:** add a `[/regex/, () => 'reply']` line to the `CMDS` array in `js/voice.js`.
- **New mode:** add an entry to `MODES` in `js/core.js`, a `body.mode-yourmode` block in `css/styles.css` and a button in the mode switcher.
- **New gesture:** add it to the `G` table and the `fire()` function in `js/gestures-eye.js`.

## License

MIT, see [LICENSE](LICENSE).
