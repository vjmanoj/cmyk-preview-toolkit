# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-04-15

### Added
- `findNearestForMany()` — batch palette matching with pre-computed Lab cache for deltaE76 metric
- `BatchMatchResult` type for batch matching results
- `parseCssColor()` — parse CSS color strings (`rgb()`, `rgba()`, `hsl()`, `hsla()`, hex) into `ColorValue`
- `validateCmyk()` / `validateRgb()` / `validateHsl()` — opt-in validation with descriptive `RangeError` messages
- RGB → CMYK → RGB round-trip drift regression tests
- Lint step added to GitHub Actions CI pipeline

### Changed
- `toPreviewHex()` and `toPreviewRgb()` now accept `HSLColor` inputs (previously only CMYK and RGB)

## [2.0.0] - 2026-03-04

### Added
- `rgbToCmyk()` — GCR-based RGB→CMYK conversion
- `hexToHsl()` / `hslToHex()` — HSL color space helpers
- `HSLColor` type for HSL color values
- `deltaE76()` — CIE76 perceptual distance metric
- `rgbToLab()` — sRGB to CIE Lab conversion
- `distanceMetric` option on `SnapOptions` for perceptual snapping (`'rgb'` | `'deltaE76'`)
- ESLint + Prettier configuration for consistent code quality
- GitHub Actions CI (Node 18/20/22)

### Changed
- `findNearestPaletteEntry` now accepts optional `distanceMetric` in `SnapOptions`
- `ColorValue` union type now includes `HSLColor`

## [1.0.0] - 2026-03-03

### Added
- Core CMYK→sRGB polynomial from pdf.js (`deviceCmykToRgb`)
- Hex normalization and conversion utilities
- Palette snapping with configurable distance/dominance thresholds
- Immutable state helpers for dual color representation
- React hook (`usePaletteColor`) for automatic palette snapping
- TypeScript types: `CMYKColor`, `RGBColor`, `PaletteEntry`, `DualColorState`
- ESM + CJS dual output with TypeScript declarations
- Comprehensive test suite (68 tests)
