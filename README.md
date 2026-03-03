# cmyk-preview-toolkit

**Press-accurate CMYK colors in the browser — zero dependencies, full TypeScript.**

Browsers render everything in sRGB. When pdf.js rasterizes a CMYK PDF, the preview canvas contains converted RGB pixels. If you sample those pixels and use them directly for export, CMYK fidelity is lost. This toolkit solves the problem by maintaining **dual representations** — a press-accurate source color alongside an sRGB preview — through every step of your pipeline.

[![npm version](https://img.shields.io/npm/v/cmyk-preview-toolkit.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/cmyk-preview-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/cmyk-preview-toolkit.svg?style=flat-square&color=4dc71f)](https://www.npmjs.com/package/cmyk-preview-toolkit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/cmyk-preview-toolkit?style=flat-square&color=6c5ce7&label=size)](https://bundlephobia.com/package/cmyk-preview-toolkit)
[![CI](https://img.shields.io/github/actions/workflow/status/vjmanoj/cmyk-preview-toolkit/ci.yml?style=flat-square&label=CI)](https://github.com/vjmanoj/cmyk-preview-toolkit/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Who Is This For?

- 🖨️ **PDF editor developers** who need accurate CMYK export from a browser-based canvas
- 🎨 **Print & prepress tool builders** who want color-accurate previews without ICC profile complexity
- ⚛️ **React developers** building color pickers that should snap to a brand palette
- 🔧 **Anyone converting between CMYK, RGB, HSL, or CIE Lab** in JavaScript/TypeScript

## Why cmyk-preview-toolkit?

| Approach | Bundle Size | CMYK Fidelity | Browser-Native | Setup |
|---|---|---|---|---|
| **cmyk-preview-toolkit** | **~3 KB** | ✅ Dual representation | ✅ Pure JS | `npm install` |
| MuPDF / PDFium WASM | 5–15 MB | ✅ Full ICC | ❌ WASM required | Complex |
| Manual conversion | 0 KB | ⚠️ Ad-hoc, error-prone | ✅ | DIY |
| Ignoring CMYK | 0 KB | ❌ Colors shift | ✅ | None |

## Features

- **pdf.js-compatible CMYK → sRGB** polynomial conversion
- **RGB → CMYK** (GCR approximation) for reverse conversion
- **HSL color space** helpers (`hexToHsl`, `hslToHex`)
- **CIE76 Delta-E** perceptual distance metric for palette snapping
- **Palette snapping** — match EyeDropper / color-input samples to the nearest source color
- **Immutable state helpers** for text, background, and border color roles
- **React hook** (`usePaletteColor`) for automatic snapping in React apps
- Full **TypeScript** types and JSDoc
- **ESM + CJS** output with tree-shaking support
- **Zero runtime dependencies**
- **GitHub Actions CI** on Node 18/20/22

## Installation

```bash
npm install cmyk-preview-toolkit
```

```bash
# or with yarn / pnpm
yarn add cmyk-preview-toolkit
pnpm add cmyk-preview-toolkit
```

## Quick Start

### Plain JavaScript / TypeScript

```ts
import {
  normalizePalette,
  findNearestPaletteEntry,
  shouldSnapToPalette,
  applyPaletteColor,
  applyCustomHexColor,
} from 'cmyk-preview-toolkit';

// 1. Build a palette from your PDF template colors
const palette = normalizePalette([
  { source: { type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 } },
  { source: { type: 'rgb', r: 12, g: 34, b: 56 } },
]);

// 2. User picks a color via EyeDropper or color input
const element = { color: '#000000', colorSource: null };
const hexInput = '#1dc4e2';

// 3. Snap to nearest palette entry if close enough
const nearest = findNearestPaletteEntry(palette, hexInput);
const updated =
  nearest.entry && shouldSnapToPalette(nearest)
    ? applyPaletteColor(element, 'text', nearest.entry)
    : applyCustomHexColor(element, 'text', hexInput);

console.log(updated);
// => {
//   color: '#...',
//   colorSource: { type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 },
//   colorPreviewRgb: { r: ..., g: ..., b: ... }
// }
```

### React

```tsx
import { usePaletteColor } from 'cmyk-preview-toolkit/react';

const ColorPicker = ({ element, palette, onChange }) => {
  const { setHexColor } = usePaletteColor(element, {
    palette,
    onUpdate: onChange,
    options: { maxDistance: 80, dominanceRatio: 0.55 },
  });

  return (
    <input
      type="color"
      value={element.color ?? '#000000'}
      onChange={(e) => setHexColor('text', e.target.value)}
    />
  );
};
```

### Color Conversion Utilities

```ts
import {
  deviceCmykToRgb,
  rgbToCmyk,
  hexToHsl,
  hslToHex,
  rgbToLab,
  deltaE76,
} from 'cmyk-preview-toolkit';

// CMYK → RGB
const [r, g, b] = deviceCmykToRgb(0.11, 0.24, 0.0, 0.13);

// RGB → CMYK
const { c, m, y, k } = rgbToCmyk(200, 100, 50);

// Hex → HSL → Hex
const hsl = hexToHsl('#ff6347');  // { h: 9, s: 100, l: 64 }
const hex = hslToHex(9, 100, 64); // '#ff6347'

// Perceptual color distance (CIE76)
const distance = deltaE76({ r: 255, g: 0, b: 0 }, { r: 250, g: 10, b: 5 });
```

## API Reference

### Color Transforms (`cmyk-preview-toolkit`)

| Export | Description |
|---|---|
| `deviceCmykToRgb(c, m, y, k)` | Convert CMYK (0..1) to sRGB bytes using the pdf.js polynomial |
| `rgbToCmyk(r, g, b)` | Convert sRGB bytes to CMYK using GCR approximation |
| `normalizeHex(input)` | Normalize any hex string to lowercase 6-digit `#rrggbb` |
| `hexToRgb(hex)` | Parse hex to `{ r, g, b }` |
| `rgbToHex(r, g, b)` | Format RGB bytes as hex |
| `hexToHsl(hex)` | Parse hex to `{ h, s, l }` (h: 0..360, s/l: 0..100) |
| `hslToHex(h, s, l)` | Format HSL values as hex |
| `toPreviewHex(color)` | Get sRGB hex preview from a `CMYKColor` or `RGBColor` |
| `toPreviewRgb(color)` | Get sRGB `{ r, g, b }` preview from a `CMYKColor` or `RGBColor` |
| `clamp01(n)` | Clamp to 0..1 |
| `clampByte(n)` | Clamp to 0..255 and round |

### Lab & Perceptual Distance

| Export | Description |
|---|---|
| `rgbToLab(r, g, b)` | Convert sRGB bytes to CIE Lab (D65 illuminant) |
| `deltaE76(a, b)` | CIE76 Delta-E distance between two `{ r, g, b }` colors |

### Palette (`cmyk-preview-toolkit/palette`)

| Export | Description |
|---|---|
| `buildPaletteEntry(source, extra?)` | Build a `PaletteEntry` with computed preview fields |
| `normalizePalette(entries)` | Fill missing preview fields for an array of partial entries |
| `findNearestPaletteEntry(palette, hex, options?)` | Find the closest palette entry (supports RGB and Delta-E distance) |
| `shouldSnapToPalette(result, options?)` | Decide if the nearest match is close enough to snap |
| `rgbDistanceSq(a, b)` | Squared Euclidean distance between two RGB colors |

### State (`cmyk-preview-toolkit/state`)

| Export | Description |
|---|---|
| `applyPaletteColor(element, role, entry)` | Set preview + source from a palette entry (immutable) |
| `applyCustomHexColor(element, role, hex)` | Set preview from hex, clear source (immutable) |

### React (`cmyk-preview-toolkit/react`)

| Export | Description |
|---|---|
| `usePaletteColor(element, options)` | Hook returning `{ setHexColor }` with auto-snap logic |

## Types

```ts
type CMYKColor = { type: 'cmyk'; c: number; m: number; y: number; k: number };
type RGBColor  = { type: 'rgb';  r: number; g: number; b: number };
type HSLColor  = { type: 'hsl';  h: number; s: number; l: number };
type ColorRole = 'text' | 'background' | 'border';

interface SnapOptions {
  maxDistance?: number;        // default: 75 (RGB) or ~10 (Delta-E)
  dominanceRatio?: number;    // default: 0.6
  distanceMetric?: 'rgb' | 'deltaE76';  // default: 'rgb'
}
```

## Snap Configuration

| Option | Default | Description |
|---|---|---|
| `maxDistance` | `75` | Max distance for a direct snap |
| `dominanceRatio` | `0.6` | Snap if `bestDistance < secondBestDistance × ratio` |
| `distanceMetric` | `'rgb'` | `'rgb'` for Euclidean sRGB, `'deltaE76'` for perceptual Lab |

## Integrating with pdf-lib

When exporting with pdf-lib, use the `colorSource` field (not the preview hex):

```ts
import { PDFDocument, cmyk, rgb } from 'pdf-lib';

const source = element.colorSource;
if (source?.type === 'cmyk') {
  page.drawText('Hello', { color: cmyk(source.c, source.m, source.y, source.k) });
} else {
  const hex = element.color ?? '#000000';
  const { r, g, b } = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  page.drawText('Hello', { color: rgb(r / 255, g / 255, b / 255) });
}
```

## Data Model Invariants

- All hex values are lowercase 6-digit strings (`#1dc4e2`)
- `previewRgb` always corresponds to `previewHex`
- `source` is the authority for export — CMYK channels are 0..1 fractions, RGB channels are 0..255 bytes
- Undo/redo and copy/paste must keep both preview and source in sync

## Why Not Full ICC Profiles?

Full color-managed renderers (MuPDF, PDFium, Ghostscript) deliver pixel-perfect CMYK previews but require large WASM bundles, ICC profile management, and custom hit-testing. The dual representation approach is lightweight, browser-native, and good enough for most web-based PDF editors.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Quick version:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure all tests pass (`npm test`) and the type check succeeds (`npm run typecheck`) before submitting.

## Community & Support

- 🐛 **Bug reports** — [Open an issue](https://github.com/vjmanoj/cmyk-preview-toolkit/issues)
- 💡 **Feature requests** — [Start a discussion](https://github.com/vjmanoj/cmyk-preview-toolkit/discussions)
- 🏷️ **Good first issues** — [Browse](https://github.com/vjmanoj/cmyk-preview-toolkit/labels/good%20first%20issue) if you want to contribute
- ⭐ **If this toolkit helps you, [star the repo](https://github.com/vjmanoj/cmyk-preview-toolkit)** — it helps others discover it!

## Author

**Manojkumar Vishwakarma**
- Email: [manojvistv@gmail.com](mailto:manojvistv@gmail.com)
- GitHub: [@vjmanoj](https://github.com/vjmanoj)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

[MIT](LICENSE) © 2026 Manojkumar Vishwakarma
