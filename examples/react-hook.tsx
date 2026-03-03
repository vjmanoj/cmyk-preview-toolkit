/**
 * React hook example — CMYK Preview Toolkit
 *
 * Demonstrates how to use the `usePaletteColor` hook to automatically
 * snap EyeDropper / color-input results to the nearest CMYK palette entry.
 */

import React, { useState } from 'react';
import { usePaletteColor } from '../react/usePaletteColor';
import { normalizePalette, type DualColorState } from '../src/index';

// Build palette once (or derive from PDF template extraction)
const palette = normalizePalette([
    { source: { type: 'cmyk', c: 0.11, m: 0.24, y: 0.0, k: 0.13 } },
    { source: { type: 'cmyk', c: 0.0, m: 0.88, y: 0.77, k: 0.05 } },
    { source: { type: 'rgb', r: 12, g: 34, b: 56 } },
]);

interface TextElement extends DualColorState {
    id: string;
    text: string;
}

const ColorPicker: React.FC<{
    element: TextElement;
    onChange: (updated: TextElement) => void;
}> = ({ element, onChange }) => {
    const { setHexColor } = usePaletteColor(element, {
        palette,
        onUpdate: onChange,
        options: { maxDistance: 80, dominanceRatio: 0.55 },
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
                type="color"
                value={element.color ?? '#000000'}
                onChange={(e) => setHexColor('text', e.target.value)}
            />
            <span style={{ color: element.color ?? '#000000' }}>
                {element.text}
            </span>
            {element.colorSource && (
                <code style={{ fontSize: 11, opacity: 0.7 }}>
                    CMYK source preserved ✓
                </code>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [element, setElement] = useState<TextElement>({
        id: '1',
        text: 'Hello CMYK World',
        color: '#000000',
        colorSource: null,
    });

    return (
        <div style={{ padding: 24 }}>
            <h2>CMYK Preview Toolkit — React Demo</h2>
            <ColorPicker element={element} onChange={setElement} />
            <pre style={{ marginTop: 16, fontSize: 12 }}>
                {JSON.stringify(element, null, 2)}
            </pre>
        </div>
    );
};

export default App;
