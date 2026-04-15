/**
 * React hook for the CMYK Preview Toolkit.
 *
 * Wraps palette snapping logic in a React-friendly API so that
 * EyeDropper or `<input type="color">` results are automatically
 * matched to the nearest palette entry when possible.
 *
 * @module react/usePaletteColor
 */

import { useCallback } from 'react';
import type {
    PaletteEntry,
    SnapOptions} from '../src/palette';
import {
    findNearestPaletteEntry,
    shouldSnapToPalette
} from '../src/palette';
import type {
    DualColorState,
    ColorRole} from '../src/state';
import {
    applyPaletteColor,
    applyCustomHexColor
} from '../src/state';

/** Configuration for the `usePaletteColor` hook. */
export interface UsePaletteColorOptions<T extends DualColorState> {
    /** The active palette to snap against. */
    palette: PaletteEntry[];
    /** Callback invoked with the updated element after a color is set. */
    onUpdate: (updated: T) => void;
    /** Optional snap tuning. */
    options?: SnapOptions;
}

/**
 * Hook that returns a `setHexColor` function which automatically snaps
 * sampled hex values to the nearest palette entry (if close enough) or
 * falls back to a custom hex color.
 *
 * @example
 * ```tsx
 * const { setHexColor } = usePaletteColor(element, {
 *   palette,
 *   onUpdate: onChange,
 *   options: { maxDistance: 80 },
 * });
 *
 * <input
 *   type="color"
 *   value={element.color ?? '#000000'}
 *   onChange={(e) => setHexColor('text', e.target.value)}
 * />
 * ```
 */
export const usePaletteColor = <T extends DualColorState>(
    element: T,
    { palette, onUpdate, options }: UsePaletteColorOptions<T>
) => {
    const setHexColor = useCallback(
        (role: ColorRole, hex: string | null | undefined) => {
            const result = findNearestPaletteEntry(palette, hex ?? '', options);
            if (result.entry && shouldSnapToPalette(result, options)) {
                onUpdate(applyPaletteColor(element, role, result.entry));
            } else {
                onUpdate(applyCustomHexColor(element, role, hex));
            }
        },
        [element, palette, onUpdate, options]
    );

    return { setHexColor };
};
