import * as fs from "node:fs";
import * as path from "node:path";
import type { Page } from "@playwright/test";
import { viewports, type ViewportName } from "../viewports.js";

export async function captureScreenshot(
  page: Page,
  outputName: string,
  viewport: ViewportName,
  options?: { fullPage?: boolean }
): Promise<string> {
  const vp = viewports[viewport];
  await page.setViewportSize(vp);
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const rel = `artifacts/ui/${outputName}.png`;
  const abs = path.resolve(process.cwd(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  await page.screenshot({ path: abs, fullPage: options?.fullPage ?? true });
  return rel;
}

export function ensureArtifactDir(dir: string) {
  fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
}
