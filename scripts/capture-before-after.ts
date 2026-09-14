import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { guardArtifactPath, resolveVersioned } from "../src/lib/paths.js";

export type CaptureOptions = {
  url: string;
  beforeName: string;
  afterName: string;
  viewport?: { width: number; height: number };
  projectRoot?: string;
};

export async function captureBeforeAfter(options: CaptureOptions): Promise<{ before: string; after: string; diff?: string }> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const vp = options.viewport ?? { width: 1440, height: 900 };
  const beforeRel = resolveVersioned(projectRoot, "artifacts/ui", options.beforeName, ".png");
  const afterRel = resolveVersioned(projectRoot, "artifacts/ui", options.afterName, ".png");
  guardArtifactPath(projectRoot, beforeRel);
  guardArtifactPath(projectRoot, afterRel);
  const beforeAbs = path.resolve(projectRoot, beforeRel);
  const afterAbs = path.resolve(projectRoot, afterRel);
  fs.mkdirSync(path.dirname(beforeAbs), { recursive: true });

  async function shot(outAbs: string) {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    try {
      browser = await chromium.launch();
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await page.goto(options.url, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(800);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await page.screenshot({ path: outAbs, fullPage: true });
      await ctx.close();
    } finally {
      if (browser) await browser.close();
    }
  }

  await shot(beforeAbs);
  console.log(`Before: ${beforeRel}`);
  console.log("Apply your UI change, then press Enter to capture after...");
  await new Promise<void>((resolve) => {
    if (!process.stdin.isTTY) return resolve();
    process.stdin.once("data", () => resolve());
  });
  await shot(afterAbs);
  console.log(`After: ${afterRel}`);

  let diff: string | undefined;
  try {
    const beforeBuf = fs.readFileSync(beforeAbs);
    const afterBuf = fs.readFileSync(afterAbs);
    if (!beforeBuf.equals(afterBuf)) {
      diff = resolveVersioned(projectRoot, "artifacts/ui", `${options.beforeName}-diff`, ".png");
      guardArtifactPath(projectRoot, diff);
      fs.copyFileSync(afterAbs, path.resolve(projectRoot, diff));
      console.log(`Diff (placeholder copy): ${diff}`);
    } else {
      console.log("No visual diff detected (files identical)");
    }
  } catch {}

  return { before: beforeRel, after: afterRel, diff };
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("capture-before-after.ts") || process.argv[1]?.endsWith("capture-before-after.js")) {
  const args = parseArgs(process.argv.slice(2));
  const url = args["url"] ?? "http://localhost:5173";
  const beforeName = args["before"] ?? args["beforeName"] ?? "before";
  const afterName = args["after"] ?? args["afterName"] ?? "after";
  captureBeforeAfter({ url, beforeName, afterName }).catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
