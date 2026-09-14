import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { guardArtifactPath, resolveVersioned } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";

export default tool({
  description: "Capture before and after screenshots for the same URL, optionally generate a diff placeholder",
  args: {
    url: tool.schema.string().url().describe("URL to capture"),
    beforeName: tool.schema.string().min(1).describe("filename stem for before, saved under artifacts/ui/"),
    afterName: tool.schema.string().min(1).describe("filename stem for after, saved under artifacts/ui/"),
    viewport: tool.schema.enum(["desktop", "tablet", "mobile"]).optional().describe("viewport preset, default desktop"),
    generateDiff: tool.schema.boolean().optional().describe("generate diff placeholder, default true"),
  },
  async execute(args, context) {
    try {
      const projectRoot = (context as unknown as { directory?: string }).directory ?? process.cwd();
      const vpMap: Record<string, { width: number; height: number }> = {
        desktop: { width: 1440, height: 900 },
        tablet: { width: 1024, height: 768 },
        mobile: { width: 390, height: 844 },
      };
      const vp = vpMap[args.viewport ?? "desktop"] ?? vpMap.desktop;
      const beforeRel = resolveVersioned(projectRoot, "artifacts/ui", args.beforeName, ".png");
      const afterRel = resolveVersioned(projectRoot, "artifacts/ui", args.afterName, ".png");
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
          await page.goto(args.url, { waitUntil: "load", timeout: 20000 });
          await page.waitForTimeout(700);
          await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
          await page.screenshot({ path: outAbs, fullPage: true });
          await ctx.close();
        } finally {
          if (browser) await browser.close();
        }
      }

      await shot(beforeAbs);
      await shot(afterAbs);

      let diffLine = "";
      if (args.generateDiff ?? true) {
        try {
          const beforeBuf = fs.readFileSync(beforeAbs);
          const afterBuf = fs.readFileSync(afterAbs);
          if (!beforeBuf.equals(afterBuf)) {
            const diffRel = resolveVersioned(projectRoot, "artifacts/ui", `${args.beforeName}-diff`, ".png");
            guardArtifactPath(projectRoot, diffRel);
            fs.copyFileSync(afterAbs, path.resolve(projectRoot, diffRel));
            diffLine = `\n- Diff (placeholder): ${diffRel}`;
          }
        } catch {}
      }

      return { output: `Before/after captured for ${args.url}\n- Before: ${beforeRel}\n- After: ${afterRel}${diffLine}` };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
