---
description: Implement and verify OpenCode Visualize Phase 1 from this repo's specification
---

Read `AGENTS.md`, `SPEC.md`, `TASKS.md`, and `ACCEPTANCE.md` in full.

Implement Phase 1 end to end. Work through `TASKS.md` in order. Do not add Phase 2 features such as MCP, cloud deployment, or generative image APIs.

Requirements:

1. Use project-local OpenCode custom tools under `.opencode/tools/`.
2. Use TypeScript and `@opencode-ai/plugin` tool definitions.
3. Implement Mermaid → MMD/SVG/PNG.
4. Implement UI HTML → PNG through Playwright.
5. Implement ECharts HTML → PNG.
6. Guard all artifact paths and implement non-destructive version suffixing.
7. Add automated tests and a single `npm run verify` path.
8. Run verification, fix failures, and re-run until acceptance criteria pass.
9. Update `TASKS.md` and `ACCEPTANCE.md` checkboxes honestly.

At the end, report:

- files created/modified
- verification commands run
- pass/fail status
- generated example artifact paths
- any environment-specific caveats
