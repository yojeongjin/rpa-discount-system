import nodemailer from 'nodemailer'
import { log } from './logger';
import { Order } from '../interface/order';
import dotenv from 'dotenv';
dotenv.config();

/**
 * 장애 알림 메일 전송 함수
 * @param order 대상 주문
 * @param errorMsg 에러 메시지
 */
export async function sendEmailAlert(order: Order, errorMsg: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 465),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.ALERT_RECEIVER,
    subject: `[RPA 에러] ${order.parkName} (${order.carNum}) 할인 실패`,
    html: `
      <h3>할인 처리 중 에러 발생</h3>
      <ul>
        <li><b>주차장:</b> ${order.parkName}</li>
        <li><b>차량번호:</b> ${order.carNum}</li>
        <li><b>API URL:</b> ${order.apiURL}</li>
        <li><b>상품명:</b> ${order.prodName}</li>
        <li><b>에러 메시지:</b> <pre>${errorMsg}</pre></li>
      </ul>
      <p>확인 후 조치 바랍니다.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    log.info(`[ALERT] 에러 메일 전송됨: ${order.parkName} (${order.carNum})`);
  } catch (err:any) {
    log.error(`[ALERT ERROR] 메일 전송 실패: ${err.message}`);
  }
}
