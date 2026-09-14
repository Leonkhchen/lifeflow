# Storybook Decision

## Context
LifeFlow is a small single-page Vite + React app with localStorage persistence. Reusable components are limited to `App.tsx` lists/cards and modal; there is no design system with many variants.

## Decision: Skip full Storybook setup for Phase 1

- Per `AGENTS.md` Storybook Rule: “Do not force Storybook for very small one-page prototypes.”
- Overhead: Storybook adds ~200 MB deps and build time disproportionate to benefit at this scale.
- Alternative provided: HTML mockups via `visualize-ui` (`templates/ui-basic.html`) cover visual iteration without Storybook.

## When to revisit
Add Storybook when:
- 3+ reusable components with multiple visual states (e.g., Card variants, List, Modal)
- Need for isolated component review or design-system documentation
- Medium/large feature growth

## Minimal placeholder
`npm run storybook` prints guidance: see this file. The pipeline remains green (typecheck/tests pass) without Storybook.

## Example story (future template)
If enabled, create `.storybook/main.ts` with `@storybook/react-vite` and one story per component under `src/stories/`.
