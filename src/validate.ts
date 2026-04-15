/**
 * Opt-in validation utilities for the CMYK Preview Toolkit.
 *
 * Consumers can call these functions before a conversion to get
 * descriptive error messages instead of silent clamping.
 *
 * @module validate
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const assertFinite = (label: string, channel: string, value: number): void => {
    if (!Number.isFinite(value)) {
        throw new RangeError(
            `Invalid ${label} channel "${channel}": expected a finite number, got ${value}`
        );
    }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate CMYK channels.
 *
 * Throws a `RangeError` if any channel is `NaN`, `Infinity`, or `-Infinity`.
 * Does **not** reject values outside 0..1 — those are clamped silently
 * by conversion functions. Use this when you need early error feedback.
 *
 * @example
 * ```ts
 * validateCmyk(0.1, NaN, 0, 0);
 * // => RangeError: Invalid CMYK channel "m": expected a finite number, got NaN
 * ```
 */
export const validateCmyk = (c: number, m: number, y: number, k: number): void => {
    assertFinite('CMYK', 'c', c);
    assertFinite('CMYK', 'm', m);
    assertFinite('CMYK', 'y', y);
    assertFinite('CMYK', 'k', k);
};

/**
 * Validate RGB channels.
 *
 * Throws a `RangeError` if any channel is `NaN`, `Infinity`, or `-Infinity`.
 *
 * @example
 * ```ts
 * validateRgb(255, Infinity, 0);
 * // => RangeError: Invalid RGB channel "g": expected a finite number, got Infinity
 * ```
 */
export const validateRgb = (r: number, g: number, b: number): void => {
    assertFinite('RGB', 'r', r);
    assertFinite('RGB', 'g', g);
    assertFinite('RGB', 'b', b);
};

/**
 * Validate HSL channels.
 *
 * Throws a `RangeError` if any channel is `NaN`, `Infinity`, or `-Infinity`.
 *
 * @example
 * ```ts
 * validateHsl(NaN, 100, 50);
 * // => RangeError: Invalid HSL channel "h": expected a finite number, got NaN
 * ```
 */
export const validateHsl = (h: number, s: number, l: number): void => {
    assertFinite('HSL', 'h', h);
    assertFinite('HSL', 's', s);
    assertFinite('HSL', 'l', l);
};
