import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { renderMermaid } from "../scripts/render-mermaid.js";
import { renderHtml } from "../scripts/render-html.js";
import { buildChartHtml } from "../src/lib/chart-template.js";

const root = process.cwd();
function isPng(filePath: string): boolean {
  const buf = fs.readFileSync(filePath);
  return buf.length > 100 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

describe("smoke: mermaid", () => {
  it("creates .mmd, .svg, .png", async () => {
    const base = `smoke-diagram-${Date.now()}`;
    const mmdRel = `artifacts/architecture/${base}.mmd`;
    const svgRel = `artifacts/architecture/${base}.svg`;
    const pngRel = `artifacts/architecture/${base}.png`;
    const mmdAbs = path.resolve(root, mmdRel);
    fs.mkdirSync(path.dirname(mmdAbs), { recursive: true });
    fs.writeFileSync(mmdAbs, "flowchart LR\n  Browser-->Worker-->D1[(D1)]\n  Worker-->R2[(R2)]\n");
    const { svgPath, pngPath } = await renderMermaid({ mmdPath: mmdRel, svgPath: svgRel, pngPath: pngRel, projectRoot: root });
    expect(fs.existsSync(path.resolve(root, svgPath))).toBe(true);
    expect(fs.existsSync(path.resolve(root, pngPath))).toBe(true);
    const svg = fs.readFileSync(path.resolve(root, svgPath), "utf8");
    expect(svg).toContain("<svg");
    expect(isPng(path.resolve(root, pngPath))).toBe(true);
  }, 30000);
});

describe("smoke: html screenshot", () => {
  it("renders HTML to PNG", async () => {
    const base = `smoke-ui-${Date.now()}`;
    const htmlRel = `artifacts/ui/${base}.html`;
    const pngRel = `artifacts/ui/${base}.png`;
    const htmlAbs = path.resolve(root, htmlRel);
    fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });
    fs.writeFileSync(htmlAbs, "<!doctype html><html><body><h1>Hello Smoke</h1><p>Test UI</p></body></html>");
    const out = await renderHtml({ htmlPath: htmlRel, outputPath: pngRel, viewportWidth: 800, viewportHeight: 600, projectRoot: root });
    expect(fs.existsSync(path.resolve(root, out))).toBe(true);
    expect(isPng(path.resolve(root, out))).toBe(true);
  }, 30000);
});

describe("smoke: echarts chart", () => {
  it("renders chart HTML and PNG", async () => {
    const base = `smoke-chart-${Date.now()}`;
    const htmlRel = `artifacts/charts/${base}.html`;
    const pngRel = `artifacts/charts/${base}.png`;
    const htmlAbs = path.resolve(root, htmlRel);
    fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });
    const html = buildChartHtml({
      chartType: "bar",
      title: "Smoke Chart",
      data: [{ name: "A", value: 10 }, { name: "B", value: 20 }],
      projectRoot: root,
    });
    fs.writeFileSync(htmlAbs, html);
    expect(fs.readFileSync(htmlAbs, "utf8")).toContain("echarts");
    const out = await renderHtml({ htmlPath: htmlRel, outputPath: pngRel, viewportWidth: 900, viewportHeight: 600, projectRoot: root });
    expect(isPng(path.resolve(root, out))).toBe(true);
  }, 30000);
});
