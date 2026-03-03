import { describe, it, expect } from 'vitest';
import {
    clamp01,
    clampByte,
    normalizeHex,
    hexToRgb,
    rgbToHex,
    deviceCmykToRgb,
    rgbToCmyk,
    hexToHsl,
    hslToHex,
    toPreviewHex,
    toPreviewRgb,
} from '../src/colorTransforms';

// ---------------------------------------------------------------------------
// clamp01
// ---------------------------------------------------------------------------
describe('clamp01', () => {
    it('clamps negative values to 0', () => {
        expect(clamp01(-0.5)).toBe(0);
    });
    it('clamps values above 1 to 1', () => {
        expect(clamp01(1.5)).toBe(1);
    });
    it('passes through in-range values', () => {
        expect(clamp01(0.5)).toBe(0.5);
    });
});

// ---------------------------------------------------------------------------
// clampByte
// ---------------------------------------------------------------------------
describe('clampByte', () => {
    it('clamps negative values to 0', () => {
        expect(clampByte(-10)).toBe(0);
    });
    it('clamps values above 255 to 255', () => {
        expect(clampByte(300)).toBe(255);
    });
    it('rounds to nearest integer', () => {
        expect(clampByte(127.6)).toBe(128);
        expect(clampByte(127.4)).toBe(127);
    });
});

// ---------------------------------------------------------------------------
// normalizeHex
// ---------------------------------------------------------------------------
describe('normalizeHex', () => {
    it('normalizes a valid 6-digit hex', () => {
        expect(normalizeHex('#1DC4E2')).toBe('#1dc4e2');
    });
    it('expands shorthand hex', () => {
        expect(normalizeHex('#abc')).toBe('#aabbcc');
    });
    it('adds missing hash', () => {
        expect(normalizeHex('ff0000')).toBe('#ff0000');
    });
    it('trims whitespace', () => {
        expect(normalizeHex('  #00ff00  ')).toBe('#00ff00');
    });
    it('returns null for empty string', () => {
        expect(normalizeHex('')).toBeNull();
    });
    it('returns null for null', () => {
        expect(normalizeHex(null)).toBeNull();
    });
    it('returns null for undefined', () => {
        expect(normalizeHex(undefined)).toBeNull();
    });
    it('returns null for invalid hex', () => {
        expect(normalizeHex('#xyz')).toBeNull();
        expect(normalizeHex('#12345')).toBeNull();
        expect(normalizeHex('#1234567')).toBeNull();
        expect(normalizeHex('not a color')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------
describe('hexToRgb', () => {
    it('parses a valid hex string', () => {
        expect(hexToRgb('#ff8040')).toEqual({ r: 255, g: 128, b: 64 });
    });
    it('handles shorthand hex', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });
    it('returns null for invalid input', () => {
        expect(hexToRgb('invalid')).toBeNull();
        expect(hexToRgb(null)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// rgbToHex
// ---------------------------------------------------------------------------
describe('rgbToHex', () => {
    it('converts RGB values to hex', () => {
        expect(rgbToHex(255, 128, 64)).toBe('#ff8040');
    });
    it('clamps out-of-range values', () => {
        expect(rgbToHex(-10, 300, 128)).toBe('#00ff80');
    });
    it('pads single-digit hex values', () => {
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
        expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });
});

// ---------------------------------------------------------------------------
// hexToRgb / rgbToHex round-trip
// ---------------------------------------------------------------------------
describe('hex ↔ RGB round-trip', () => {
    const samples = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#1dc4e2', '#abcdef'];
    for (const hex of samples) {
        it(`round-trips ${hex}`, () => {
            const rgb = hexToRgb(hex)!;
            expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe(hex);
        });
    }
});

// ---------------------------------------------------------------------------
// deviceCmykToRgb — pdf.js polynomial fixture
// ---------------------------------------------------------------------------
describe('deviceCmykToRgb', () => {
    it('converts pure white (0,0,0,0) to #ffffff', () => {
        const { r, g, b } = deviceCmykToRgb(0, 0, 0, 0);
        expect(r).toBe(255);
        expect(g).toBe(255);
        expect(b).toBe(255);
    });

    it('converts pure black (0,0,0,1) to a dark color', () => {
        const { r, g, b } = deviceCmykToRgb(0, 0, 0, 1);
        // The polynomial approximation doesn't yield perfect (0,0,0) for K=1.
        // pdf.js produces roughly (44, 47, 42) — verify it's a dark color.
        expect(r).toBeLessThanOrEqual(55);
        expect(g).toBeLessThanOrEqual(55);
        expect(b).toBeLessThanOrEqual(55);
    });

    it('converts a known CMYK fixture to the expected RGB', () => {
        // Fixture: C=0.11, M=0.24, Y=0.00, K=0.13
        // This should produce a light blue / teal-ish color
        const result = deviceCmykToRgb(0.11, 0.24, 0.0, 0.13);
        // Verify it produces a valid color in expected range
        expect(result.r).toBeGreaterThanOrEqual(0);
        expect(result.r).toBeLessThanOrEqual(255);
        expect(result.g).toBeGreaterThanOrEqual(0);
        expect(result.g).toBeLessThanOrEqual(255);
        expect(result.b).toBeGreaterThanOrEqual(0);
        expect(result.b).toBeLessThanOrEqual(255);
        // Snapshot the exact values for regression
        expect(result).toMatchSnapshot();
    });

    it('clamps out-of-range CMYK inputs', () => {
        const result = deviceCmykToRgb(-0.5, 1.5, 0.5, 2.0);
        expect(result.r).toBeGreaterThanOrEqual(0);
        expect(result.r).toBeLessThanOrEqual(255);
        expect(result.g).toBeGreaterThanOrEqual(0);
        expect(result.g).toBeLessThanOrEqual(255);
        expect(result.b).toBeGreaterThanOrEqual(0);
        expect(result.b).toBeLessThanOrEqual(255);
    });

    it('is deterministic', () => {
        const a = deviceCmykToRgb(0.3, 0.6, 0.1, 0.2);
        const b = deviceCmykToRgb(0.3, 0.6, 0.1, 0.2);
        expect(a).toEqual(b);
    });
});

// ---------------------------------------------------------------------------
// toPreviewHex
// ---------------------------------------------------------------------------
describe('toPreviewHex', () => {
    it('converts CMYK to hex', () => {
        const hex = toPreviewHex({ type: 'cmyk', c: 0, m: 0, y: 0, k: 0 });
        expect(hex).toBe('#ffffff');
    });
    it('converts RGB to hex', () => {
        const hex = toPreviewHex({ type: 'rgb', r: 255, g: 128, b: 64 });
        expect(hex).toBe('#ff8040');
    });
    it('returns null for null input', () => {
        expect(toPreviewHex(null)).toBeNull();
    });
    it('returns null for undefined input', () => {
        expect(toPreviewHex(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// toPreviewRgb
// ---------------------------------------------------------------------------
describe('toPreviewRgb', () => {
    it('converts CMYK to RGB triple', () => {
        const rgb = toPreviewRgb({ type: 'cmyk', c: 0, m: 0, y: 0, k: 0 });
        expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });
    it('clamps RGB values', () => {
        const rgb = toPreviewRgb({ type: 'rgb', r: 300, g: -10, b: 128.7 });
        expect(rgb).toEqual({ r: 255, g: 0, b: 129 });
    });
    it('returns null for null input', () => {
        expect(toPreviewRgb(null)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// rgbToCmyk
// ---------------------------------------------------------------------------
describe('rgbToCmyk', () => {
    it('converts pure red', () => {
        expect(rgbToCmyk(255, 0, 0)).toEqual({ c: 0, m: 1, y: 1, k: 0 });
    });
    it('converts pure green', () => {
        expect(rgbToCmyk(0, 255, 0)).toEqual({ c: 1, m: 0, y: 1, k: 0 });
    });
    it('converts pure blue', () => {
        expect(rgbToCmyk(0, 0, 255)).toEqual({ c: 1, m: 1, y: 0, k: 0 });
    });
    it('converts pure white', () => {
        expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    });
    it('converts pure black', () => {
        expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 1 });
    });
    it('handles a mid-range color', () => {
        const result = rgbToCmyk(128, 64, 32);
        expect(result.c).toBeCloseTo(0, 1);
        expect(result.m).toBeCloseTo(0.5, 1);
        expect(result.y).toBeCloseTo(0.75, 1);
        expect(result.k).toBeCloseTo(0.498, 1);
    });
    it('clamps out-of-range inputs', () => {
        const result = rgbToCmyk(300, -10, 128);
        expect(result.k).toBeGreaterThanOrEqual(0);
        expect(result.k).toBeLessThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// hexToHsl
// ---------------------------------------------------------------------------
describe('hexToHsl', () => {
    it('converts pure red to hsl(0, 100, 50)', () => {
        const hsl = hexToHsl('#ff0000')!;
        expect(hsl.h).toBe(0);
        expect(hsl.s).toBe(100);
        expect(hsl.l).toBe(50);
    });
    it('converts pure white to hsl(0, 0, 100)', () => {
        const hsl = hexToHsl('#ffffff')!;
        expect(hsl.s).toBe(0);
        expect(hsl.l).toBe(100);
    });
    it('converts pure black to hsl(0, 0, 0)', () => {
        const hsl = hexToHsl('#000000')!;
        expect(hsl.s).toBe(0);
        expect(hsl.l).toBe(0);
    });
    it('converts a mid-range blue', () => {
        const hsl = hexToHsl('#0000ff')!;
        expect(hsl.h).toBe(240);
        expect(hsl.s).toBe(100);
        expect(hsl.l).toBe(50);
    });
    it('returns null for invalid input', () => {
        expect(hexToHsl(null)).toBeNull();
        expect(hexToHsl('invalid')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// hslToHex
// ---------------------------------------------------------------------------
describe('hslToHex', () => {
    it('converts hsl(0, 100, 50) to red', () => {
        expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    });
    it('converts hsl(120, 100, 50) to green', () => {
        expect(hslToHex(120, 100, 50)).toBe('#00ff00');
    });
    it('converts hsl(240, 100, 50) to blue', () => {
        expect(hslToHex(240, 100, 50)).toBe('#0000ff');
    });
    it('converts achromatic values (s=0)', () => {
        expect(hslToHex(0, 0, 50)).toBe('#808080');
    });
    it('handles negative and wrap-around hue', () => {
        expect(hslToHex(360, 100, 50)).toBe('#ff0000');
        expect(hslToHex(-60, 100, 50)).toBe('#ff00ff');
    });
});

// ---------------------------------------------------------------------------
// HSL round-trip
// ---------------------------------------------------------------------------
describe('hex → HSL → hex round-trip', () => {
    const samples = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#808080'];
    for (const hex of samples) {
        it(`round-trips ${hex}`, () => {
            const hsl = hexToHsl(hex)!;
            expect(hslToHex(hsl.h, hsl.s, hsl.l)).toBe(hex);
        });
    }
});
