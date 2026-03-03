import { describe, it, expect } from 'vitest';
import {
    buildPaletteEntry,
    normalizePalette,
    rgbDistanceSq,
    findNearestPaletteEntry,
    shouldSnapToPalette,
    PaletteEntry,
} from '../src/palette';
import { CMYKColor, RGBColor } from '../src/colorTransforms';

// ---------------------------------------------------------------------------
// buildPaletteEntry
// ---------------------------------------------------------------------------
describe('buildPaletteEntry', () => {
    it('fills preview fields from a CMYK source', () => {
        const source: CMYKColor = { type: 'cmyk', c: 0, m: 0, y: 0, k: 0 };
        const entry = buildPaletteEntry(source);
        expect(entry.previewHex).toBe('#ffffff');
        expect(entry.previewRgb).toEqual({ r: 255, g: 255, b: 255 });
        expect(entry.source).toBe(source);
    });

    it('fills preview fields from an RGB source', () => {
        const source: RGBColor = { type: 'rgb', r: 255, g: 0, b: 128 };
        const entry = buildPaletteEntry(source);
        expect(entry.previewHex).toBe('#ff0080');
        expect(entry.previewRgb).toEqual({ r: 255, g: 0, b: 128 });
    });

    it('includes extra metadata', () => {
        const source: RGBColor = { type: 'rgb', r: 0, g: 0, b: 0 };
        const entry = buildPaletteEntry(source, { label: 'Black', category: 'neutrals' });
        expect(entry.label).toBe('Black');
        expect(entry.category).toBe('neutrals');
    });
});

// ---------------------------------------------------------------------------
// normalizePalette
// ---------------------------------------------------------------------------
describe('normalizePalette', () => {
    it('populates preview fields from source', () => {
        const entries = normalizePalette([
            { source: { type: 'rgb', r: 12, g: 34, b: 56 } },
        ]);
        expect(entries).toHaveLength(1);
        expect(entries[0].previewHex).toBe('#0c2238');
        expect(entries[0].previewRgb).toEqual({ r: 12, g: 34, b: 56 });
    });

    it('uses existing previewHex if provided', () => {
        const entries = normalizePalette([
            {
                source: { type: 'rgb', r: 12, g: 34, b: 56 },
                previewHex: '#ff0000',
            },
        ]);
        expect(entries[0].previewHex).toBe('#ff0000');
    });

    it('falls back to #000000 when no source or hex is given', () => {
        const entries = normalizePalette([{}]);
        expect(entries[0].previewHex).toBe('#000000');
        expect(entries[0].previewRgb).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('fills preview from a legacy "hex" field', () => {
        const entries = normalizePalette([
            { hex: '#abcdef' } as any,
        ]);
        expect(entries[0].previewHex).toBe('#abcdef');
    });
});

// ---------------------------------------------------------------------------
// rgbDistanceSq
// ---------------------------------------------------------------------------
describe('rgbDistanceSq', () => {
    it('returns 0 for identical colors', () => {
        expect(rgbDistanceSq({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 })).toBe(0);
    });

    it('computes squared Euclidean distance', () => {
        // distance = sqrt(3^2 + 4^2 + 0^2) = 5, squared = 25
        expect(rgbDistanceSq({ r: 0, g: 0, b: 0 }, { r: 3, g: 4, b: 0 })).toBe(25);
    });
});

// ---------------------------------------------------------------------------
// findNearestPaletteEntry
// ---------------------------------------------------------------------------
describe('findNearestPaletteEntry', () => {
    const palette: PaletteEntry[] = [
        buildPaletteEntry({ type: 'rgb', r: 255, g: 0, b: 0 }),   // red
        buildPaletteEntry({ type: 'rgb', r: 0, g: 255, b: 0 }),   // green
        buildPaletteEntry({ type: 'rgb', r: 0, g: 0, b: 255 }),   // blue
    ];

    it('finds the exact match', () => {
        const result = findNearestPaletteEntry(palette, '#ff0000');
        expect(result.entry!.previewHex).toBe('#ff0000');
        expect(result.distance).toBe(0);
    });

    it('finds the nearest entry for a close color', () => {
        // #f00010 is very close to red
        const result = findNearestPaletteEntry(palette, '#f00010');
        expect(result.entry!.previewHex).toBe('#ff0000');
        expect(result.distance).toBeGreaterThan(0);
        expect(result.distance).toBeLessThan(30);
    });

    it('returns null for empty palette', () => {
        const result = findNearestPaletteEntry([], '#ff0000');
        expect(result.entry).toBeNull();
    });

    it('returns null for invalid hex', () => {
        const result = findNearestPaletteEntry(palette, 'invalid');
        expect(result.entry).toBeNull();
    });

    it('tracks second-best distance', () => {
        const result = findNearestPaletteEntry(palette, '#ff0000');
        expect(result.secondDistance).toBeGreaterThan(result.distance);
    });
});

// ---------------------------------------------------------------------------
// shouldSnapToPalette
// ---------------------------------------------------------------------------
describe('shouldSnapToPalette', () => {
    it('snaps when distance is within maxDistance', () => {
        expect(shouldSnapToPalette({ distance: 50, secondDistance: 200 })).toBe(true);
        expect(shouldSnapToPalette({ distance: 75, secondDistance: 200 })).toBe(true);
    });

    it('does not snap when distance exceeds maxDistance and no dominance', () => {
        expect(shouldSnapToPalette({ distance: 100, secondDistance: 110 })).toBe(false);
    });

    it('snaps via dominance ratio even when beyond maxDistance', () => {
        // distance=80 < secondDistance=200 * 0.6=120 → snap
        expect(shouldSnapToPalette({ distance: 80, secondDistance: 200 })).toBe(true);
    });

    it('respects custom maxDistance', () => {
        expect(
            shouldSnapToPalette({ distance: 50, secondDistance: 200 }, { maxDistance: 30 })
        ).toBe(true); // still passes dominance: 50 < 200*0.6=120
        expect(
            shouldSnapToPalette({ distance: 50, secondDistance: 60 }, { maxDistance: 30 })
        ).toBe(false); // 50 > 60*0.6=36
    });

    it('respects custom dominanceRatio', () => {
        // distance=80, secondDistance=100. default ratio 0.6 → 80 < 60? no.
        // with ratio 0.9 → 80 < 90? yes.
        expect(
            shouldSnapToPalette({ distance: 80, secondDistance: 100 }, { maxDistance: 10, dominanceRatio: 0.9 })
        ).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// findNearestPaletteEntry with deltaE76
// ---------------------------------------------------------------------------
describe('findNearestPaletteEntry with deltaE76', () => {
    const palette: PaletteEntry[] = [
        buildPaletteEntry({ type: 'rgb', r: 255, g: 0, b: 0 }),   // red
        buildPaletteEntry({ type: 'rgb', r: 0, g: 255, b: 0 }),   // green
        buildPaletteEntry({ type: 'rgb', r: 0, g: 0, b: 255 }),   // blue
    ];

    it('finds exact match with deltaE76', () => {
        const result = findNearestPaletteEntry(palette, '#ff0000', { distanceMetric: 'deltaE76' });
        expect(result.entry!.previewHex).toBe('#ff0000');
        expect(result.distance).toBe(0);
    });

    it('finds nearest with deltaE76 and distance is in Lab units', () => {
        const result = findNearestPaletteEntry(palette, '#f50505', { distanceMetric: 'deltaE76' });
        expect(result.entry!.previewHex).toBe('#ff0000');
        expect(result.distance).toBeGreaterThan(0);
        // Delta-E for very similar reds should be small
        expect(result.distance).toBeLessThan(10);
    });

    it('returns different distances than RGB metric for same input', () => {
        const hex = '#808000'; // olive — equidistant in RGB from R and G
        const rgbResult = findNearestPaletteEntry(palette, hex, { distanceMetric: 'rgb' });
        const labResult = findNearestPaletteEntry(palette, hex, { distanceMetric: 'deltaE76' });
        // The results might pick different entries or at least have different distances
        expect(labResult.distance).not.toBe(rgbResult.distance);
    });
});
