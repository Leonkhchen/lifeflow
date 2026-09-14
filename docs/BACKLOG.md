# Backlog

## Phase 1.1

### [P1.1-001] 修正 Mermaid CLI fallback，使 mmdc 能在目標開發環境產生真正的 Mermaid SVG，而非 placeholder SVG

- **現況**：`scripts/render-mermaid.ts` 在 `mmdc` 失敗時改走 fallback，只輸出「Mermaid Diagram (fallback)」文字 SVG＋Playwright 截圖 PNG（見 `artifacts/architecture/lifeflow-overview.svg`）。Smoke 測試因此仍通過，但架構圖不是真正的 Mermaid 渲染。
- **目標**：在目標開發環境（Windows 11＋Node LTS）讓 `mmdc` 成功產生真正的 Mermaid SVG。
- **可能方向**：
  1. 對齊 `@mermaid-js/mermaid-cli` 與 `playwright`／Chromium 版本（README 已記載版本錯位為已知成因）。
  2. 改用 `puppeteerConfigFile` 明確指定 Chromium 執行檔路徑，避免 mmdc 內建 puppeteer 下載的 Chromium 與系統不合。
  3. 評估改用 `@mermaid-js/mermaid` 程式化 API＋Playwright 截圖，取代 mmdc 子程序。
- **驗收**：刪除 fallback 仍能通過 `tests/smoke.test.ts` 的 mermaid 測試，且產出的 `.svg` 包含真正的 Mermaid 節點圖形（非單一 `<text>` 佔位）。
- **約束**：不可部署 production；不可做破壞性 Cloudflare 變更；不實作 MCP 或生成式圖片 API。
