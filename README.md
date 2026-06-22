# Ruler · On-Screen Ruler

[![CI](https://github.com/kenmomo2021/ruler/actions/workflows/ci.yml/badge.svg)](https://github.com/kenmomo2021/ruler/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

A cross-platform desktop utility that puts a draggable ruler on your screen. Millimeter scale, freely rotatable, length-adjustable. The window is fully transparent and frameless — only the ruler itself is visible.

> Screenshots/GIF coming soon.

## Features

- **Millimeter scale**: 1mm minor ticks, 5mm mid ticks, 10mm major ticks with numeric labels
- **Drag to move**: Left-drag on the ruler body to reposition; cursor becomes `move`
- **Resize length**: Drag either end edge of the ruler; cursor auto-selects the nearest resize variant based on the current angle, the opposite end stays fixed
- **Free rotation**: Drag the blue dot handle just outside one end; rotate to any angle; cursor is `grab` / `grabbing`
- **Click-through**: Transparent areas outside the ruler do not block desktop interaction; events are reclaimed automatically when the cursor re-enters the ruler
- **Frameless & transparent**: No title bar, transparent background, skipped from taskbar, always-on-top by default
- **Automatic DPI detection**: On launch, reads the monitor's physical dimensions (Windows via WMI) to compute the true px/mm, so the millimeter scale is physically accurate; multi-monitor setups are matched to the primary display by aspect ratio
- **Manual calibration**: Right-click menu slider for fine-tuning (0.5x – 2x relative to the auto-detected value), aligned with a physical ruler; reset to auto value or re-detect with one click
- **Quick alignment**: One-click horizontal/vertical align, reset angle from the right-click menu
- **Always-on-top toggle**: Switchable from the right-click menu
- **Persistent state**: Position, length, angle, calibration (with auto/manual distinction), and always-on-top preference are restored on next launch

## Tech Stack

| Layer       | Choice                                                    |
| ----------- | --------------------------------------------------------- |
| Framework   | Electron 33+                                              |
| Build       | electron-vite                                             |
| Language    | TypeScript (main / preload / renderer)                    |
| Rendering   | SVG (native `transform="rotate()"` + browser hit-testing) |
| Persistence | Node `fs` + `app.getPath('userData')` custom JSON store   |
| Packaging   | electron-builder                                          |

## Project Structure

```
ruler/
├── package.json
├── electron.vite.config.ts        # main/preload/renderer build config
├── electron-builder.yml           # packaging config (Win/Mac/Linux)
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── src/
│   ├── main/
│   │   ├── index.ts               # main process: transparent window, JSON store, IPC
│   │   ├── dpi.ts                 # automatic DPI detection (Windows WMI + multi-monitor matching)
│   │   └── ipc.ts                 # click-through / always-on-top / quit IPC
│   ├── preload/
│   │   └── index.ts               # contextBridge secure API
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.ts            # renderer entry, wires modules together
│           ├── ruler.ts           # SVG rendering + geometry + hit-testing
│           ├── interactions.ts    # move / resize / rotate interactions
│           ├── hit-test.ts        # click-through hit detection
│           ├── calibration.ts     # DPI calibration UI
│           ├── menu.ts            # right-click menu
│           ├── types.ts           # type declarations
│           └── styles.css
└── out/                           # build output
```

## Requirements

- Node.js >= 18 (20+ recommended)
- npm >= 9
- Windows requires WebView2 (preinstalled on Win10/11)
- If the Electron binary download times out on first install, set a mirror:
  ```powershell
  $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
  ```

## Development & Build

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Type checking
npm run typecheck

# Build only (produces out/)
npm run build

# Package executables
npm run build:win     # Windows: portable .exe + NSIS installer
npm run build:mac     # macOS: .dmg (requires macOS)
npm run build:linux   # Linux: AppImage
```

Packaged artifacts are written to `dist/`.

## Usage

On launch, a semi-transparent dark ruler appears at the center of the screen.

| Action | How                                         | Cursor                                            |
| ------ | ------------------------------------------- | ------------------------------------------------- |
| Move   | Left-drag on the ruler body                 | `move`                                            |
| Resize | Left-drag on either end edge                | `ew/ns/nesw/nwse-resize` (auto-selected by angle) |
| Rotate | Left-drag the blue dot just outside one end | `grab` / `grabbing`                               |
| Menu   | Right-click anywhere                        | —                                                 |

**Right-click menu:**

- Calibration slider (0.5x – 2x relative to the auto-detected value, live preview, shows current px/mm)
- Reset calibration (restores the auto-detected value)
- Re-detect (re-reads the monitor's physical dimensions)
- Always-on-top toggle (checkable, persisted)
- Horizontal align / Vertical align / Reset angle
- Quit

**Automatic DPI detection:** On launch, the main process reads the monitor's physical dimensions (Windows via WMI `WmiMonitorBasicDisplayParams`, in centimeters), combines them with the primary display's logical resolution from the Electron screen API, and computes the true px/mm using the diagonal method:

```
pxPerMm = sqrt(logicalW^2 + logicalH^2) / sqrt(physicalWmm^2 + physicalHmm^2)
```

For multi-monitor setups, the primary display is matched by the closest physical/logical aspect ratio. macOS/Linux currently fall back to the 96/25.4 default and can be calibrated manually.

**Calibration:** If the auto-detected value is still slightly off (WMI physical dimensions have limited precision), place a physical ruler against the screen and drag the calibration slider until the on-screen ticks align with the physical ones.

## Implementation Notes

### Transparent Window + Click-Through

The window is created with `frame:false / transparent:true / skipTaskbar:true / alwaysOnTop:true`. On launch, `setIgnoreMouseEvents(true, { forward:true })` is called — `forward:true` keeps `mousemove` events flowing to the renderer even while click-through is active, so the ruler can reclaim input when the cursor re-enters it. Hit detection lives in `hit-test.ts` and is based on point-in-rotated-rectangle tests. Click-through is paused while the right-click menu is open so menu items remain clickable.

### SVG Rendering

A single `<g transform="translate(cx,cy) rotate(angle)">` wraps all elements; children use the ruler's local coordinate system (u axis along length, v axis along thickness). The rotate handle is positioned with local coordinates `translate(halfLenPx+offset, 0)` to avoid double transforms.

### Three Interactions

On pointer-down, the starting geometry (center, unit vectors, half-length) is captured as the reference frame. Resizing projects mouse displacement onto the ruler's axial unit vector to compute the mm delta; the opposite end stays fixed and the center moves accordingly. Rotation uses `atan2(mouseY-cy, mouseX-cx)` directly.

### Persistence

A custom JSON store (`src/main/index.ts`) writes to `app.getPath('userData')/ruler-config.json`. The renderer reads/writes via IPC; writes are debounced 400ms during dragging and flushed immediately on drag end. DPI calibration distinguishes the auto value (`pxPerMmAuto`, updated on launch) from the user value (`pxPerMm`, set via the slider) using a `userCalibrated` flag: when not manually calibrated it follows the auto value, once manually adjusted it keeps the user value, and "reset calibration" restores the auto value.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, scripts, code style, commit conventions, and the PR workflow.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE). Copyright (c) 2026 kenmomo2021.
