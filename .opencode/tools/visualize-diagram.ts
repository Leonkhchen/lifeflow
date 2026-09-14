import { tool } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import { guardArtifactPath, resolveVersionedGroup } from "../../src/lib/paths.js";
import { formatError } from "../../src/lib/errors.js";
import { renderMermaid } from "../../scripts/render-mermaid.js";

export default tool({
  description: "Generate architecture/workflow/sequence/ER diagram via Mermaid to .mmd + .svg + .png",
  args: {
    type: tool.schema.enum(["architecture", "flowchart", "sequence", "er", "other"]).describe("diagram category"),
    title: tool.schema.string().min(1).describe("non-empty title"),
    content: tool.schema.string().min(1).describe("Mermaid source"),
    outputName: tool.schema.string().min(1).describe("safe filename stem without extension"),
  },
  async execute(args, context) {
    try {
      if (!args.title.trim()) throw new Error("title must be non-empty");
      if (!args.content.trim()) throw new Error("content must be non-empty");
      if (!args.outputName.trim()) throw new Error("outputName must be non-empty");

      const projectRoot = context.directory ?? context.worktree ?? process.cwd();
      const dirRel = "artifacts/architecture";

      guardArtifactPath(projectRoot, path.posix.join(dirRel, "_check"));

      const [mmdRel, svgRel, pngRel] = resolveVersionedGroup(projectRoot, dirRel, args.outputName, [".mmd", ".svg", ".png"]);

      const mmdAbs = path.resolve(projectRoot, mmdRel);
      fs.mkdirSync(path.dirname(mmdAbs), { recursive: true });

      const body = args.content.trim();
      const fileContent = body.includes("---") || body.startsWith("flowchart") || body.startsWith("graph") || body.startsWith("sequenceDiagram") || body.startsWith("erDiagram") || body.startsWith("architecture")
        ? body + "\n"
        : body + "\n";

      fs.writeFileSync(mmdAbs, fileContent, "utf8");

      try {
        await renderMermaid({ mmdPath: mmdRel, svgPath: svgRel, pngPath: pngRel, projectRoot });
      } catch (e) {
        throw new Error(`Mermaid render failed: ${formatError(e)}`);
      }

      return {
        output: `Diagram generated: title="${args.title}" type=${args.type}\n- ${mmdRel}\n- ${svgRel}\n- ${pngRel}`,
      };
    } catch (e) {
      throw new Error(formatError(e));
    }
  },
});
