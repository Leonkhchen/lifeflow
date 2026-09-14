# Requirements

## 1. Goal
Build a reusable OpenCode Visual Development Kit for Cloudflare Web Apps.

## 2. Primary Stack
Preferred baseline:
- TypeScript
- Vite
- React where applicable
- Cloudflare Workers
- Wrangler
- D1 optional
- Playwright
- Storybook optional / conditional
- GitHub
- Cloudflare Preview deployments

The kit must remain adaptable to non-React frontends.

## 3. Required Capabilities

### 3.1 Local Preview
Provide a standard way to start the front-end dev server, optionally start `wrangler dev`, determine preview URLs, and report startup failures clearly.

### 3.2 Screenshot Tool
Create an OpenCode tool that can open a URL, wait for the page to settle, capture a screenshot, save under `artifacts/ui/`, and support at least desktop 1440x900, tablet 1024x768, mobile 390x844.

### 3.3 Visual Check
Check horizontal overflow, obvious clipping, missing primary buttons, dialogs outside viewport, navigation overlap, console errors, and failed page/resource requests. First version may use heuristics and does not need AI vision.

### 3.4 Before / After
Support before screenshot, after screenshot, and optional image diff.

### 3.5 Storybook
Add a recommended Storybook workflow, required only when reusable/stateful components exist.

### 3.6 Cloudflare Preview
Workflow: validate locally first → feature branch → push GitHub → prepare Cloudflare Preview → report Preview URL → do not merge/deploy production automatically.

### 3.7 Visualize Architecture
Retain lightweight architecture visualization support using Mermaid. Store diagrams under `artifacts/architecture/`.

## 4. OpenCode Commands
Implement:
- `/implement-visual-dev`
- `/ui-preview`
- `/visual-check`
- `/prepare-preview`

## 5. Project Behavior
OpenCode must treat local visual verification as mandatory for visible UI changes unless technically impossible.

## 6. Non-Goals for Phase 1
Do not implement generative image APIs, MCP server hosting, AI vision comparison, automatic production deployment, complex cloud orchestration, or automatic destructive Cloudflare changes.

## 7. Success Criteria
OpenCode can modify UI and produce local preview, desktop screenshot, mobile screenshot, test result, visual-check result, optional before/after, and a clear report before any production deployment.
