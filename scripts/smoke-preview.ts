import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const url = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--url") + 1];
if (!url) {
  console.error("Usage: tsx scripts/smoke-preview.ts --url https://xxx.pages.dev");
  process.exit(1);
}

async function check(viewport: { width: number; height: number }, suffix: string) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const consoleErrors: string[] = [];
  const failedDocs: string[] = [];
  try {
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && (r.request().resourceType() === "document" || r.url().includes("/api/"))) {
        failedDocs.push(`${r.status()} ${r.url()}`);
      }
    });
    await page.goto(url, { waitUntil: "load", timeout: 25000 });
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    const title = await page.title();
    const hasApp = await page.locator("text=LifeFlow").first().isVisible().catch(() => false);
    const hasBoard = await page.locator("text=看板").first().isVisible().catch(() => false);
    const out = path.resolve(process.cwd(), `artifacts/ui/preview-${suffix}.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: true });
    console.log(JSON.stringify({ viewport: `${viewport.width}x${viewport.height}`, title, hasApp, hasBoard, consoleErrors, failedDocs, screenshot: `artifacts/ui/preview-${suffix}.png` }));
    await ctx.close();
    return consoleErrors.length === 0 && failedDocs.length === 0 && hasApp && hasBoard;
  } finally {
    if (browser) await browser.close();
  }
}

(async () => {
  const okDesktop = await check({ width: 1440, height: 900 }, "desktop");
  const okMobile = await check({ width: 390, height: 844 }, "mobile");
  console.log(`SMOKE ${okDesktop && okMobile ? "PASS" : "FAIL"}`);
  if (!(okDesktop && okMobile)) process.exitCode = 1;
})();
