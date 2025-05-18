// src/index.ts
import cron from 'node-cron'
import { log } from './utils/logger'
import { handleDiscountJob } from './scheduler/discountJob';

// 매 5분마다 실행
cron.schedule('*/5 * * * *', async () => {
  log.info(`[${new Date().toISOString()}] 웹 할인 자동화 배치 시작`);
  
  await handleDiscountJob();
});
