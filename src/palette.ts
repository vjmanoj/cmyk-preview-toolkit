/**
 * Palette module for the CMYK Preview Toolkit.
 *
 * Builds normalized palette entries from raw color data and provides
 * snapping logic to match sampled hex values to the nearest palette color.
 *
 * @module palette
 */

import {
    CMYKColor,
    RGBColor,
    normalizeHex,
    hexToRgb,
    toPreviewHex,
    toPreviewRgb,
} from './colorTransforms';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A palette entry carrying the original source color alongside its
 * sRGB preview representation.
 */
export interface PaletteEntry {
    /** Original color value (CMYK or RGB) — the authority for export. */
    source: CMYKColor | RGBColor;
    /** Lowercase 6-digit hex preview of the source color. */
    previewHex: string;
    /** sRGB byte triple corresponding to `previewHex`. */
    previewRgb: { r: number; g: number; b: number };
    /** Allow consumer-defined additional metadata. */
    [extra: string]: unknown;
}

/** Options that control palette snapping behavior. */
export interface SnapOptions {
    /**
     * Maximum Euclidean distance in RGB space for a color to be considered
     * a match. Default: `75`.
     */
    maxDistance?: number;
    /**
     * If the best match distance is less than `secondBest * dominanceRatio`,
     * the match is accepted even when it exceeds `maxDistance`.
     * Default: `0.6`.
     */
    dominanceRatio?: number;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Create a fully-populated `PaletteEntry` from a source color.
 *
 * Extra metadata (label, category, etc.) can be passed and will be
 * spread onto the returned object.
 */
export const buildPaletteEntry = (
    source: CMYKColor | RGBColor,
    extra: Record<string, unknown> = {}
): PaletteEntry => {
    const previewHex = normalizeHex(toPreviewHex(source)) || '#000000';
    const previewRgb =
        toPreviewRgb(source) || hexToRgb(previewHex) || { r: 0, g: 0, b: 0 };
    return { source, previewHex, previewRgb, ...extra };
};

/**
 * Normalize an array of partial palette entries, filling in any missing
 * preview fields from the source color.
 *
 * Useful when hydrating palette data stored without preview values
 * (e.g. deserialized from JSON).
 */
export const normalizePalette = (
    entries: Array<Partial<PaletteEntry>>
): PaletteEntry[] =>
    entries.map((entry) => {
        const source = entry.source ?? null;
        const previewHex =
            normalizeHex(entry.previewHex || null) ||
            (source ? normalizeHex(toPreviewHex(source)) : null) ||
            normalizeHex((entry as { hex?: string }).hex) ||
            '#000000';
        const previewRgb =
            entry.previewRgb ||
            (source ? toPreviewRgb(source) : null) ||
            (previewHex ? hexToRgb(previewHex) : null) || { r: 0, g: 0, b: 0 };

        return {
            ...entry,
            source,
            previewHex,
            previewRgb,
        } as PaletteEntry;
    });

// ---------------------------------------------------------------------------
// Distance & snapping
// ---------------------------------------------------------------------------

/**
 * Squared Euclidean distance between two RGB colors.
 *
 * Use the squared value for comparisons to avoid the `Math.sqrt` cost
 * when you only need ordering.
 */
export const rgbDistanceSq = (
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number }
): number => {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
};

/**
 * Find the palette entry whose preview color is nearest to the given hex.
 *
 * Returns the best match, along with the actual Euclidean distances for
 * the best and second-best entries so callers can apply their own logic.
 */
export const findNearestPaletteEntry = (
    palette: PaletteEntry[],
    hex: string,
    options: SnapOptions = {}
): { entry: PaletteEntry | null; distance: number; secondDistance: number } => {
    const normalized = normalizeHex(hex);
    if (!normalized || palette.length === 0) {
        return {
            entry: null,
            distance: Number.POSITIVE_INFINITY,
            secondDistance: Number.POSITIVE_INFINITY,
        };
    }

    const targetRgb = hexToRgb(normalized);
    if (!targetRgb) {
        return {
            entry: null,
            distance: Number.POSITIVE_INFINITY,
            secondDistance: Number.POSITIVE_INFINITY,
        };
    }

    let bestEntry: PaletteEntry | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    let secondBestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of palette) {
        const distance = Math.sqrt(rgbDistanceSq(candidate.previewRgb, targetRgb));
        if (distance < bestDistance) {
            secondBestDistance = bestDistance;
            bestDistance = distance;
            bestEntry = candidate;
        } else if (distance < secondBestDistance) {
            secondBestDistance = distance;
        }
    }

    return {
        entry: bestEntry,
        distance: bestDistance,
        secondDistance: secondBestDistance,
    };
};

/**
 * Decide whether a sampled color should snap to the nearest palette entry.
 *
 * A snap occurs when:
 * 1. The distance is within `maxDistance` (default 75), OR
 * 2. The best match dominates the second-best by at least the
 *    `dominanceRatio` (default 0.6).
 */
export const shouldSnapToPalette = (
    nearest: { distance: number; secondDistance: number },
    options: SnapOptions = {}
): boolean => {
    const maxDistance = options.maxDistance ?? 75;
    const dominanceRatio = options.dominanceRatio ?? 0.6;
    const { distance, secondDistance } = nearest;
    if (distance <= maxDistance) return true;
    return (
        Number.isFinite(secondDistance) &&
        secondDistance > 0 &&
        distance < secondDistance * dominanceRatio
    );
};
