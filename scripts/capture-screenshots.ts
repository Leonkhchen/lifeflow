import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const url = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ?? process.argv[process.argv.indexOf("--url") + 1] ?? "http://localhost:5173";
const name = process.argv.find((a) => a.startsWith("--name="))?.split("=")[1] ?? "lifeflow-home";

async function shot(viewport: { width: number; height: number }, suffix: string) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(800);
    const out = path.resolve(process.cwd(), `artifacts/ui/${name}-${suffix}.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: true });
    console.log(`Saved ${out}`);
    await ctx.close();
  } finally {
    if (browser) await browser.close();
  }
}

(async () => {
  await shot({ width: 1440, height: 900 }, "desktop");
  await shot({ width: 1024, height: 768 }, "tablet");
  await shot({ width: 390, height: 844 }, "mobile");
})();
