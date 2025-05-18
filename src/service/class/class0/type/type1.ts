import { chromium } from 'playwright';
import { Order } from '../../../../interface/order';
import { waitStablePage } from '../../../../utils/waitStablePage';
import { log } from '../../../../utils/logger';

export async function type1(order: Order): Promise<boolean> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(order.apiURL, { waitUntil: 'networkidle' });

    // 로그인
    await page.fill('#id', order.apiUsername);
    await page.fill('#password', order.apiPassword);
    await page.keyboard.press('Enter');

    // 로그인 후 로딩 지연 대비
    await waitStablePage(page);

    // 주차할인 메뉴 클릭 및 차량 검색
    await page.click('a:has-text("주차할인")', { timeout: 800 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await page.fill('input#carNo', order.carNum);
    await page.click('#btnCarSearch');
    await page.waitForSelector('#searchDataTable tbody tr');

    const resultRow = await page.$(`#searchDataTable tbody tr:has-text("${order.carNum}")`);
    if (!resultRow) {
      log.warn(`[SKIP] 입차 기록 없음: ${order.parkName} (${order.carNum})`);

      return false;
    }

    const link = await resultRow.$('a');
    if (!link) {
      log.warn(`[SKIP] 상세 페이지 링크 없음: ${order.parkName} (${order.carNum})`);

      return false;
    }
    await link.click();
    await page.waitForLoadState('networkidle');

    // 할인 여부 확인
    const discountTable = await page.$('table.table-bordered tbody');
    const discountRows = await discountTable?.$$('tr');
    if (discountRows && discountRows.length > 0) {
      log.warn(`[SKIP] 이미 할인 처리됨: ${order.parkName} (${order.carNum})`);

      return false;
    }

    // 할인 버튼 매칭
    const dayWeek = order.prodName.includes('평일');
    const dayEnds = order.prodName.includes('주말') || order.prodName.includes('휴일');
    const dayNight = order.prodName.includes('야간');
    const dayMidnight = order.prodName.includes('심야');

    let discountButton = null;

    switch (order.parkID) {
      case 70412:
        if (dayWeek || dayEnds) discountButton = await page.$('button:has-text("당일권")');
        if (dayNight) discountButton = await page.$('button:has-text("심야권")');
        break;
      default:
          if (dayWeek) discountButton = await page.$('button:has-text("평일당일권")');
          if (dayEnds) discountButton = await page.$('button:has-text("휴일당일권")');
          if (dayNight)  discountButton = await page.$('button:has-text("야간권")');
          if (dayMidnight)  discountButton = await page.$('button:has-text("심야권")');
        break;
    }

    if (!discountButton) {
      log.warn(`[SKIP] 할인 버튼 없음: ${order.parkName} (${order.carNum})`);
      
      return false;
    }

    await discountButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    log.info(`[SUCCESS] 할인 완료: ${order.parkName} (${order.carNum})`);
    return true;
  } catch (err: any) {
    throw new Error(`[ERROR] ${order.parkName} (${order.carNum}): ${err.message}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
