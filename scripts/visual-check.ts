import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const url = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--url") + 1] ?? "http://localhost:5173";
const outPrefix = process.argv.find((a) => a.startsWith("--name="))?.split("=")[1] ?? "visual-check";

async function run() {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  let overflow = false;
  try {
    browser = await chromium.launch();
    const viewports = [
      { w: 1440, h: 900, name: `${outPrefix}-desktop.png` },
      { w: 390, h: 844, name: `${outPrefix}-mobile.png` },
    ];
    for (const vp of viewports) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
      page.on("response", (r) => { if (r.status() >= 400 && r.request().resourceType() === "document") failedRequests.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(600);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (hasOverflow) overflow = true;
      const out = path.resolve(process.cwd(), `artifacts/ui/${vp.name}`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await page.screenshot({ path: out, fullPage: true });
      console.log(`Saved ${out}`);
      await ctx.close();
    }
    console.log(`\nVisual check for ${url}`);
    console.log(`- Horizontal overflow: ${overflow ? "FAIL" : "PASS"}`);
    console.log(`- Console errors: ${consoleErrors.length === 0 ? "PASS" : consoleErrors.join(" | ")}`);
    console.log(`- Failed requests: ${failedRequests.length === 0 ? "PASS" : failedRequests.join(" | ")}`);
    if (overflow) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
