import * as fs from "node:fs";
import * as path from "node:path";

export function sanitizeFilename(name: string): string {
  let s = name.trim();
  s = s.replace(/\.+$/g, "");
  s = s.replace(/[^a-zA-Z0-9._-]/g, "-");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^[-_.]+|[-_.]+$/g, "");
  if (!s) s = "artifact";
  if (s.length > 80) s = s.slice(0, 80).replace(/-+$/g, "");
  return s.toLowerCase();
}

export function isAbsolutePath(p: string): boolean {
  return path.isAbsolute(p) || /^[a-zA-Z]:[\\/]/.test(p);
}

export function guardArtifactPath(projectRoot: string, relativePath: string): string {
  if (!relativePath || typeof relativePath !== "string") throw new Error("Path must be a non-empty string");
  if (isAbsolutePath(relativePath)) throw new Error(`Absolute paths are not allowed: ${relativePath}`);
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, "/"));
  if (normalized.startsWith("../") || normalized === ".." || normalized.includes("/../") || normalized.startsWith("/")) {
    throw new Error(`Path traversal rejected: ${relativePath}`);
  }
  if (!normalized.startsWith("artifacts/")) throw new Error(`Path must be under artifacts/: ${relativePath}`);
  const absolute = path.resolve(projectRoot, normalized);
  const rootResolved = path.resolve(projectRoot, "artifacts");
  if (!absolute.startsWith(rootResolved + path.sep) && absolute !== rootResolved) {
    throw new Error(`Path escapes artifacts directory: ${relativePath}`);
  }
  return normalized;
}

export function resolveVersioned(projectRoot: string, dirRelative: string, baseName: string, ext: string): string {
  const safeBase = sanitizeFilename(baseName);
  const dirAbs = path.resolve(projectRoot, dirRelative);
  fs.mkdirSync(dirAbs, { recursive: true });
  const first = path.posix.join(dirRelative, `${safeBase}${ext}`);
  const firstAbs = path.resolve(projectRoot, first);
  if (!fs.existsSync(firstAbs)) return first;
  let version = 2;
  while (true) {
    const candidate = path.posix.join(dirRelative, `${safeBase}-v${version}${ext}`);
    const abs = path.resolve(projectRoot, candidate);
    if (!fs.existsSync(abs)) return candidate;
    version++;
    if (version > 1000) throw new Error("Too many versions");
  }
}

export function resolveVersionedGroup(
  projectRoot: string,
  dirRelative: string,
  baseName: string,
  exts: string[]
): string[] {
  const safeBase = sanitizeFilename(baseName);
  const dirAbs = path.resolve(projectRoot, dirRelative);
  fs.mkdirSync(dirAbs, { recursive: true });
  let suffix = "";
  let version = 1;
  while (true) {
    const candidates = exts.map((ext) => path.posix.join(dirRelative, `${safeBase}${suffix}${ext}`));
    const exists = candidates.some((p) => fs.existsSync(path.resolve(projectRoot, p)));
    if (!exists) return candidates;
    version++;
    suffix = `-v${version}`;
    if (version > 1000) throw new Error("Too many versions");
  }
}

export function ensureArtifactDir(projectRoot: string, dirRelative: string): void {
  guardArtifactPath(projectRoot, path.posix.join(dirRelative, "_placeholder"));
  fs.mkdirSync(path.resolve(projectRoot, dirRelative), { recursive: true });
}
