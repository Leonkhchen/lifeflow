import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { guardArtifactPath, resolveVersioned } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";

const viewportPresets: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
  "desktop-1440": { width: 1440, height: 900 },
  "tablet-1024": { width: 1024, height: 768 },
  "mobile-390": { width: 390, height: 844 },
};

export default tool({
  description: "Open URL, wait for page to settle, capture screenshot and save under artifacts/ui/",
  args: {
    url: tool.schema.string().url().describe("URL to open, e.g. http://localhost:5173"),
    viewport: tool.schema
      .enum(["desktop", "tablet", "mobile", "desktop-1440", "tablet-1024", "mobile-390"])
      .optional()
      .describe("viewport preset, default desktop 1440x900"),
    outputName: tool.schema.string().min(1).describe("filename stem without extension, saved as artifacts/ui/<name>.png"),
    waitMs: tool.schema.number().int().min(0).max(10000).optional().describe("extra wait before screenshot in ms, default 600"),
    fullPage: tool.schema.boolean().optional().describe("full page screenshot, default true"),
  },
  async execute(args, context) {
    try {
      const projectRoot = (context as unknown as { directory?: string; worktree?: string }).directory ?? (context as unknown as { worktree?: string }).worktree ?? process.cwd();
      const preset = viewportPresets[args.viewport ?? "desktop"] ?? viewportPresets.desktop;
      const outputRel = resolveVersioned(projectRoot, "artifacts/ui", args.outputName, ".png");
      guardArtifactPath(projectRoot, outputRel);
      const outAbs = path.resolve(projectRoot, outputRel);
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });

      let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
      try {
        browser = await chromium.launch();
        const ctx = await browser.newContext({ viewport: preset });
        const page = await ctx.newPage();
        const waitUntil: "load" | "networkidle" = "load";
        await page.goto(args.url, { waitUntil, timeout: 20000 });
        await page.waitForTimeout(args.waitMs ?? 600);
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);
        await page.screenshot({ path: outAbs, fullPage: args.fullPage ?? true });
        await ctx.close();
      } finally {
        if (browser) await browser.close();
      }

      return { output: `Screenshot saved: ${outputRel} (${preset.width}x${preset.height}) from ${args.url}` };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
