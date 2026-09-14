import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
let failed = false;
function log(ok: boolean, msg: string) {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
}
function exists(p: string) { return fs.existsSync(path.resolve(root, p)); }
function size(p: string) { try { return fs.statSync(path.resolve(root, p)).size; } catch { return 0; } }
function isPng(p: string) {
  try {
    const b = fs.readFileSync(path.resolve(root, p));
    return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  } catch { return false; }
}

console.log("== verify: opencode-visualize-phase1 ==\n");

log(exists(".opencode/tools/visualize-diagram.ts"), "visualize-diagram tool exists");
log(exists(".opencode/tools/visualize-ui.ts"), "visualize-ui tool exists");
log(exists(".opencode/tools/visualize-chart.ts"), "visualize-chart tool exists");
log(exists(".opencode/tools/render-preview.ts"), "render-preview tool exists");
log(exists(".opencode/commands/visualize.md"), "/visualize command exists");
log(exists(".opencode/commands/implement-phase1.md"), "/implement-phase1 command exists");
log(exists("scripts/render-html.ts"), "scripts/render-html.ts exists");
log(exists("scripts/render-mermaid.ts"), "scripts/render-mermaid.ts exists");
log(exists("templates/ui-basic.html"), "templates/ui-basic.html exists");
log(exists("src/utils.ts"), "src/utils.ts exists");
log(exists("src/chart.ts"), "src/chart.ts exists");

const tsc = spawnSync("npx", ["tsc", "--noEmit"], { cwd: root, shell: true, encoding: "utf8" });
log(tsc.status === 0, `typecheck ${tsc.status === 0 ? "passed" : "failed"}`);
if (tsc.status !== 0) console.log(tsc.stdout, tsc.stderr);

const vitest = spawnSync("npx", ["vitest", "run", "--reporter=verbose"], { cwd: root, shell: true, encoding: "utf8", timeout: 180000 });
log(vitest.status === 0, `tests ${vitest.status === 0 ? "passed" : "failed"}`);
console.log(vitest.stdout?.slice(0, 4000));
if (vitest.stderr) console.log(vitest.stderr.slice(0, 2000));

function findLatest(dirRel: string, ext: string): string | null {
  const dirAbs = path.resolve(root, dirRel);
  if (!fs.existsSync(dirAbs)) return null;
  const files = fs.readdirSync(dirAbs).filter((f) => f.endsWith(ext)).map((f) => path.join(dirRel, f));
  if (files.length === 0) return null;
  files.sort((a, b) => fs.statSync(path.resolve(root, b)).mtimeMs - fs.statSync(path.resolve(root, a)).mtimeMs);
  return files[0];
}
const archMmd = findLatest("artifacts/architecture", ".mmd");
const archSvg = findLatest("artifacts/architecture", ".svg");
const archPng = findLatest("artifacts/architecture", ".png");
const uiPng = findLatest("artifacts/ui", ".png");
const chartPng = findLatest("artifacts/charts", ".png");
const chartHtml = findLatest("artifacts/charts", ".html");
const uiHtml = findLatest("artifacts/ui", ".html");

log(!!archMmd && size(archMmd) > 0, `mermaid mmd non-empty: ${archMmd ?? "missing"} (${archMmd ? size(archMmd) : 0} bytes)`);
log(!!archSvg && (() => { try { return fs.readFileSync(path.resolve(root, archSvg!), "utf8").includes("<svg"); } catch { return false; } })(), `svg contains <svg: ${archSvg ?? "missing"} (${archSvg ? size(archSvg) : 0} bytes)`);
log(!!archPng && isPng(archPng), `mermaid png valid: ${archPng ?? "missing"} (${archPng ? size(archPng) : 0} bytes)`);
log(!!uiPng && isPng(uiPng), `ui png valid: ${uiPng ?? "missing"} (${uiPng ? size(uiPng) : 0} bytes)`);
log(!!chartPng && isPng(chartPng), `chart png valid: ${chartPng ?? "missing"} (${chartPng ? size(chartPng) : 0} bytes)`);
log(!!chartHtml && size(chartHtml) > 0, `chart html exists: ${chartHtml ?? "missing"}`);
log(!!uiHtml && size(uiHtml) > 0, `ui html exists: ${uiHtml ?? "missing"}`);

if (archPng) log(isPng(archPng), `png valid check arch`);
if (uiPng) log(isPng(uiPng), `png valid check ui`);

console.log("\n" + (failed ? "VERIFY FAILED" : "VERIFY PASSED"));
process.exit(failed ? 1 : 0);
