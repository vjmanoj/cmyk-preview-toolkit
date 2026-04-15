import { describe, it, expect } from 'vitest';
import { validateCmyk, validateRgb, validateHsl } from '../src/validate';

// ---------------------------------------------------------------------------
// validateCmyk
// ---------------------------------------------------------------------------
describe('validateCmyk', () => {
    it('does not throw for valid values', () => {
        expect(() => validateCmyk(0, 0.5, 1, 0)).not.toThrow();
    });

    it('does not throw for out-of-range but finite values', () => {
        // Validation checks finiteness, not range — clamping is the converter's job
        expect(() => validateCmyk(-0.5, 1.5, 0, 0)).not.toThrow();
    });

    it('throws for NaN in c', () => {
        expect(() => validateCmyk(NaN, 0, 0, 0)).toThrow(RangeError);
        expect(() => validateCmyk(NaN, 0, 0, 0)).toThrow('"c"');
    });

    it('throws for NaN in m', () => {
        expect(() => validateCmyk(0, NaN, 0, 0)).toThrow('"m"');
    });

    it('throws for NaN in y', () => {
        expect(() => validateCmyk(0, 0, NaN, 0)).toThrow('"y"');
    });

    it('throws for NaN in k', () => {
        expect(() => validateCmyk(0, 0, 0, NaN)).toThrow('"k"');
    });

    it('throws for Infinity', () => {
        expect(() => validateCmyk(Infinity, 0, 0, 0)).toThrow(RangeError);
        expect(() => validateCmyk(0, -Infinity, 0, 0)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// validateRgb
// ---------------------------------------------------------------------------
describe('validateRgb', () => {
    it('does not throw for valid values', () => {
        expect(() => validateRgb(0, 128, 255)).not.toThrow();
    });

    it('throws for NaN in r', () => {
        expect(() => validateRgb(NaN, 0, 0)).toThrow('"r"');
    });

    it('throws for NaN in g', () => {
        expect(() => validateRgb(0, NaN, 0)).toThrow('"g"');
    });

    it('throws for NaN in b', () => {
        expect(() => validateRgb(0, 0, NaN)).toThrow('"b"');
    });

    it('throws for Infinity', () => {
        expect(() => validateRgb(Infinity, 0, 0)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// validateHsl
// ---------------------------------------------------------------------------
describe('validateHsl', () => {
    it('does not throw for valid values', () => {
        expect(() => validateHsl(180, 50, 50)).not.toThrow();
    });

    it('throws for NaN in h', () => {
        expect(() => validateHsl(NaN, 50, 50)).toThrow('"h"');
    });

    it('throws for NaN in s', () => {
        expect(() => validateHsl(180, NaN, 50)).toThrow('"s"');
    });

    it('throws for NaN in l', () => {
        expect(() => validateHsl(180, 50, NaN)).toThrow('"l"');
    });

    it('throws for Infinity', () => {
        expect(() => validateHsl(0, Infinity, 0)).toThrow(RangeError);
    });
});
