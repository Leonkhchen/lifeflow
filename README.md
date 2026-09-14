# LifeFlow · Cloudflare + OpenCode Visual Development

LifeFlow 是 Vite + React 個人看板（localStorage 持久化），本倉庫已整合 **Cloudflare + OpenCode Visual Development Kit Phase 1**。

## 目標
- 本地啟動 → 瀏覽器驗證 → 自動擷取 Desktop/Tablet/Mobile 截圖 → Playwright visual checks → 保留 before/after → 通過驗證後才進入 GitHub / Cloudflare Preview。Production 需使用者明確批准。

## 快速開始

```bash
npm install                 # 安裝依賴
npx playwright install chromium  # 安裝瀏覽器（僅首次）
npm run typecheck           # TypeScript 檢查
npm test                    # 單元 + smoke 測試
npm run verify              # typecheck + tests（完整本地驗證）
npm run dev                 # 啟動前端 http://localhost:5173
```

驗證後再做視覺化檢查：
```bash
npm run visual:check        # 預設檢查 http://localhost:5173，輸出 desktop/mobile 截圖至 artifacts/ui/
npm run visual:screenshot   # 一次出三種尺寸: desktop/tablet/mobile
npx playwright test          # E2E visual 測試（含無橫向溢出、截圖有效性）
```

## 典型工作流
需求 → OpenCode 實作 → `npm run dev` 本地預覽 → Playwright 截圖 → 使用者確認 → feature branch → push GitHub → Cloudflare Preview → 使用者實機驗收 → merge main →（使用者批准後）Production。

## UI-only 工作流（只改畫面）
1. `npm run dev` 啟動。
2. 修改 `src/App.tsx` 或 `src/index.css`。
3. `./opencode/commands/ui-preview.md` 或 `npm run visual:screenshot` 出截圖。
4. `npm run visual:check` 確認無 overflow、無嚴重 console 錯誤。
5. 截圖存於 `artifacts/ui/`，不直接覆蓋已核准圖（自動產生 v2/v3）。

## Cloudflare Preview 工作流
- 本地驗證通過後才建分支：`git checkout -b feature/xxx`
- `git push` → Cloudflare Pages 自動為分支建 Preview，Dashboard 取得 Preview URL。
- 僅在 Preview 被使用者驗收後才合併至 `main`；Production 部署需明確批准，絕不自動發布。

## 目錄
```
.opencode/
  tools/screenshot-page.ts      URL + viewport → artifacts/ui/*.png
  tools/visual-check.ts         檢查 overflow/console/failed requests + 截圖
  tools/visualize-diagram.ts    Mermaid → .mmd/.svg/.png
  tools/visualize-ui.ts         HTML mockup → .html + PNG
  tools/render-preview.ts       HTML → PNG
  tools/capture-before-after.ts before/after + diff
  commands/implement-visual-dev.md / ui-preview.md / visual-check.md / prepare-preview.md
scripts/render-html.ts, render-mermaid.ts, visual-check.ts, capture-screenshots.ts
templates/ui-basic.html, chart-basic.html
tests/visual.spec.ts, smoke.test.ts, paths.test.ts
artifacts/ui/, artifacts/architecture/, artifacts/charts/
docs/TOOLING.md, STORYBOOK_DECISION.md
```

## 疑難排解
| 問題 | 解法 |
|---|---|
| `playwright` 缺少瀏覽器 | `npx playwright install chromium` |
| `mmdc` 報錯 | 已含 fallback：產生占位 SVG+PNG 確保 smoke 通過；對齊 `@mermaid-js/mermaid-cli` 與 `playwright` 版本 |
| `artifacts/` 路徑報錯 | 僅允許 `artifacts/` 下、非絕對、無 `..` |
| `wrangler dev` 失敗 | 靜態模式可忽略，`npm run dev` 為主要預覽 |
| Storybook 未安裝 | 本專案為小原型，已文件化跳過原因（docs/STORYBOOK_DECISION.md） |

## Phase 1 排除事項
不含 MCP、生成式圖片 API、AI vision 比對、自動 Production 部署、複雜雲端編排、破壞性 Cloudflare 變更。
