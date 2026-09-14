import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright";
import { guardArtifactPath } from "../src/lib/paths.js";

export type RenderHtmlOptions = {
  htmlPath: string;
  outputPath: string;
  viewportWidth: number;
  viewportHeight: number;
  fullPage?: boolean;
  projectRoot?: string;
};

export async function renderHtml(options: RenderHtmlOptions): Promise<string> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const width = options.viewportWidth;
  const height = options.viewportHeight;
  if (!Number.isInteger(width) || width < 100 || width > 4000) throw new Error(`Invalid viewportWidth: ${width}`);
  if (!Number.isInteger(height) || height < 100 || height > 4000) throw new Error(`Invalid viewportHeight: ${height}`);

  const htmlRel = guardArtifactPath(projectRoot, options.htmlPath);
  const pngRel = guardArtifactPath(projectRoot, options.outputPath);
  if (!pngRel.endsWith(".png")) throw new Error(`outputPath must end with .png: ${pngRel}`);

  const htmlAbs = path.resolve(projectRoot, htmlRel);
  const pngAbs = path.resolve(projectRoot, pngRel);

  if (!fs.existsSync(htmlAbs)) throw new Error(`HTML file not found: ${htmlRel}`);

  fs.mkdirSync(path.dirname(pngAbs), { recursive: true });

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const fileUrl = "file:///" + htmlAbs.replace(/\\/g, "/").replace(/^\//, "");
    await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: pngAbs, fullPage: options.fullPage ?? true });
    await context.close();
    return pngRel;
  } finally {
    if (browser) await browser.close();
  }
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

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("render-html.ts")) {
  const args = parseArgs(process.argv.slice(2));
  const htmlPath = args["htmlPath"] ?? args["html"];
  const outputPath = args["outputPath"] ?? args["output"];
  const w = parseInt(args["width"] ?? args["viewportWidth"] ?? "1440", 10);
  const h = parseInt(args["height"] ?? args["viewportHeight"] ?? "1000", 10);
  const fullPage = args["fullPage"] !== "false";
  if (!htmlPath || !outputPath) {
    console.error("Usage: tsx scripts/render-html.ts --htmlPath artifacts/ui/foo.html --outputPath artifacts/ui/foo.png [--width 1440 --height 1000 --fullPage true]");
    process.exit(1);
  }
  renderHtml({ htmlPath, outputPath, viewportWidth: w, viewportHeight: h, fullPage })
    .then((p) => console.log(`Rendered: ${p}`))
    .catch((e) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    });
}
