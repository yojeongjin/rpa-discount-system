// config
import { siteMap } from '../config/siteMap';
import { query } from '../config/db';
// utils
import { log } from '../utils/logger';
import { sendEmailAlert } from '../utils/sendEmailAlert';
// interface
import { Order } from '../interface/order';

import { processDiscount } from './processDiscount';


export async function handleDiscountJob() {

  const orders: Order[] = await query(`
    SELECT 
      O.id as orderID,
      replace(I.car_no, '\n', '') as carNum,
      DATE_FORMAT(I.reservation_from, '%Y-%m-%d') as reservationFrom,
      PI.name as prodName,
      P.id as parkID,
      P.name as parkName,
      TRIM('/' FROM TRIM('#!' FROM P.ticket_web_discount_url)) as apiURL,
      P.fixed_member_id as apiUsername,
      P.fixed_password as apiPassword,
      O.status as status,
    FROM tbl_order O
      LEFT JOIN tbl_order_item I ON O.id = I.order_id
      LEFT JOIN tbl_order_parking_item OPI ON OPI.order_item_id = I.id
      LEFT JOIN tbl_parking_item PI ON OPI.parking_item_id = PI.id
      LEFT JOIN tbl_parking_lot P ON P.id = O.parking_lot_id
      LEFT JOIN tbl_customer C ON C.id = O.customer_id
    WHERE O.status IN ('PAID', 'REQUEST_DISCOUNT')
      AND I.type = 'FIXED'
      AND P.ticket_web_discount_url <> ''
      AND P.fixed_member_id <> ''
      AND P.fixed_password <> ''
      AND O.modified_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' ', MAKETIME(23,0,0))
      AND I.reservationFrom >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' ', MAKETIME(23,0,0))
    ORDER BY O.modified_at DESC
  `);

  const enriched = orders.map(order => {
    const matched = siteMap.find(site => order.apiURL.includes(site.url.replace(/^https?:\/\//, '')));
    if (matched) {
      return { ...order, ...matched };
    }
    return order;
  }).filter(order => order.class !== undefined);

  for (const order of enriched) {
    try {
      const success = await processDiscount(order);

      if (success) {
        await query(`
          UPDATE tbl_order SET 
            status = 'FINISHED',
            modified_by = 'SYSTEM'
          WHERE id = ?
        `, [order.orderID]);

        log.info(`[완료] ${order.parkName} (${order.carNum}) 할인 적용 완료`);
      } else {
        log.warn(`[실패] ${order.parkName} (${order.carNum}) 할인 적용 실패`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await sendEmailAlert(order, message);
      log.error(`[error] ${order.parkName} (${order.carNum}) 처리 중 오류: ${message}`)
    }
  }
} 
