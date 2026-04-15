/**
 * CSS color string parser for the CMYK Preview Toolkit.
 *
 * Parses common CSS color formats into the toolkit's `ColorValue`
 * union type, so consumers don't need to write their own regex
 * when receiving colors from DOM APIs or design tool exports.
 *
 * @module parseCssColor
 */

import type { ColorValue } from './colorTransforms';
import { normalizeHex, hexToRgb } from './colorTransforms';

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/** Matches `rgb(r, g, b)` and `rgba(r, g, b, a)` — comma-separated. */
const RGB_COMMA_RE = /^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)(?:\s*,\s*[\d.]+)?\s*\)$/;

/** Matches the modern `rgb(r g b / a)` space-separated syntax. */
const RGB_SPACE_RE = /^rgba?\(\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s*\/\s*[\d.]+%?)?\s*\)$/;

/** Matches `hsl(h, s%, l%)` and `hsla(h, s%, l%, a)` — comma-separated. */
const HSL_COMMA_RE = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*[\d.]+)?\s*\)$/;

/** Matches the modern `hsl(h s% l% / a)` space-separated syntax. */
const HSL_SPACE_RE = /^hsla?\(\s*([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?(?:\s*\/\s*[\d.]+%?)?\s*\)$/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a CSS color string into a `ColorValue`.
 *
 * Supported formats:
 * - Hex: `#rgb`, `#rrggbb`
 * - `rgb(r, g, b)`, `rgba(r, g, b, a)`
 * - `rgb(r g b)`, `rgb(r g b / a)` (modern)
 * - `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`
 * - `hsl(h s% l%)`, `hsl(h s% l% / a)` (modern)
 *
 * Returns `null` for unsupported formats (named colors, oklch, lch,
 * system colors, etc.)
 *
 * @example
 * ```ts
 * parseCssColor('rgb(255, 0, 128)');
 * // => { type: 'rgb', r: 255, g: 0, b: 128 }
 *
 * parseCssColor('hsl(120, 100%, 50%)');
 * // => { type: 'hsl', h: 120, s: 100, l: 50 }
 *
 * parseCssColor('#f00');
 * // => { type: 'rgb', r: 255, g: 0, b: 0 }
 * ```
 */
export const parseCssColor = (input: string | null | undefined): ColorValue | null => {
    if (!input) return null;
    const trimmed = input.trim().toLowerCase();
    if (trimmed === '') return null;

    // ---- Hex ----
    const hex = normalizeHex(trimmed);
    if (hex) {
        const rgb = hexToRgb(hex);
        if (rgb) return { type: 'rgb', ...rgb };
    }

    // ---- rgb() / rgba() ----
    const rgbMatch = trimmed.match(RGB_COMMA_RE) || trimmed.match(RGB_SPACE_RE);
    if (rgbMatch) {
        return {
            type: 'rgb',
            r: Math.max(0, Math.min(255, Math.round(+rgbMatch[1]))),
            g: Math.max(0, Math.min(255, Math.round(+rgbMatch[2]))),
            b: Math.max(0, Math.min(255, Math.round(+rgbMatch[3]))),
        };
    }

    // ---- hsl() / hsla() ----
    const hslMatch = trimmed.match(HSL_COMMA_RE) || trimmed.match(HSL_SPACE_RE);
    if (hslMatch) {
        return {
            type: 'hsl',
            h: +hslMatch[1],
            s: +hslMatch[2],
            l: +hslMatch[3],
        };
    }

    return null;
};
