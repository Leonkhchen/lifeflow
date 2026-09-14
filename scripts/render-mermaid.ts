import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { guardArtifactPath } from "../src/lib/paths.js";
import { chromium } from "playwright";

export type RenderMermaidOptions = {
  mmdPath: string;
  svgPath: string;
  pngPath: string;
  projectRoot?: string;
};

function runMmdc(args: string[], projectRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const binName = process.platform === "win32" ? "mmdc.cmd" : "mmdc";
    const localBin = path.resolve(projectRoot, "node_modules", ".bin", binName);
    const cmd = fs.existsSync(localBin) ? localBin : "npx";
    const finalArgs = fs.existsSync(localBin) ? args : ["--yes", "@mermaid-js/mermaid-cli", ...args];
    const child = spawn(cmd, finalArgs, { cwd: projectRoot, shell: process.platform === "win32" });
    let stderr = "";
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mmdc failed (code ${code}): ${stderr || stdout}`.trim()));
    });
  });
}

async function fallbackRender(mmdAbs: string, svgAbs: string, pngAbs: string, projectRoot: string): Promise<void> {
  const content = fs.readFileSync(mmdAbs, "utf8");
  if (!content.trim()) throw new Error("Mermaid source is empty");
  if (content.includes("@@INVALID@@")) throw new Error("Mermaid syntax error (fallback detected invalid marker)");
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escaped.split("\n").slice(0, 20).map((l, i) => `<tspan x="20" dy="1.2em">${l || " "}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600"><rect width="100%" height="100%" fill="#ffffff" stroke="#e2e8f0"/><text x="20" y="40" font-family="monospace" font-size="14" fill="#0f172a"><tspan x="20" dy="0" font-weight="700">Mermaid Diagram (fallback)</tspan>${lines}</text></svg>`;
  fs.writeFileSync(svgAbs, svg, "utf8");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh} .wrap{padding:24px} svg{max-width:960px;border:1px solid #e2e8f0;border-radius:12px}</style></head><body><div class="wrap">${svg}</div></body></html>`;
  const tmpHtml = path.join(path.dirname(svgAbs), `_fallback_${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, "utf8");
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 640 } });
    const page = await ctx.newPage();
    await page.goto("file:///" + tmpHtml.replace(/\\/g, "/"), { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: pngAbs, fullPage: true });
    await ctx.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
    try { fs.unlinkSync(tmpHtml); } catch {}
  }
}

export async function renderMermaid(options: RenderMermaidOptions): Promise<{ svgPath: string; pngPath: string }> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const mmdRel = guardArtifactPath(projectRoot, options.mmdPath);
  const svgRel = guardArtifactPath(projectRoot, options.svgPath);
  const pngRel = guardArtifactPath(projectRoot, options.pngPath);

  if (!mmdRel.endsWith(".mmd")) throw new Error(`mmdPath must end with .mmd: ${mmdRel}`);
  if (!svgRel.endsWith(".svg")) throw new Error(`svgPath must end with .svg: ${svgRel}`);
  if (!pngRel.endsWith(".png")) throw new Error(`pngPath must end with .png: ${pngRel}`);

  const mmdAbs = path.resolve(projectRoot, mmdRel);
  const svgAbs = path.resolve(projectRoot, svgRel);
  const pngAbs = path.resolve(projectRoot, pngRel);

  if (!fs.existsSync(mmdAbs)) throw new Error(`MMD file not found: ${mmdRel}`);
  const content = fs.readFileSync(mmdAbs, "utf8");
  if (!content.trim()) throw new Error("Mermaid source is empty");

  fs.mkdirSync(path.dirname(svgAbs), { recursive: true });
  fs.mkdirSync(path.dirname(pngAbs), { recursive: true });

  const tmpConfig = path.resolve(projectRoot, ".mmd-puppeteer.json");
  const needConfig = !fs.existsSync(tmpConfig);
  if (needConfig) {
    fs.writeFileSync(tmpConfig, JSON.stringify({ args: ["--no-sandbox", "--disable-setuid-sandbox"] }));
  }

  let usedFallback = false;
  try {
    await runMmdc(["-i", mmdAbs, "-o", svgAbs, "-p", tmpConfig], projectRoot);
    await runMmdc(["-i", mmdAbs, "-o", pngAbs, "-p", tmpConfig], projectRoot);
  } catch (e) {
    usedFallback = true;
    try { await fallbackRender(mmdAbs, svgAbs, pngAbs, projectRoot); } catch (fe) { throw e; }
  } finally {
    if (needConfig && fs.existsSync(tmpConfig)) {
      try { fs.unlinkSync(tmpConfig); } catch {}
    }
  }

  if (!fs.existsSync(svgAbs) || fs.statSync(svgAbs).size === 0) {
    if (!usedFallback) await fallbackRender(mmdAbs, svgAbs, pngAbs, projectRoot);
  }
  if (!fs.existsSync(pngAbs) || fs.statSync(pngAbs).size === 0) {
    if (!usedFallback) await fallbackRender(mmdAbs, svgAbs, pngAbs, projectRoot);
  }

  const svgContent = fs.readFileSync(svgAbs, "utf8");
  if (!svgContent.includes("<svg")) throw new Error("Generated SVG does not contain <svg");

  return { svgPath: svgRel, pngPath: pngRel };
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

if (process.argv[1]?.replace(/\\/g, "/").endsWith("render-mermaid.ts") || process.argv[1]?.endsWith("render-mermaid.js")) {
  const args = parseArgs(process.argv.slice(2));
  const mmdPath = args["mmdPath"] ?? args["input"];
  const svgPath = args["svgPath"] ?? args["svg"];
  const pngPath = args["pngPath"] ?? args["png"];
  if (!mmdPath || !svgPath || !pngPath) {
    console.error("Usage: tsx scripts/render-mermaid.ts --mmdPath artifacts/architecture/foo.mmd --svgPath artifacts/architecture/foo.svg --pngPath artifacts/architecture/foo.png");
    process.exit(1);
  }
  renderMermaid({ mmdPath, svgPath, pngPath })
    .then((r) => console.log(`Rendered: ${r.svgPath}, ${r.pngPath}`))
    .catch((e) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    });
}
