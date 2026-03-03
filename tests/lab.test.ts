import { describe, it, expect } from 'vitest';
import { rgbToLab, deltaE76 } from '../src/lab';

// ---------------------------------------------------------------------------
// rgbToLab
// ---------------------------------------------------------------------------
describe('rgbToLab', () => {
    it('converts white to L*≈100, a*≈0, b*≈0', () => {
        const lab = rgbToLab(255, 255, 255);
        expect(lab.l).toBeCloseTo(100, 0);
        expect(lab.a).toBeCloseTo(0, 0);
        expect(lab.b).toBeCloseTo(0, 0);
    });

    it('converts black to L*≈0, a*≈0, b*≈0', () => {
        const lab = rgbToLab(0, 0, 0);
        expect(lab.l).toBeCloseTo(0, 0);
        expect(lab.a).toBeCloseTo(0, 0);
        expect(lab.b).toBeCloseTo(0, 0);
    });

    it('converts pure red to approximately L*53, a*80, b*67', () => {
        const lab = rgbToLab(255, 0, 0);
        expect(lab.l).toBeCloseTo(53.23, 0);
        expect(lab.a).toBeCloseTo(80.11, 0);
        expect(lab.b).toBeCloseTo(67.22, 0);
    });

    it('converts mid-gray to L*≈53.6', () => {
        const lab = rgbToLab(128, 128, 128);
        expect(lab.l).toBeCloseTo(53.59, 0);
        expect(lab.a).toBeCloseTo(0, 0);
        expect(lab.b).toBeCloseTo(0, 0);
    });
});

// ---------------------------------------------------------------------------
// deltaE76
// ---------------------------------------------------------------------------
describe('deltaE76', () => {
    it('returns 0 for identical colors', () => {
        expect(deltaE76({ r: 128, g: 64, b: 32 }, { r: 128, g: 64, b: 32 })).toBe(0);
    });

    it('returns a small value for similar colors', () => {
        const d = deltaE76({ r: 255, g: 0, b: 0 }, { r: 250, g: 5, b: 5 });
        expect(d).toBeLessThan(5);
        expect(d).toBeGreaterThan(0);
    });

    it('returns a large value for very different colors', () => {
        const d = deltaE76({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 });
        expect(d).toBeGreaterThan(50);
    });

    it('is symmetric', () => {
        const a = { r: 100, g: 50, b: 200 };
        const b = { r: 200, g: 100, b: 50 };
        expect(deltaE76(a, b)).toBeCloseTo(deltaE76(b, a), 10);
    });

    it('black vs white has large Delta-E', () => {
        const d = deltaE76({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
        expect(d).toBeCloseTo(100, 0); // L* goes from 0 to 100
    });
});
