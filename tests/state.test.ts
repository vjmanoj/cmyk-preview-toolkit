import { describe, it, expect } from 'vitest';
import { applyPaletteColor, applyCustomHexColor, DualColorState } from '../src/state';
import { buildPaletteEntry } from '../src/palette';

// ---------------------------------------------------------------------------
// applyPaletteColor
// ---------------------------------------------------------------------------
describe('applyPaletteColor', () => {
    const entry = buildPaletteEntry({ type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 });

    it('sets text color fields from a palette entry', () => {
        const element: DualColorState = { color: '#000000', colorSource: null };
        const result = applyPaletteColor(element, 'text', entry);

        expect(result.color).toBe(entry.previewHex);
        expect(result.colorSource).toEqual(entry.source);
        expect(result.colorPreviewRgb).toEqual(entry.previewRgb);
    });

    it('sets background color fields', () => {
        const element: DualColorState = {};
        const result = applyPaletteColor(element, 'background', entry);

        expect(result.bgColor).toBe(entry.previewHex);
        expect(result.bgColorSource).toEqual(entry.source);
        expect(result.bgColorPreviewRgb).toEqual(entry.previewRgb);
    });

    it('sets border color fields', () => {
        const element: DualColorState = {};
        const result = applyPaletteColor(element, 'border', entry);

        expect(result.borderColor).toBe(entry.previewHex);
        expect(result.borderColorSource).toEqual(entry.source);
        expect(result.borderColorPreviewRgb).toEqual(entry.previewRgb);
    });

    it('preserves other element properties', () => {
        const element: DualColorState = { color: '#000000', fontSize: 14 };
        const result = applyPaletteColor(element, 'text', entry);

        expect(result.fontSize).toBe(14);
    });

    it('returns a new object (immutable)', () => {
        const element: DualColorState = { color: '#000000' };
        const result = applyPaletteColor(element, 'text', entry);

        expect(result).not.toBe(element);
        expect(element.color).toBe('#000000'); // original unchanged
    });
});

// ---------------------------------------------------------------------------
// applyCustomHexColor
// ---------------------------------------------------------------------------
describe('applyCustomHexColor', () => {
    it('sets text color and clears source', () => {
        const element: DualColorState = {
            color: '#ff0000',
            colorSource: { type: 'cmyk', c: 1, m: 0, y: 0, k: 0 },
        };
        const result = applyCustomHexColor(element, 'text', '#00ff00');

        expect(result.color).toBe('#00ff00');
        expect(result.colorSource).toBeNull();
        expect(result.colorPreviewRgb).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('sets background color and clears source', () => {
        const element: DualColorState = {};
        const result = applyCustomHexColor(element, 'background', '#abcdef');

        expect(result.bgColor).toBe('#abcdef');
        expect(result.bgColorSource).toBeNull();
        expect(result.bgColorPreviewRgb).toEqual({ r: 171, g: 205, b: 239 });
    });

    it('handles null hex gracefully', () => {
        const element: DualColorState = { color: '#ff0000' };
        const result = applyCustomHexColor(element, 'text', null);

        expect(result.color).toBeNull();
        expect(result.colorSource).toBeNull();
        expect(result.colorPreviewRgb).toBeUndefined();
    });

    it('handles invalid hex gracefully', () => {
        const element: DualColorState = {};
        const result = applyCustomHexColor(element, 'text', 'not-a-color');

        expect(result.color).toBe('not-a-color'); // pass-through as-is
        expect(result.colorSource).toBeNull();
    });

    it('returns a new object (immutable)', () => {
        const element: DualColorState = { color: '#000000' };
        const result = applyCustomHexColor(element, 'text', '#ffffff');

        expect(result).not.toBe(element);
        expect(element.color).toBe('#000000');
    });
});
