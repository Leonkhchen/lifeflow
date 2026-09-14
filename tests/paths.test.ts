import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { sanitizeFilename, guardArtifactPath, resolveVersioned, resolveVersionedGroup } from "../src/lib/paths.js";

describe("sanitizeFilename", () => {
  it("lowercases and replaces unsafe chars", () => {
    expect(sanitizeFilename("My File@#")).toBe("my-file");
  });
  it("trims and handles empty", () => {
    expect(sanitizeFilename("   ")).toBe("artifact");
  });
  it("prevents traversal patterns", () => {
    const s = sanitizeFilename("../../outside");
    expect(s).not.toContain("/");
    expect(s).not.toContain("..");
  });
  it("limits length", () => {
    const long = "a".repeat(200);
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(80);
  });
});

describe("guardArtifactPath", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-visualize-"));
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("rejects absolute paths", () => {
    expect(() => guardArtifactPath(root, "/absolute/path.png")).toThrow(/Absolute/);
    expect(() => guardArtifactPath(root, "C:\\Windows\\foo.png")).toThrow();
  });
  it("rejects traversal", () => {
    expect(() => guardArtifactPath(root, "artifacts/../../outside.png")).toThrow(/traversal|escapes/i);
    expect(() => guardArtifactPath(root, "../outside.png")).toThrow();
    expect(() => guardArtifactPath(root, "artifacts/ui/../../outside.png")).toThrow();
  });
  it("rejects outside artifacts", () => {
    expect(() => guardArtifactPath(root, "outside/file.png")).toThrow(/artifacts/);
  });
  it("allows valid path", () => {
    expect(guardArtifactPath(root, "artifacts/ui/foo.html")).toBe("artifacts/ui/foo.html");
  });
});

describe("resolveVersioned", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-visualize-ver-"));
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("creates versioned siblings", () => {
    const dir = "artifacts/architecture";
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    const p1 = resolveVersioned(root, dir, "my-diagram", ".mmd");
    expect(p1).toBe("artifacts/architecture/my-diagram.mmd");
    fs.writeFileSync(path.join(root, p1), "x");
    const p2 = resolveVersioned(root, dir, "my-diagram", ".mmd");
    expect(p2).toBe("artifacts/architecture/my-diagram-v2.mmd");
    fs.writeFileSync(path.join(root, p2), "x");
    const p3 = resolveVersioned(root, dir, "my-diagram", ".mmd");
    expect(p3).toBe("artifacts/architecture/my-diagram-v3.mmd");
  });

  it("resolveVersionedGroup suffix consistent", () => {
    const dir = "artifacts/charts";
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    const [h1, p1] = resolveVersionedGroup(root, dir, "hosting-cost", [".html", ".png"]);
    expect(h1).toBe("artifacts/charts/hosting-cost.html");
    expect(p1).toBe("artifacts/charts/hosting-cost.png");
    fs.writeFileSync(path.join(root, h1), "x");
    fs.writeFileSync(path.join(root, p1), "x");
    const [h2, p2] = resolveVersionedGroup(root, dir, "hosting-cost", [".html", ".png"]);
    expect(h2).toBe("artifacts/charts/hosting-cost-v2.html");
    expect(p2).toBe("artifacts/charts/hosting-cost-v2.png");
  });
});
