# Contributing to cmyk-preview-toolkit

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork & clone** the repo
   ```bash
   git clone https://github.com/<your-username>/cmyk-preview-toolkit.git
   cd cmyk-preview-toolkit
   npm install
   ```

2. **Run the tests** to make sure everything works
   ```bash
   npm test
   ```

3. **Create a branch** for your changes
   ```bash
   git checkout -b feature/my-feature
   ```

## Development Workflow

| Command | Purpose |
|---|---|
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Build ESM + CJS output |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Coding Standards

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **Immutable patterns** — state helpers return new objects, never mutate
- **Zero runtime dependencies** — if you need a utility, implement it inline
- **JSDoc comments** on all public exports
- **Tests** for every new function or behavior change

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add rgbToHsl conversion
fix: clamp negative CMYK values
docs: update API reference table
test: add edge-case tests for deltaE76
chore: update dev dependencies
```

## Pull Request Checklist

Before submitting a PR, please ensure:

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] New exports are documented in README.md
- [ ] CHANGELOG.md is updated (under `[Unreleased]`)

## Reporting Bugs

Please [open an issue](https://github.com/vjmanoj/cmyk-preview-toolkit/issues) with:
- Node.js and npm version
- Minimal reproduction code
- Expected vs actual behavior

## Feature Requests

Have an idea? [Start a discussion](https://github.com/vjmanoj/cmyk-preview-toolkit/discussions) first — we'd love to hear your use case before you invest time coding.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
