# Zaki's Market POS — Offline Windows Desktop App

A self-contained point-of-sale and inventory system that runs as a Windows
desktop app via Electron. 100% offline — all data is stored in the browser's
localStorage inside the app window. No internet, no server, no database.

## What's inside

```
electron/
├── main.js            # Electron main process (window, menu, security)
├── preload.js         # Isolated bridge (auto-focuses scan field on launch)
├── package.json       # Electron + electron-builder config
├── app/
│   └── index.html     # The full POS app (HTML + CSS + JS inlined)
└── build/
    └── icon.ico       # App icon (replace with your own)
.github/workflows/
└── build.yml          # GitHub Actions: builds Windows EXE automatically
```

## Run locally on your PC

1. Install Node.js 20+ from https://nodejs.org
2. Open a terminal in the `electron/` folder:

   ```bash
   npm install
   npm start
   ```

The POS window opens. Plug in your USB/Bluetooth barcode scanner and start
selling — the scan field is auto-focused, so the scanner's keystrokes land
directly in it and Enter adds the product.

## Build the Windows EXE yourself

```bash
cd electron
npm install
npm run dist
```

This produces, inside `electron/release/`:
- An **NSIS installer** (`ZakiMarket-POS-1.0.0-x64.exe`) — install it normally.
- A **portable EXE** (`ZakiMarket-POS-1.0.0-portable.exe`) — run it without installing.

## Automatic builds via GitHub

1. Push the whole project to a GitHub repository.
2. Go to the **Actions** tab on GitHub. The workflow `.github/workflows/build.yml`
   runs on every push to `main`/`master` and on any tag starting with `v`
   (e.g. `v1.0.0`).
3. When it finishes, click the run → scroll to **Artifacts** → download the
   `ZakiMarket-POS-windows` zip, which contains the EXE files.
4. On a tagged release, the EXE is also attached to the GitHub Release page.

## Rebuilding the app HTML

The `electron/app/index.html` is a single-file build of the React app. After
editing files under `src/`, rebuild it:

```bash
npm install
npm run build        # produces dist/
npx vite build --config vite.singlefile.config.ts   # inlines into one file
cp dist-singlefile/index.html electron/app/index.html
```

## Barcode scanner

A USB or Bluetooth HID scanner acts like a keyboard: it types the barcode fast
and presses Enter. The app keeps the scan field focused at all times, so:
- Scanning adds the product to the cart instantly (or +1 if already there).
- A green flash + short beep confirms a successful add.
- An unknown barcode shows a "not found" alert.

No camera is used — the app is lighter and faster.
