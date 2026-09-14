# Visual Development SOP

## Standard Flow
1. Receive requirement.
2. Inspect current UI.
3. Capture baseline screenshot if modifying existing page.
4. Implement requested UI change.
5. Start local app.
6. Run visual check.
7. Capture Desktop screenshot.
8. Capture Mobile screenshot.
9. Run relevant tests.
10. Report results.
11. Wait for user validation when requested.
12. Create feature branch / PR.
13. Prepare Cloudflare Preview.
14. User validates Preview.
15. Merge only after approval.
16. Deploy production only after explicit approval.

## Fast UI Prototype Flow
Google AI Studio / Penpot / v0 → UI reference → OpenCode reimplements using project conventions → local preview → screenshot → user review.

Prototype-tool output is not authoritative production architecture.

## Small Project Rule
Vite + Playwright + Cloudflare Preview is enough. Storybook optional.

## Medium/Large Project Rule
Add Storybook for reusable components and important component states.
