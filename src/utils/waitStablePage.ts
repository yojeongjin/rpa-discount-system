// src/utils/waitForStablePage.ts
import { Page } from 'playwright';

/**
 * 페이지가 완전히 로딩되고 안정화될 때까지 기다리는 유틸
 * - 기본적으로 networkidle 상태 + 추가 timeout 대기
 */
export async function waitStablePage(page: Page, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 5000;

  try {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForTimeout(800);
  } catch {
    // networkidle 상태가 되지 않더라도 추가 대기
    await page.waitForTimeout(3000);
  }
}
