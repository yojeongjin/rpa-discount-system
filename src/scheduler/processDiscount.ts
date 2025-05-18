import { Order } from "../interface/order";
// class
import { class0 } from "../service/class/class0";

export async function processDiscount(order: Order): Promise<boolean> {
  switch (order.class) {
    case 0:
      return await class0(order);
    case 1:
      return await class1(order);
    case 2:
      return await class2(order);
    ...
    default:
      throw new Error(`지원하지 않는 class: ${order.class}`);
  }
}
