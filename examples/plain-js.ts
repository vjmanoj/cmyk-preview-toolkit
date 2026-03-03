/**
 * Plain JavaScript example — CMYK Preview Toolkit
 *
 * Demonstrates building a palette, snapping a sampled hex to the
 * nearest palette entry, and applying the result to element state.
 */

import {
    normalizePalette,
    findNearestPaletteEntry,
    shouldSnapToPalette,
    applyPaletteColor,
    applyCustomHexColor,
    type DualColorState,
} from '../src/index';

// 1. Build a palette from raw color data
const palette = normalizePalette([
    { source: { type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 } },
    { source: { type: 'rgb', r: 12, g: 34, b: 56 } },
]);

console.log('Palette:', palette);

// 2. Simulate a user picking a color via EyeDropper / color input
const element: DualColorState = { color: '#000000', colorSource: null };
const hexInput = '#1dc4e2';

// 3. Find the nearest palette entry
const nearest = findNearestPaletteEntry(palette, hexInput);

// 4. Decide whether to snap or use custom hex
const updated =
    nearest.entry && shouldSnapToPalette(nearest)
        ? applyPaletteColor(element, 'text', nearest.entry)
        : applyCustomHexColor(element, 'text', hexInput);

console.log('Updated element:', updated);
// => {
//      color: '<preview hex>',
//      colorSource: { type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 },
//      colorPreviewRgb: { r: ..., g: ..., b: ... }
//    }
