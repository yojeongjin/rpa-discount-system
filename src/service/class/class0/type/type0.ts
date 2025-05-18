import { chromium } from 'playwright';
import { Order } from '../../../../interface/order';
import { waitStablePage } from '../../../../utils/waitStablePage';
import { log } from '../../../../utils/logger';

export async function type0(order: Order): Promise<boolean> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(order.apiURL, { waitUntil: 'networkidle' });

    // 로그인
    await page.fill('#login_id', order.apiUsername);
    await page.fill('#login_pw', order.apiPassword);
    await page.click('button:has-text("로그인")');
    
    // 로그인 후 로딩 지연 대비
    await waitStablePage(page);

    // 차량 검색
    await page.fill('#carNumber', order.carNum.slice(-4));
    await page.click('text=검색');
    await page.waitForTimeout(1000);

    // 입차 차량 확인
    const carElem = await page.$(`td:has-text("${order.carNum}")`);
    if (!carElem) {
      log.warn(`[SKIP] 입차 차량 없음: ${order.parkName} (${order.carNum})`);

      return false;
    }

    await carElem.click();
    await page.waitForTimeout(1000);

    // 기 할인 여부 확인
    const already = await page.$(`td:has-text("${order.carNum}")`);
    if (already) {
      log.warn(`[SKIP] 이미 할인됨: ${order.parkName} (${order.carNum})`);

      return false;
    }

    // 상품 분기 처리
    const nhours = parseInt(order.prodName.replace(/\D/g, '') || '24');

    await page.click('#chk_info5'); // 기본 클릭 예시
    await page.fill('#DCReason', `고객: ${order.customerName} (${order.customerPhone})`);
    await page.click('button#scbutton');
    await page.waitForTimeout(1000);

    log.info(`[SUCCESS] 할인 적용 완료: ${order.parkName} (${order.carNum})`);
    
    return true;
  } catch (err: any) {
    // 예상하지 못한 시스템 오류
    throw new Error(`[ERROR] ${order.parkName} (${order.carNum}): ${err.message}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
