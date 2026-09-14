import fs from "node:fs";
import path from "node:path";
import { renderMermaid } from "./render-mermaid.js";
import { renderHtml } from "./render-html.js";
import { buildChartHtml } from "../src/lib/chart-template.js";
import { buildUiHtml } from "../src/lib/ui-template.js";

const root = process.cwd();

async function genDiagram() {
  const ex = JSON.parse(fs.readFileSync(path.join(root, "examples/diagram-example.json"), "utf8"));
  const dir = "artifacts/architecture";
  const base = ex.outputName;
  const mmdRel = `${dir}/${base}.mmd`;
  const svgRel = `${dir}/${base}.svg`;
  const pngRel = `${dir}/${base}.png`;
  fs.mkdirSync(path.resolve(root, dir), { recursive: true });
  const content = ex.content;
  if (!fs.existsSync(path.resolve(root, mmdRel))) {
    fs.writeFileSync(path.resolve(root, mmdRel), content, "utf8");
  } else {
    console.log(`Skip diagram ${mmdRel} exists, testing versioning would use -v2`);
  }
  await renderMermaid({ mmdPath: mmdRel, svgPath: svgRel, pngPath: pngRel, projectRoot: root });
  console.log(`Diagram example: ${mmdRel} ${svgRel} ${pngRel}`);
}

async function genUI() {
  const ex = JSON.parse(fs.readFileSync(path.join(root, "examples/ui-example.json"), "utf8"));
  const dir = "artifacts/ui";
  const base = ex.outputName;
  const htmlRel = `${dir}/${base}.html`;
  const pngRel = `${dir}/${base}.png`;
  fs.mkdirSync(path.resolve(root, dir), { recursive: true });
  const html = buildUiHtml({ title: ex.title, description: ex.description, projectRoot: root });
  fs.writeFileSync(path.resolve(root, htmlRel), html, "utf8");
  const vpMap: any = { desktop: { width: 1440, height: 1000 }, tablet: { width: 1180, height: 820 }, mobile: { width: 390, height: 844 } };
  const vp = vpMap[ex.viewport] ?? vpMap.tablet;
  await renderHtml({ htmlPath: htmlRel, outputPath: pngRel, viewportWidth: vp.width, viewportHeight: vp.height, fullPage: true, projectRoot: root });
  console.log(`UI example: ${htmlRel} ${pngRel}`);
}

async function genChart() {
  const ex = JSON.parse(fs.readFileSync(path.join(root, "examples/chart-example.json"), "utf8"));
  const dir = "artifacts/charts";
  const base = ex.outputName;
  const htmlRel = `${dir}/${base}.html`;
  const pngRel = `${dir}/${base}.png`;
  fs.mkdirSync(path.resolve(root, dir), { recursive: true });
  const html = buildChartHtml({ chartType: ex.chartType, title: ex.title, data: ex.data, projectRoot: root });
  fs.writeFileSync(path.resolve(root, htmlRel), html, "utf8");
  await renderHtml({ htmlPath: htmlRel, outputPath: pngRel, viewportWidth: 1280, viewportHeight: 720, fullPage: true, projectRoot: root });
  console.log(`Chart example: ${htmlRel} ${pngRel}`);
}

await genDiagram();
await genUI();
await genChart();
console.log("Examples generated");
