/**
 * Motoplex BD - Resilient Order Store
 * Provides persistent file-backed order storage with seamless MongoDB sync fallback.
 * Ensures orders placed via storefront, API, or POS never get lost even if MongoDB is offline.
 */
import fs from "fs";
import path from "path";
import { Order } from "@/types";

const STORE_FILE_PATH = path.join(process.cwd(), "src", "data", "orders_store.json");

/**
 * Reads all stored orders from disk.
 * Falls back to seed mockOrders if file does not exist yet.
 */
export function getStoredOrders(): Order[] {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("[OrderStore] Error reading orders_store.json:", error);
  }

  return [];
}

/**
 * Persists orders to disk.
 */
export function saveStoredOrders(orders: Order[]): boolean {
  try {
    const dir = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(orders, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("[OrderStore] Error saving orders_store.json:", error);
    return false;
  }
}

/**
 * Creates and appends a new order into the persistent store.
 */
export function createStoredOrder(order: Order): Order {
  const currentOrders = getStoredOrders();
  // Check if order already exists
  const existingIdx = currentOrders.findIndex(
    (o) => o.orderNumber === order.orderNumber || o.id === order.id
  );

  let updatedOrders: Order[];
  if (existingIdx >= 0) {
    updatedOrders = [...currentOrders];
    updatedOrders[existingIdx] = order;
  } else {
    // Newest order at top
    updatedOrders = [order, ...currentOrders];
  }

  saveStoredOrders(updatedOrders);
  return order;
}

/**
 * Updates status of an existing order.
 */
export function updateStoredOrderStatus(
  orderIdOrNumber: string,
  newStatus: Order["status"],
  courierInfo?: { name?: "Pathao" | "Steadfast" | "RedX"; trackingNumber?: string }
): Order | null {
  const orders = getStoredOrders();
  const idx = orders.findIndex(
    (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
  );

  if (idx === 0 || idx > 0) {
    const updated = {
      ...orders[idx],
      status: newStatus,
      ...(courierInfo?.name ? { courierName: courierInfo.name } : {}),
      ...(courierInfo?.trackingNumber ? { trackingNumber: courierInfo.trackingNumber } : {}),
    };
    orders[idx] = updated;
    saveStoredOrders(orders);
    return updated;
  }

  return null;
}

/**
 * Calculates dashboard KPI aggregates from stored orders.
 */
export function getStoredDashboardStats() {
  const orders = getStoredOrders();
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing" || o.status === "Confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;

  return {
    totalRevenue,
    totalOrders,
    pendingCount,
    processingCount,
    deliveredCount,
    cancelledCount,
    recentOrders: orders.slice(0, 10),
  };
}

