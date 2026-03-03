/**
 * State helpers for the CMYK Preview Toolkit.
 *
 * Provides immutable update functions that apply palette or custom hex
 * colors to element state objects while maintaining the dual
 * preview + source representation.
 *
 * @module state
 */

import { PaletteEntry } from './palette';
import { normalizeHex, hexToRgb } from './colorTransforms';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The visual role a color plays on an element. */
export type ColorRole = 'text' | 'background' | 'border';

/**
 * Shape of a stateful element that carries dual color representations.
 *
 * Each role (text, background, border) has three associated keys:
 * - Preview hex (e.g. `color`, `bgColor`, `borderColor`)
 * - Source payload (e.g. `colorSource`, `bgColorSource`)
 * - Preview RGB triple (e.g. `colorPreviewRgb`, `bgColorPreviewRgb`)
 */
export interface DualColorState {
    color?: string | null;
    colorSource?: unknown;
    colorPreviewRgb?: { r: number; g: number; b: number };
    bgColor?: string | null;
    bgColorSource?: unknown;
    bgColorPreviewRgb?: { r: number; g: number; b: number };
    borderColor?: string | null;
    borderColorSource?: unknown;
    borderColorPreviewRgb?: { r: number; g: number; b: number };
    [extra: string]: unknown;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const previewKeyFor = (role: ColorRole): string =>
    role === 'text' ? 'color' : role === 'background' ? 'bgColor' : 'borderColor';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply a palette entry to an element for a given color role.
 *
 * Sets the preview hex, the original source payload, and the preview
 * RGB triple so that export pipelines can retrieve the press-accurate
 * source while the UI shows the correct sRGB preview.
 *
 * Returns a new object (immutable update).
 */
export const applyPaletteColor = <T extends DualColorState>(
    element: T,
    role: ColorRole,
    entry: PaletteEntry
): T => {
    const previewKey = previewKeyFor(role);
    const sourceKey = `${previewKey}Source`;
    const rgbKey = `${previewKey}PreviewRgb`;
    return {
        ...element,
        [previewKey]: entry.previewHex,
        [sourceKey]: entry.source,
        [rgbKey]: entry.previewRgb,
    };
};

/**
 * Apply a custom hex color to an element for a given color role.
 *
 * This explicitly **clears** the source metadata because a custom
 * hex input has no CMYK payload. The preview hex and RGB are
 * derived from the input value.
 *
 * Returns a new object (immutable update).
 */
export const applyCustomHexColor = <T extends DualColorState>(
    element: T,
    role: ColorRole,
    hex: string | null | undefined
): T => {
    const previewKey = previewKeyFor(role);
    const sourceKey = `${previewKey}Source`;
    const rgbKey = `${previewKey}PreviewRgb`;
    const normalized = normalizeHex(hex);
    return {
        ...element,
        [previewKey]: normalized ?? (hex ?? null),
        [sourceKey]: null,
        [rgbKey]: normalized ? hexToRgb(normalized) : undefined,
    };
};
