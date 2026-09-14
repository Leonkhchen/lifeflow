import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { guardArtifactPath, resolveVersionedGroup } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";
import { buildChartHtml } from "../../src/lib/chart-template.js";
import { renderHtml } from "../../scripts/render-html.js";

export default tool({
  description: "Generate ECharts chart HTML and PNG screenshot",
  args: {
    chartType: tool.schema.enum(["bar", "line", "pie"]).describe("chart type"),
    title: tool.schema.string().min(1).describe("non-empty title"),
    data: tool.schema.array(tool.schema.record(tool.schema.string(), tool.schema.any())).min(1).describe("dataset"),
    outputName: tool.schema.string().min(1).describe("safe filename stem"),
    xKey: tool.schema.string().optional().describe("x label key, default name"),
    yKey: tool.schema.string().optional().describe("y value key, default value"),
  },
  async execute(args, context) {
    try {
      if (!args.title.trim()) throw new Error("title must be non-empty");
      if (!Array.isArray(args.data) || args.data.length === 0) throw new Error("data must be a non-empty array");

      const projectRoot = context.directory ?? context.worktree ?? process.cwd();
      const dirRel = "artifacts/charts";
      guardArtifactPath(projectRoot, path.posix.join(dirRel, "_check"));

      const [htmlRel, pngRel] = resolveVersionedGroup(projectRoot, dirRel, args.outputName, [".html", ".png"]);
      const htmlAbs = path.resolve(projectRoot, htmlRel);
      fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });

      const htmlContent = buildChartHtml({
        chartType: args.chartType,
        title: args.title,
        data: args.data as Array<Record<string, unknown>>,
        xKey: args.xKey,
        yKey: args.yKey,
        projectRoot,
      });

      fs.writeFileSync(htmlAbs, htmlContent, "utf8");

      await renderHtml({
        htmlPath: htmlRel,
        outputPath: pngRel,
        viewportWidth: 1280,
        viewportHeight: 720,
        fullPage: true,
        projectRoot,
      });

      return { output: `Chart generated: "${args.title}" type=${args.chartType}\n- ${htmlRel}\n- ${pngRel}` };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
