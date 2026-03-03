# cmyk-preview-toolkit

Dual CMYK / sRGB color handling for browser-based PDF editors.

Browsers render everything in sRGB. When pdf.js rasterizes a CMYK PDF, the preview canvas contains converted RGB pixels. If you sample those pixels and use them directly for export, CMYK fidelity is lost. This toolkit solves the problem by maintaining **dual representations** — a press-accurate source color alongside an sRGB preview — through every step of your pipeline.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **pdf.js-compatible CMYK → sRGB** polynomial conversion
- **Palette snapping** — match EyeDropper / color-input samples to the nearest source color
- **Immutable state helpers** for text, background, and border color roles
- **React hook** (`usePaletteColor`) for automatic snapping in React apps
- Full **TypeScript** types and JSDoc
- **ESM + CJS** output with tree-shaking support
- **Zero runtime dependencies**

## Installation

```bash
npm install cmyk-preview-toolkit
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

## API Reference

### Color Transforms (`cmyk-preview-toolkit`)

| Export | Description |
|---|---|
| `deviceCmykToRgb(c, m, y, k)` | Convert CMYK (0..1) to sRGB bytes using the pdf.js polynomial |
| `normalizeHex(input)` | Normalize any hex string to lowercase 6-digit `#rrggbb` |
| `hexToRgb(hex)` | Parse hex to `{ r, g, b }` |
| `rgbToHex(r, g, b)` | Format RGB bytes as hex |
| `toPreviewHex(color)` | Get sRGB hex preview from a `CMYKColor` or `RGBColor` |
| `toPreviewRgb(color)` | Get sRGB `{ r, g, b }` preview from a `CMYKColor` or `RGBColor` |
| `clamp01(n)` | Clamp to 0..1 |
| `clampByte(n)` | Clamp to 0..255 and round |

### Palette (`cmyk-preview-toolkit/palette`)

| Export | Description |
|---|---|
| `buildPaletteEntry(source, extra?)` | Build a `PaletteEntry` with computed preview fields |
| `normalizePalette(entries)` | Fill missing preview fields for an array of partial entries |
| `findNearestPaletteEntry(palette, hex, options?)` | Find the closest palette entry by RGB distance |
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
type ColorRole = 'text' | 'background' | 'border';

interface PaletteEntry {
  source: CMYKColor | RGBColor;
  previewHex: string;
  previewRgb: { r: number; g: number; b: number };
}

interface DualColorState {
  color?: string | null;
  colorSource?: unknown;
  colorPreviewRgb?: { r: number; g: number; b: number };
  bgColor?: string | null;
  bgColorSource?: unknown;
  bgColorPreviewRgb?: { r: number; g: number; b: number };
  borderColor?: string | null;
  borderColorSource?: unknown;
  borderColorPreviewRgb?: { r: number; g: number; b: number };
}

interface SnapOptions {
  maxDistance?: number;      // default: 75
  dominanceRatio?: number;  // default: 0.6
}
```

## Snap Configuration

| Option | Default | Description |
|---|---|---|
| `maxDistance` | `75` | Max Euclidean distance in RGB space for a direct snap |
| `dominanceRatio` | `0.6` | Snap if `bestDistance < secondBestDistance × ratio` |

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

## Author

**Manojkumar Vishwakarma**
- Email: [manojvistv@gmail.com](mailto:manojvistv@gmail.com)
- GitHub: [@vjmanoj](https://github.com/vjmanoj)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure all tests pass (`npm test`) and the type check succeeds (`npm run typecheck`) before submitting.

## Changelog

See [Releases](https://github.com/vjmanoj/cmyk-preview-toolkit/releases) for version history.

## License

[MIT](LICENSE) © 2026 Manojkumar Vishwakarma
