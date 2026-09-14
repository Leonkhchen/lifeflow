import * as fs from "node:fs";
import * as path from "node:path";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildUiHtml(opts: { title: string; description: string; projectRoot: string }): string {
  const templatePath = path.resolve(opts.projectRoot, "templates", "ui-basic.html");
  let tpl = fs.readFileSync(templatePath, "utf8");
  const title = escapeHtml(opts.title);
  const desc = escapeHtml(opts.description);
  tpl = tpl.replaceAll("{{TITLE}}", title);
  tpl = tpl.replaceAll("{{SUBTITLE}}", desc.slice(0, 80));
  tpl = tpl.replaceAll("{{DESCRIPTION}}", desc);
  return tpl;
}
