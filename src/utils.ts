import path from "node:path";
import fs from "node:fs";

export function sanitizeOutputName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("outputName must be non-empty");
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..") || path.isAbsolute(trimmed)) {
    throw new Error(`Invalid outputName "${name}": must be a safe filename stem without path separators or traversal`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new Error(`Invalid outputName "${name}": allowed characters are a-z A-Z 0-9 . _ -`);
  }
  if (trimmed.startsWith(".") || trimmed.startsWith("-")) {
    throw new Error(`Invalid outputName "${name}": must not start with . or -`);
  }
  return trimmed;
}

export function assertArtifactPath(p: string, mustExistParent?: boolean) {
  if (!p) throw new Error("path must be non-empty");
  if (path.isAbsolute(p)) throw new Error(`Absolute paths not allowed: ${p}`);
  const normalized = path.posix.normalize(p.replace(/\\/g, "/"));
  if (normalized.startsWith("../") || normalized === ".." || normalized.includes("/../")) {
    throw new Error(`Path traversal rejected: ${p}`);
  }
  if (!normalized.startsWith("artifacts/")) {
    throw new Error(`Path must be under artifacts/: ${p}`);
  }
  return normalized;
}

export function resolveVersionedPath(basePath: string): string {
  const dir = path.dirname(basePath);
  const ext = path.extname(basePath);
  const stem = path.basename(basePath, ext);
  let candidate = basePath;
  if (!fs.existsSync(candidate)) return candidate;
  let v = 2;
  while (true) {
    candidate = path.join(dir, `${stem}-v${v}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    v++;
    if (v > 999) throw new Error("Too many versions");
  }
}

export function resolveVersionedGroup(baseStem: string, dir: string, exts: string[]): Map<string, string> {
  const safeStem = sanitizeOutputName(baseStem);
  const map = new Map<string, string>();
  let versionSuffix = "";
  let v = 1;
  while (true) {
    const candidateStem = v === 1 ? safeStem : `${safeStem}-v${v}`;
    const candidates = exts.map((e) => path.join(dir, `${candidateStem}${e}`));
    const anyExists = candidates.some((c) => fs.existsSync(c));
    if (!anyExists) {
      versionSuffix = candidateStem;
      break;
    }
    v++;
    if (v > 999) throw new Error("Too many versions");
  }
  for (const e of exts) {
    map.set(e, path.join(dir, `${versionSuffix}${e}`));
  }
  return map;
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export function isValidPng(buffer: Buffer): boolean {
  return buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}
