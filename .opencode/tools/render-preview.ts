import { tool } from "@opencode-ai/plugin";
import { renderHtml } from "../../scripts/render-html.js";
import { formatError } from "../../src/lib/errors.js";

export default tool({
  description: "Render local HTML file under artifacts/ to PNG using Playwright",
  args: {
    htmlPath: tool.schema.string().min(1).describe("project-relative path under artifacts/, e.g. artifacts/ui/foo.html"),
    outputPath: tool.schema.string().min(1).describe("project-relative .png path under artifacts/"),
    viewportWidth: tool.schema.number().int().min(100).max(4000).describe("viewport width"),
    viewportHeight: tool.schema.number().int().min(100).max(4000).describe("viewport height"),
    fullPage: tool.schema.boolean().optional().describe("fullPage screenshot, default true"),
  },
  async execute(args, context) {
    try {
      const projectRoot = context.directory ?? context.worktree ?? process.cwd();
      const pngRel = await renderHtml({
        htmlPath: args.htmlPath,
        outputPath: args.outputPath,
        viewportWidth: args.viewportWidth,
        viewportHeight: args.viewportHeight,
        fullPage: args.fullPage ?? true,
        projectRoot,
      });
      return { output: `Rendered preview: ${args.htmlPath} -> ${pngRel} (${args.viewportWidth}x${args.viewportHeight})` };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
