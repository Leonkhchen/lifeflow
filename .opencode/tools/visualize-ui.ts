import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { guardArtifactPath, resolveVersionedGroup } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";
import { buildUiHtml } from "../../src/lib/ui-template.js";
import { renderHtml } from "../../scripts/render-html.js";

const viewportMap = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 1180, height: 820 },
  mobile: { width: 390, height: 844 },
} as const;

export default tool({
  description: "Generate static UI mockup HTML and screenshot PNG via Playwright",
  args: {
    title: tool.schema.string().min(1).describe("non-empty title"),
    description: tool.schema.string().min(1).describe("UI requirements or body"),
    viewport: tool.schema.enum(["desktop", "tablet", "mobile"]).describe("viewport preset"),
    outputName: tool.schema.string().min(1).describe("safe filename stem"),
    html: tool.schema.string().optional().describe("complete HTML string; when provided render directly"),
  },
  async execute(args, context) {
    try {
      if (!args.title.trim()) throw new Error("title must be non-empty");
      if (!args.description.trim()) throw new Error("description must be non-empty");

      const projectRoot = context.directory ?? context.worktree ?? process.cwd();
      const dirRel = "artifacts/ui";
      guardArtifactPath(projectRoot, path.posix.join(dirRel, "_check"));

      const [htmlRel, pngRel] = resolveVersionedGroup(projectRoot, dirRel, args.outputName, [".html", ".png"]);
      const htmlAbs = path.resolve(projectRoot, htmlRel);
      fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });

      let htmlContent: string;
      if (args.html && args.html.trim()) {
        htmlContent = args.html;
        if (!htmlContent.toLowerCase().includes("<html")) {
          htmlContent = `<!doctype html><html><head><meta charset="utf-8"><title>${args.title}</title></head><body>${htmlContent}</body></html>`;
        }
      } else {
        htmlContent = buildUiHtml({ title: args.title, description: args.description, projectRoot });
      }

      fs.writeFileSync(htmlAbs, htmlContent, "utf8");

      const vp = viewportMap[args.viewport];
      await renderHtml({
        htmlPath: htmlRel,
        outputPath: pngRel,
        viewportWidth: vp.width,
        viewportHeight: vp.height,
        fullPage: true,
        projectRoot,
      });

      return { output: `UI mockup generated: "${args.title}" viewport=${args.viewport}\n- ${htmlRel}\n- ${pngRel}` };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
