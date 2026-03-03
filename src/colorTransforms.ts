/**
 * Core color transformation utilities for the CMYK Preview Toolkit.
 *
 * Provides the pdf.js DeviceCMYK→sRGB polynomial, hex normalization,
 * and dual-representation preview helpers.
 *
 * @module colorTransforms
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A color in the DeviceCMYK color space with channel fractions in 0..1. */
export type CMYKColor = {
    type: 'cmyk';
    /** Cyan channel (0..1) */
    c: number;
    /** Magenta channel (0..1) */
    m: number;
    /** Yellow channel (0..1) */
    y: number;
    /** Key/Black channel (0..1) */
    k: number;
};

/** A color in the sRGB color space with channel values in 0..255. */
export type RGBColor = {
    type: 'rgb';
    /** Red channel (0..255) */
    r: number;
    /** Green channel (0..255) */
    g: number;
    /** Blue channel (0..255) */
    b: number;
};

/** A color in the HSL color space. */
export type HSLColor = {
    type: 'hsl';
    /** Hue (0..360) */
    h: number;
    /** Saturation (0..100) */
    s: number;
    /** Lightness (0..100) */
    l: number;
};

/** Union of all supported color types. */
export type ColorValue = CMYKColor | RGBColor | HSLColor;

// ---------------------------------------------------------------------------
// Clamping
// ---------------------------------------------------------------------------

/** Clamp a number to the 0..1 range. */
export const clamp01 = (value: number): number =>
    Math.max(0, Math.min(1, value));

/** Clamp a number to a byte (0..255) and round to the nearest integer. */
export const clampByte = (value: number): number =>
    Math.max(0, Math.min(255, Math.round(value)));

// ---------------------------------------------------------------------------
// Hex helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a hex color string to lowercase 6-digit format (`#rrggbb`).
 *
 * Handles shorthand (`#abc`), missing hash, whitespace, and invalid input.
 * Returns `null` for any value that cannot be normalized.
 */
export const normalizeHex = (input: string | null | undefined): string | null => {
    if (!input) return null;
    let value = input.trim();
    if (value === '') return null;
    if (!value.startsWith('#')) value = `#${value}`;
    if (value.length === 4) {
        value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : null;
};

/**
 * Parse a hex color string into an `{ r, g, b }` object.
 *
 * Returns `null` if the input cannot be normalized.
 */
export const hexToRgb = (
    hex: string | null | undefined
): { r: number; g: number; b: number } | null => {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    const intValue = parseInt(normalized.slice(1), 16);
    if (Number.isNaN(intValue)) return null;
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255,
    };
};

/**
 * Convert individual R, G, B byte values to a lowercase 6-digit hex string.
 */
export const rgbToHex = (r: number, g: number, b: number): string =>
    `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g)
        .toString(16)
        .padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// RGB → CMYK (GCR approximation)
// ---------------------------------------------------------------------------

/**
 * Convert sRGB byte values to CMYK using GCR (Gray Component Replacement).
 *
 * **Important**: This is the standard naive GCR formula, NOT an ICC-profiled
 * conversion. Suitable for screen previews, not press-accurate matching.
 *
 * @example
 * ```ts
 * rgbToCmyk(255, 0, 0); // => { c: 0, m: 1, y: 1, k: 0 }
 * ```
 */
export const rgbToCmyk = (
    r: number,
    g: number,
    b: number,
): { c: number; m: number; y: number; k: number } => {
    const r1 = clampByte(r) / 255;
    const g1 = clampByte(g) / 255;
    const b1 = clampByte(b) / 255;

    const k = 1 - Math.max(r1, g1, b1);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 1 };

    return {
        c: (1 - r1 - k) / (1 - k),
        m: (1 - g1 - k) / (1 - k),
        y: (1 - b1 - k) / (1 - k),
        k,
    };
};

// ---------------------------------------------------------------------------
// HSL helpers
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string to HSL values.
 *
 * @returns `{ h, s, l }` where h is 0..360, s is 0..100, l is 0..100.
 *          Returns `null` if the input cannot be parsed.
 */
export const hexToHsl = (
    hex: string | null | undefined,
): { h: number; s: number; l: number } | null => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    const r1 = rgb.r / 255;
    const g1 = rgb.g / 255;
    const b1 = rgb.b / 255;

    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        if (max === r1) {
            h = ((g1 - b1) / delta + (g1 < b1 ? 6 : 0)) * 60;
        } else if (max === g1) {
            h = ((b1 - r1) / delta + 2) * 60;
        } else {
            h = ((r1 - g1) / delta + 4) * 60;
        }
    }

    return {
        h: Math.round(h * 10) / 10,
        s: Math.round(s * 1000) / 10,
        l: Math.round(l * 1000) / 10,
    };
};

/**
 * Convert HSL values to a lowercase 6-digit hex string.
 *
 * @param h Hue (0..360)
 * @param s Saturation (0..100)
 * @param l Lightness (0..100)
 */
export const hslToHex = (h: number, s: number, l: number): string => {
    const sNorm = Math.max(0, Math.min(100, s)) / 100;
    const lNorm = Math.max(0, Math.min(100, l)) / 100;
    const hNorm = ((h % 360) + 360) % 360;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let r1 = 0,
        g1 = 0,
        b1 = 0;

    if (hNorm < 60) {
        r1 = c; g1 = x; b1 = 0;
    } else if (hNorm < 120) {
        r1 = x; g1 = c; b1 = 0;
    } else if (hNorm < 180) {
        r1 = 0; g1 = c; b1 = x;
    } else if (hNorm < 240) {
        r1 = 0; g1 = x; b1 = c;
    } else if (hNorm < 300) {
        r1 = x; g1 = 0; b1 = c;
    } else {
        r1 = c; g1 = 0; b1 = x;
    }

    return rgbToHex(
        Math.round((r1 + m) * 255),
        Math.round((g1 + m) * 255),
        Math.round((b1 + m) * 255),
    );
};

// ---------------------------------------------------------------------------
// DeviceCMYK → sRGB polynomial (from pdf.js)
// ---------------------------------------------------------------------------

/**
 * Convert DeviceCMYK values to sRGB using the polynomial from
 * pdf.js `DeviceCMYKCS.#toRgb`.
 *
 * Input channels are clamped to 0..1. Output channels are clamped bytes.
 * This is the same conversion that pdf.js uses when rasterizing CMYK PDFs
 * to an HTML canvas, so the output matches the on-screen preview exactly.
 */
export const deviceCmykToRgb = (
    c: number,
    m: number,
    y: number,
    k: number
): { r: number; g: number; b: number } => {
    const c1 = clamp01(c);
    const m1 = clamp01(m);
    const y1 = clamp01(y);
    const k1 = clamp01(k);

    const r =
        255 +
        c1 *
        (-4.387332384609988 * c1 +
            54.48615194189176 * m1 +
            18.82290502165302 * y1 +
            212.25662451639585 * k1 -
            285.2331026137004) +
        m1 *
        (1.7149763477362134 * m1 -
            5.6096736904047315 * y1 -
            17.873870861415444 * k1 -
            5.497006427196366) +
        y1 *
        (-2.5217340131683033 * y1 -
            21.248923337353073 * k1 +
            17.5119270841813) +
        k1 * (-21.86122147463605 * k1 - 189.48180835922747);

    const g =
        255 +
        c1 *
        (8.841041422036149 * c1 +
            60.118027045597366 * m1 +
            6.871425592049007 * y1 +
            31.159100130055922 * k1 -
            79.2970844816548) +
        m1 *
        (-15.310361306967817 * m1 +
            17.575251261109482 * y1 +
            131.35250912493976 * k1 -
            190.9453302588951) +
        y1 *
        (4.444339102852739 * y1 +
            9.8632861493405 * k1 -
            24.86741582555878) +
        k1 * (-20.737325471181034 * k1 - 187.80453709719578);

    const b =
        255 +
        c1 *
        (0.8842522430003296 * c1 +
            8.078677503112928 * m1 +
            30.89978309703729 * y1 -
            0.23883238689178934 * k1 -
            14.183576799673286) +
        m1 *
        (10.49593273432072 * m1 +
            63.02378494754052 * y1 +
            50.606957656360734 * k1 -
            112.23884253719248) +
        y1 *
        (0.03296041114873217 * y1 +
            115.60384449646641 * k1 -
            193.58209356861505) +
        k1 * (-22.33816807309886 * k1 - 180.12613974708367);

    return {
        r: clampByte(r),
        g: clampByte(g),
        b: clampByte(b),
    };
};

// ---------------------------------------------------------------------------
// Preview helpers
// ---------------------------------------------------------------------------

/**
 * Convert a `CMYKColor` or `RGBColor` to its sRGB preview hex string.
 *
 * For CMYK inputs the pdf.js polynomial is used; for RGB inputs the
 * channels are clamped and formatted directly.
 */
export const toPreviewHex = (
    color: CMYKColor | RGBColor | null | undefined
): string | null => {
    if (!color) return null;
    if (color.type === 'cmyk') {
        const { r, g, b } = deviceCmykToRgb(color.c, color.m, color.y, color.k);
        return rgbToHex(r, g, b);
    }
    if (color.type === 'rgb') {
        return rgbToHex(color.r, color.g, color.b);
    }
    return null;
};

/**
 * Convert a `CMYKColor` or `RGBColor` to its sRGB preview `{ r, g, b }`.
 *
 * For CMYK inputs the pdf.js polynomial is used; for RGB inputs the
 * channels are clamped directly.
 */
export const toPreviewRgb = (
    color: CMYKColor | RGBColor | null | undefined
): { r: number; g: number; b: number } | null => {
    if (!color) return null;
    if (color.type === 'cmyk') {
        return deviceCmykToRgb(color.c, color.m, color.y, color.k);
    }
    if (color.type === 'rgb') {
        return {
            r: clampByte(color.r),
            g: clampByte(color.g),
            b: clampByte(color.b),
        };
    }
    return null;
};
