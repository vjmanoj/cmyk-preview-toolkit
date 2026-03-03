/**
 * CIE Lab color space utilities for perceptual distance calculations.
 *
 * Provides sRGB → CIE Lab conversion and the CIE76 Delta-E metric
 * for perceptually uniform color distance.
 *
 * @module lab
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** D65 illuminant reference white point */
const D65_X = 0.95047;
const D65_Y = 1.0;
const D65_Z = 1.08883;

const LAB_EPSILON = 0.008856; // (6/29)^3
const LAB_KAPPA = 903.3; // (29/3)^3

// ---------------------------------------------------------------------------
// Internal conversions
// ---------------------------------------------------------------------------

/**
 * sRGB gamma decode: convert sRGB channel (0..1) to linear RGB.
 */
const linearize = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

/**
 * Convert linear RGB to CIE XYZ (D65 illuminant, sRGB matrix).
 */
const linearRgbToXyz = (
    lr: number,
    lg: number,
    lb: number,
): { x: number; y: number; z: number } => ({
    x: 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb,
    y: 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb,
    z: 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb,
});

/**
 * CIE XYZ to CIE Lab using the D65 reference illuminant.
 */
const xyzToLab = (x: number, y: number, z: number): { l: number; a: number; b: number } => {
    const fx = x / D65_X;
    const fy = y / D65_Y;
    const fz = z / D65_Z;

    const f = (t: number): number =>
        t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + 16) / 116;

    const fxr = f(fx);
    const fyr = f(fy);
    const fzr = f(fz);

    return {
        l: 116 * fyr - 16,
        a: 500 * (fxr - fyr),
        b: 200 * (fyr - fzr),
    };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert sRGB byte values (0..255) to CIE Lab.
 *
 * Uses the D65 illuminant and the standard sRGB matrix.
 *
 * @example
 * ```ts
 * const lab = rgbToLab(255, 255, 255);
 * // => { l: 100, a: 0, b: 0 } (approximately)
 * ```
 */
export const rgbToLab = (r: number, g: number, b: number): { l: number; a: number; b: number } => {
    const lr = linearize(Math.max(0, Math.min(255, r)) / 255);
    const lg = linearize(Math.max(0, Math.min(255, g)) / 255);
    const lb = linearize(Math.max(0, Math.min(255, b)) / 255);

    const xyz = linearRgbToXyz(lr, lg, lb);
    return xyzToLab(xyz.x, xyz.y, xyz.z);
};

/**
 * CIE76 Delta-E distance between two sRGB colors.
 *
 * This is the Euclidean distance in CIE Lab space, which is more
 * perceptually uniform than Euclidean distance in sRGB.
 *
 * Reference thresholds:
 * - ~1.0: Not perceptible by human eyes
 * - ~2.3: Just noticeable difference (JND)
 * - ~10: Recommended snap threshold for palette matching
 * - ~49: Colors are clearly different
 *
 * @example
 * ```ts
 * const d = deltaE76({ r: 255, g: 0, b: 0 }, { r: 250, g: 10, b: 5 });
 * // small value — colors look very similar
 * ```
 */
export const deltaE76 = (
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
): number => {
    const labA = rgbToLab(a.r, a.g, a.b);
    const labB = rgbToLab(b.r, b.g, b.b);

    const dl = labA.l - labB.l;
    const da = labA.a - labB.a;
    const db = labA.b - labB.b;

    return Math.sqrt(dl * dl + da * da + db * db);
};
