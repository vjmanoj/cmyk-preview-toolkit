/**
 * CMYK Preview Toolkit — barrel export.
 *
 * Re-exports everything from all core modules so consumers can
 * import from `cmyk-preview-toolkit` directly:
 *
 * ```ts
 * import { deviceCmykToRgb, rgbToCmyk, buildPaletteEntry, deltaE76 } from 'cmyk-preview-toolkit';
 * ```
 *
 * Subpath exports are also available:
 * - `cmyk-preview-toolkit/palette`
 * - `cmyk-preview-toolkit/state`
 * - `cmyk-preview-toolkit/react`
 *
 * @module cmyk-preview-toolkit
 */

export {
    // Types
    type CMYKColor,
    type RGBColor,
    type HSLColor,
    type ColorValue,
    // Clamping
    clamp01,
    clampByte,
    // Hex helpers
    normalizeHex,
    hexToRgb,
    rgbToHex,
    // CMYK ↔ RGB
    deviceCmykToRgb,
    rgbToCmyk,
    // HSL helpers
    hexToHsl,
    hslToHex,
    // Preview helpers
    toPreviewHex,
    toPreviewRgb,
} from './colorTransforms';

export {
    // Types
    type PaletteEntry,
    type SnapOptions,
    // Builders
    buildPaletteEntry,
    normalizePalette,
    // Distance & snapping
    rgbDistanceSq,
    findNearestPaletteEntry,
    shouldSnapToPalette,
} from './palette';

export {
    // Types
    type ColorRole,
    type DualColorState,
    // State helpers
    applyPaletteColor,
    applyCustomHexColor,
} from './state';

export {
    // Lab & perceptual distance
    rgbToLab,
    deltaE76,
} from './lab';
