/**
 * 할인 대상 주문 정보
 * or
 * DB 조회 결과
 */
export interface Order {
  orderID: number;
  customerName: string;
  customerPhone: string;
  carNum: string;
  reservationFrom: string;
  prodName: string;
  totalAmount: number;
  parkID: number;
  parkName: string;
  apiURL: string;
  apiUsername: string;
  apiPassword: string;
  status: string;
  companyType: string;

  // siteMap 기반으로 매핑된 필드들
  class?: number;
  type?: number;
  opName?: string;
  opPark?: string;
  opOK?: boolean;
}
