# AGENTS.md

你正在建立一套 Cloudflare Web App Visual Development workflow。

## General Rules

- GitHub repository is the source of truth.
- OpenCode is the primary implementation agent.
- Do not use Google AI Studio / v0 / Penpot output as production source code without adapting it to the project architecture.
- Do not deploy directly to production unless the user explicitly approves.
- Prefer local visual verification before Cloudflare Preview deployment.
- Keep changes scoped to the requested task.

## Visual Development Rules

For any visible UI change:

1. Run the local application.
2. Open the changed page with Playwright.
3. Capture screenshots.
4. Validate desktop and mobile layouts.
5. Store screenshots under `artifacts/ui/`.
6. Report screenshot paths.
7. Run visual/e2e tests.
8. Only after local verification succeeds, prepare a Git branch / PR and Cloudflare Preview.
9. Production deployment requires explicit approval.

## User Intent Rules

If the user says: 先看看 / visualize / preview / 先不要正式部署 / 先讓我確認 / only preview / do not deploy production

Then:
- Do not deploy production.
- Do not modify production infrastructure.
- Prefer artifacts, local preview, screenshots, and feature-branch work.
- Preserve existing production behavior unless explicitly asked otherwise.

## UI Change Reporting

Every UI change report should include:
- Files changed
- Local preview URL
- Screenshots created
- Desktop/mobile verification
- Console errors
- Failed network requests
- Test results
- Whether Cloudflare Preview is ready

## Storybook Rule

Use Storybook when components are reusable, have multiple important visual states, the project is medium/large, or the component is part of a design system. Do not force Storybook for very small one-page prototypes.

## Artifact Naming

Examples:
- `artifacts/ui/home-desktop-v1.png`
- `artifacts/ui/home-mobile-v1.png`
- `artifacts/ui/order-before.png`
- `artifacts/ui/order-after.png`
- `artifacts/ui/order-diff.png`

Do not overwrite previous approved screenshots unless explicitly requested.
