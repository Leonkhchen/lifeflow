import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

test.describe("LifeFlow visual", () => {
  test("desktop and mobile no horizontal overflow, screenshots valid", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("response", (res) => {
      if (res.status() >= 400 && res.request().resourceType() === "document") {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(800);

    const hasUnintendedOverflow = async () =>
      (await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const allow = new Set([".board-wrap", ".board-wrap *"]);
        let offenders = 0;
        for (const el of document.querySelectorAll<HTMLElement>("*")) {
          if (el.closest(".board-wrap")) continue;
          if (el.offsetWidth > docW + 5 && el.scrollWidth > docW + 5) offenders++;
        }
        return document.documentElement.scrollWidth > docW + 20 && offenders > 0;
      })) === true;
    expect(await hasUnintendedOverflow(), "unexpected horizontal overflow on desktop (excluding .board-wrap)").toBe(false);

    // Desktop screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
    const desktopPath = path.resolve(process.cwd(), "artifacts/ui/lifeflow-desktop.png");
    fs.mkdirSync(path.dirname(desktopPath), { recursive: true });
    await page.screenshot({ path: desktopPath, fullPage: true });
    expect(fs.existsSync(desktopPath)).toBe(true);
    const desktopBuf = fs.readFileSync(desktopPath);
    expect(desktopBuf[0]).toBe(0x89);
    expect(desktopBuf[1]).toBe(0x50);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    expect(await hasUnintendedOverflow(), "unexpected horizontal overflow on mobile (excluding .board-wrap)").toBe(false);

    const mobilePath = path.resolve(process.cwd(), "artifacts/ui/lifeflow-mobile.png");
    await page.screenshot({ path: mobilePath, fullPage: true });
    expect(fs.existsSync(mobilePath)).toBe(true);
    const mobileBuf = fs.readFileSync(mobilePath);
    expect(mobileBuf[0]).toBe(0x89);

    // Visible primary elements
    await expect(page.locator("text=LifeFlow").first()).toBeVisible();
    await expect(page.locator("text=看板").first()).toBeVisible();

    // Console errors should be minimal (allow no severe errors)
    expect(consoleErrors.filter((e) => !e.includes("404") && !e.includes("Failed to load"))).toEqual([]);

    // No failed document requests
    expect(failedRequests).toEqual([]);
  });

  test("tablet screenshot also valid", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(600);
    const tabletPath = path.resolve(process.cwd(), "artifacts/ui/lifeflow-tablet.png");
    fs.mkdirSync(path.dirname(tabletPath), { recursive: true });
    await page.screenshot({ path: tabletPath, fullPage: true });
    expect(fs.existsSync(tabletPath)).toBe(true);
  });
});
