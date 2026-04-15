import { describe, it, expect } from 'vitest';
import { parseCssColor } from '../src/parseCssColor';

// ---------------------------------------------------------------------------
// Hex inputs
// ---------------------------------------------------------------------------
describe('parseCssColor — hex', () => {
    it('parses 6-digit hex', () => {
        expect(parseCssColor('#ff0000')).toEqual({ type: 'rgb', r: 255, g: 0, b: 0 });
    });

    it('parses 3-digit shorthand hex', () => {
        expect(parseCssColor('#f00')).toEqual({ type: 'rgb', r: 255, g: 0, b: 0 });
    });

    it('parses hex without hash', () => {
        expect(parseCssColor('abcdef')).toEqual({ type: 'rgb', r: 171, g: 205, b: 239 });
    });

    it('handles uppercase hex', () => {
        expect(parseCssColor('#1DC4E2')).toEqual({ type: 'rgb', r: 29, g: 196, b: 226 });
    });
});

// ---------------------------------------------------------------------------
// rgb() / rgba()
// ---------------------------------------------------------------------------
describe('parseCssColor — rgb()', () => {
    it('parses comma-separated rgb()', () => {
        expect(parseCssColor('rgb(255, 128, 64)')).toEqual({ type: 'rgb', r: 255, g: 128, b: 64 });
    });

    it('parses comma-separated rgba()', () => {
        expect(parseCssColor('rgba(10, 20, 30, 0.5)')).toEqual({ type: 'rgb', r: 10, g: 20, b: 30 });
    });

    it('parses modern space-separated rgb()', () => {
        expect(parseCssColor('rgb(100 200 50)')).toEqual({ type: 'rgb', r: 100, g: 200, b: 50 });
    });

    it('parses modern rgb() with alpha', () => {
        expect(parseCssColor('rgb(100 200 50 / 0.8)')).toEqual({ type: 'rgb', r: 100, g: 200, b: 50 });
    });

    it('clamps out-of-range values', () => {
        const result = parseCssColor('rgb(300, -10, 128)');
        expect(result).toEqual({ type: 'rgb', r: 255, g: 0, b: 128 });
    });
});

// ---------------------------------------------------------------------------
// hsl() / hsla()
// ---------------------------------------------------------------------------
describe('parseCssColor — hsl()', () => {
    it('parses comma-separated hsl() with % signs', () => {
        expect(parseCssColor('hsl(120, 100%, 50%)')).toEqual({ type: 'hsl', h: 120, s: 100, l: 50 });
    });

    it('parses comma-separated hsla()', () => {
        expect(parseCssColor('hsla(240, 50%, 75%, 0.8)')).toEqual({ type: 'hsl', h: 240, s: 50, l: 75 });
    });

    it('parses modern space-separated hsl()', () => {
        expect(parseCssColor('hsl(0 100% 50%)')).toEqual({ type: 'hsl', h: 0, s: 100, l: 50 });
    });

    it('parses modern hsl() with alpha', () => {
        expect(parseCssColor('hsl(0 100% 50% / 0.5)')).toEqual({ type: 'hsl', h: 0, s: 100, l: 50 });
    });

    it('parses hsl() without % signs', () => {
        expect(parseCssColor('hsl(180, 75, 25)')).toEqual({ type: 'hsl', h: 180, s: 75, l: 25 });
    });
});

// ---------------------------------------------------------------------------
// Edge cases & unsupported
// ---------------------------------------------------------------------------
describe('parseCssColor — edge cases', () => {
    it('returns null for null', () => {
        expect(parseCssColor(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(parseCssColor(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(parseCssColor('')).toBeNull();
    });

    it('returns null for named colors', () => {
        expect(parseCssColor('red')).toBeNull();
        expect(parseCssColor('steelblue')).toBeNull();
    });

    it('returns null for oklch()', () => {
        expect(parseCssColor('oklch(0.7 0.15 180)')).toBeNull();
    });

    it('handles whitespace', () => {
        expect(parseCssColor('  #ff0000  ')).toEqual({ type: 'rgb', r: 255, g: 0, b: 0 });
        expect(parseCssColor('  rgb( 10 , 20 , 30 )  ')).toEqual({ type: 'rgb', r: 10, g: 20, b: 30 });
    });
});
