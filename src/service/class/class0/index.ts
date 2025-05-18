import { Order } from "../../../interface/order";
// type
import { type0 } from "./type/type0";

export async function class0(order: Order): Promise<boolean> {
  switch (order.type) {
    case 0:
      return await type0(order);
    case 1:
      return await type1(order);
    ...
    default:
      throw new Error(`지원하지 않는 type: class0 - ${order.type}`);
  }
}
