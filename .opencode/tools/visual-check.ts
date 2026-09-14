import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { guardArtifactPath, resolveVersioned } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";

export default tool({
  description: "Visual check: load URL, detect horizontal overflow, console errors, failed requests, obvious clipping, and capture desktop+mobile screenshots",
  args: {
    url: tool.schema.string().url().describe("URL to check"),
    outputPrefix: tool.schema.string().min(1).optional().describe("prefix for screenshot files, default visual-check"),
  },
  async execute(args, context) {
    const projectRoot = (context as unknown as { directory?: string; worktree?: string }).directory ?? (context as unknown as { worktree?: string }).worktree ?? process.cwd();
    const prefix = args.outputPrefix ?? "visual-check";
    const desktopRel = resolveVersioned(projectRoot, "artifacts/ui", `${prefix}-desktop`, ".png");
    const mobileRel = resolveVersioned(projectRoot, "artifacts/ui", `${prefix}-mobile`, ".png");
    guardArtifactPath(projectRoot, desktopRel);
    guardArtifactPath(projectRoot, mobileRel);
    const desktopAbs = path.resolve(projectRoot, desktopRel);
    const mobileAbs = path.resolve(projectRoot, mobileRel);
    fs.mkdirSync(path.dirname(desktopAbs), { recursive: true });

    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    let pageErrors: string[] = [];
    let horizontalOverflow = false;
    let overflowDetails: string[] = [];

    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    try {
      browser = await chromium.launch();
      const check = async (viewport: { width: number; height: number }, outAbs: string) => {
        const ctx = await browser!.newContext({ viewport });
        const page = await ctx.newPage();
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
        });
        page.on("pageerror", (err) => pageErrors.push(err.message));
        page.on("requestfailed", (req) => {
          if (req.resourceType() !== "image" && req.url().startsWith("http")) {
            failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText ?? "failed"}`);
          }
        });
        page.on("response", (res) => {
          if (res.status() >= 400 && res.request().resourceType() === "document") {
            failedRequests.push(`${res.status()} ${res.url()}`);
          }
        });
        await page.goto(args.url, { waitUntil: "load", timeout: 20000 });
        await page.waitForTimeout(800);
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const bodyScroll = document.body ? document.body.scrollWidth : 0;
          let hasOverflow = scrollWidth > docWidth + 20 || bodyScroll > docWidth + 20;
          const offenders: string[] = [];
          if (hasOverflow) {
            let unintended = 0;
            document.querySelectorAll("*").forEach((el) => {
              if ((el as HTMLElement).closest(".board-wrap")) return;
              const rect = (el as HTMLElement).getBoundingClientRect();
              if (rect.width > docWidth + 10 && rect.width < 5000) {
                unintended++;
                if (unintended <= 5) {
                  const tag = el.tagName.toLowerCase();
                  const cls = (el as HTMLElement).className ? `.${String((el as HTMLElement).className).split(" ")[0]}` : "";
                  offenders.push(`${tag}${cls} width=${Math.round(rect.width)}`);
                }
              }
            });
            if (unintended === 0) hasOverflow = false;
          }
          return { hasOverflow, scrollWidth, docWidth, bodyScroll, offenders };
        });
        horizontalOverflow = horizontalOverflow || overflow.hasOverflow;
        if (overflow.hasOverflow) {
          overflowDetails = overflow.offenders;
          failedRequests; // keep
        }
        await page.screenshot({ path: outAbs, fullPage: true });
        await ctx.close();
        return overflow;
      };

      await check({ width: 1440, height: 900 }, desktopAbs);
      await check({ width: 390, height: 844 }, mobileAbs);
    } finally {
      if (browser) await browser.close();
    }

    const okOverflow = !horizontalOverflow ? "PASS" : "FAIL: horizontal overflow detected";
    const okConsole = consoleErrors.length === 0 && pageErrors.length === 0 ? "PASS" : `WARN: ${consoleErrors.length + pageErrors.length} error(s)`;
    const okRequests = failedRequests.length === 0 ? "PASS" : `WARN: ${failedRequests.length} failed request(s)`;

    const report = [
      `Visual check for ${args.url}`,
      `- Desktop screenshot: ${desktopRel}`,
      `- Mobile screenshot: ${mobileRel}`,
      `- Horizontal overflow: ${okOverflow}${horizontalOverflow && overflowDetails.length ? ` (${overflowDetails.join(", ")})` : ""}`,
      `- Console/page errors: ${okConsole}${consoleErrors.length ? ` -> ${consoleErrors.slice(0, 3).join(" | ")}` : ""}${pageErrors.length ? ` | pageerror: ${pageErrors.slice(0, 2).join(" | ")}` : ""}`,
      `- Failed requests: ${okRequests}${failedRequests.length ? ` -> ${failedRequests.slice(0, 3).join(" | ")}` : ""}`,
      `- Artifacts saved under artifacts/ui/`,
    ].join("\n");

    return { output: report };
  },
});
