# Tooling & Local Preview

## Preview modes

| Mode | Command | URL | When to use |
|---|---|---|---|
| Vite frontend | `npm run dev` | http://localhost:5173 | Default for UI work, screenshot, visual-check |
| Worker (wrangler) | `npm run dev:worker` | http://localhost:8787 | Only when testing Cloudflare Worker / D1. Static-only project will print “wrangler not configured”. |
| Production build | `npm run preview` | http://localhost:4173 | After `npm run build`, verify dist assets |

## URL discovery

- `vite` prints the URL on start. Playwright config defaults to `http://localhost:5173`.
- `wrangler dev` prints its own URL; update `playwright.config.ts` baseURL if you switch.
- Screenshot tools accept an explicit `--url` so you can point at any running server.

## Process failure reporting

- `vite` failure: check terminal output for port-in-use (`5173`) → `lsof -i :5173` or `netstat -ano | findstr 5173` then kill.
- `wrangler dev` failure on Windows: ensure Node 20+ and no conflicting `.dev.vars`. The script falls back to echo so local UI work is not blocked.
- Playwright browser missing → `npx playwright install chromium`.
- Mermaid `mmdc` failure → fallback SVG + Playwright PNG is generated so smoke tests still pass; check `@mermaid-js/mermaid-cli` version alignment.

## Visual workflow (opencode)

1. Ensure `npm run dev` is running.
2. Run visual check: `npm run visual:check -- --url http://localhost:5173`
3. Capture screenshots: `npm run visual:screenshot -- --url http://localhost:5173 --name lifeflow-home`
4. Before/after: `npx tsx scripts/capture-before-after.ts --url http://localhost:5173 --before home-before --after home-after`
