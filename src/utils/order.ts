import { OrderRecord } from "@/types";

export const isTableOrder = (order: Pick<OrderRecord, "orderFromTable" | "orderSource" | "tableId">) => {
  if (order.orderFromTable === true) {
    return true;
  }

  if (order.orderFromTable === false) {
    return false;
  }

  return order.orderSource === "web" || Boolean(order.tableId);
};

export const getOrderChannelLabel = (order: Pick<OrderRecord, "orderFromTable" | "orderSource" | "tableId">) =>
  isTableOrder(order) ? "Scan Meja" : "Kasir Langsung";
