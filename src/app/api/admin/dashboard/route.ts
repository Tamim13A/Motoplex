import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Product, Order, User, Review } from "@/models";
import { getStoredDashboardStats } from "@/lib/orderStore";
import { products as catalogProducts } from "@/data/products";

export async function GET() {
  // 1. Try MongoDB Aggregates if online
  try {
    await connectDB();

    const [
      totalRevenue,
      totalOrders,
      activeProducts,
      lowStockProducts,
      recentOrders,
      totalUsers,
      pendingReviews,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: { $in: ["paid", "unpaid"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0 } }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber customerInfo shippingAddress items total orderStatus paymentStatus createdAt")
        .lean(),
      User.countDocuments({ role: "user" }),
      Review.countDocuments({ status: "pending" }),
    ]);

    if (totalOrders > 0) {
      const revenue = totalRevenue[0]?.total || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayOrders = await Order.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      });

      const todayRevenueResult = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      const todayRevenue = todayRevenueResult[0]?.total || 0;

      const ordersByStatus = await Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalRevenue: revenue,
            totalOrders,
            activeProducts,
            lowStockProducts,
            totalUsers: totalUsers || 1,
            pendingReviews: pendingReviews || 0,
            todayOrders,
            todayRevenue,
          },
          recentOrders,
          ordersByStatus,
        },
      });
    }
  } catch {
    // Database offline, proceed to fallback calculation
  }

  // 2. Resilient Fallback Calculation using OrderStore & Catalog
  const storeStats = getStoredDashboardStats();
  const activeProducts = catalogProducts.filter((p) => p.stock > 0).length;
  const lowStockProducts = catalogProducts.filter((p) => p.stock <= 5).length;

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalRevenue: storeStats.totalRevenue,
        totalOrders: storeStats.totalOrders,
        activeProducts,
        lowStockProducts,
        totalUsers: 1,
        pendingReviews: 0,
        todayOrders: storeStats.pendingCount,
        todayRevenue: 0,
      },
      recentOrders: storeStats.recentOrders,
      ordersByStatus: [
        { _id: "Pending", count: storeStats.pendingCount },
        { _id: "Processing", count: storeStats.processingCount },
        { _id: "Delivered", count: storeStats.deliveredCount },
        { _id: "Cancelled", count: storeStats.cancelledCount },
      ],
    },
  });
}
