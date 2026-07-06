import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { BaseService } from "./base.service";
import { calcCouponDiscount } from "../shared";
import type { Prisma } from "@prisma/client";

function genOrderNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const hms = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `LS${ymd}${hms}${rand}`;
}


export class OrderService extends BaseService {
  /**
   * Preview order before creation.
   */
  async preview(
    userId: string,
    items: { productId: string }[],
    usePoints: number,
  ) {
    if (!items.length) this.badRequest("购物车为空", "A4002");

    const cartItems = await orderRepository.findCartByUser(userId);
    const selectedItems = cartItems.filter((i) =>
      items.some((s) => s.productId === i.productId),
    );
    if (!selectedItems.length) this.badRequest("购物车为空", "A4002");

    const orderItems = selectedItems.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      price: Number(item.product.price),
      quantity: item.quantity,
      subtotal: Number(item.product.price) * item.quantity,
    }));

    const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const shippingFee = totalAmount >= 9900 ? 0 : 1000;

    // Coupon matching
    const userCoupons = await orderRepository.findUserCoupons(userId);
    let bestCoupon: { id: string; name: string; discount: number } | null = null;
    let couponDiscount = 0;

    for (const uc of userCoupons) {
      const disc = calcCouponDiscount(totalAmount, {
        type: uc.coupon.type,
        amount: Number(uc.coupon.amount),
        minSpend: Number(uc.coupon.minSpend),
        maxDiscount: Number(uc.coupon.maxDiscount || 999999),
      });
      if (disc > couponDiscount) {
        couponDiscount = disc;
        bestCoupon = { id: uc.id, name: uc.coupon.name, discount: disc };
      }
    }

    // Points
    const user = await userRepository.findById(userId);
    const userPoints = user?.points || 0;
    const afterCoupon = totalAmount + shippingFee - couponDiscount;
    const maxPoints = Math.min(userPoints, Math.floor(afterCoupon * 0.3));
    const pointsUsed = Math.min(usePoints, maxPoints);

    const finalAmount = afterCoupon - pointsUsed;

    return {
      items: orderItems,
      totalAmount,
      couponDiscount,
      pointsUsed,
      pointsValue: pointsUsed,
      shippingFee,
      finalAmount,
      appliedCoupons: bestCoupon ? [bestCoupon] : [],
      availableCoupons: userCoupons.map((uc) => ({
        id: uc.id,
        name: uc.coupon.name,
        amount: Number(uc.coupon.amount),
        minSpend: Number(uc.coupon.minSpend),
        status: uc.status,
      })),
    };
  }

  /**
   * Create order — full transactional flow.
   */
  async create(
    userId: string,
    params: {
      addressId: string;
      paymentMethod: string;
      couponIds: string[];
      usePoints: number;
    },
  ) {
    const { addressId, paymentMethod, couponIds, usePoints } = params;

    // Validations
    const cartItems = await orderRepository.findCartByUser(userId, true);
    if (!cartItems.length) this.badRequest("购物车为空", "A4002");

    const address = await orderRepository.findAddress(addressId);
    if (!address || address.userId !== userId) {
      this.badRequest("收货地址无效", "A2001");
    }

    for (const item of cartItems) {
      if (!item.product.isActive) {
        this.badRequest(`商品【${item.product.name}】已下架`, "A4010");
      }
      if (item.quantity > item.product.stock) {
        // eslint-disable-next-line no-console
        this.badRequest(`商品【${item.product.name}】库存不足`, "A4001");
      }
    }

    // Calculate totals
    const totalAmount = cartItems.reduce(
      (s, i) => s + Number(i.product.price) * i.quantity,
      0,
    );
    const shippingFee = totalAmount >= 9900 ? 0 : 1000;

    // Coupon matching
    let couponDiscount = 0;
    const appliedCouponIds: string[] = [];

    if (couponIds.length) {
      const userCoupons = await orderRepository.findUserCoupons(userId);
      for (const ucId of couponIds) {
        const uc = userCoupons.find((c) => c.id === ucId);
        if (uc) {
          const disc = calcCouponDiscount(totalAmount, {
            type: uc.coupon.type,
            amount: Number(uc.coupon.amount),
            minSpend: Number(uc.coupon.minSpend),
            maxDiscount: Number(uc.coupon.maxDiscount || 999999),
          });
          if (disc > 0) {
            couponDiscount += disc;
            appliedCouponIds.push(ucId);
          }
        }
      }
    }

    // Points
    const user = await userRepository.findById(userId);
    const userPoints = user!.points;
    const maxPoints = Math.min(userPoints, Math.floor(totalAmount * 0.3));
    const pointsUsed = Math.min(usePoints, maxPoints);
    const pointsValue = pointsUsed;

    const finalAmount = totalAmount + shippingFee - couponDiscount - pointsValue;

    // Transaction
    const order = await orderRepository.transaction(async (tx) => {
      // Deduct stock (optimistic locking)
      for (const item of cartItems) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity }, sales: { increment: item.quantity } },
        });
        if (result.count === 0) {
          this.badRequest(`商品【${item.product.name}】库存不足`, "A4001");
        }
      }

      // Apply coupons
      if (appliedCouponIds.length) {
        await tx.userCoupon.updateMany({
          where: { id: { in: appliedCouponIds } },
          data: { status: "used", usedAt: new Date() },
        });
      }

      // Deduct points
      if (pointsUsed > 0) {
        await tx.pointsTransaction.create({
          data: {
            userId,
            amount: -pointsUsed,
            type: "consumed",
            source: "order",
            remark: "订单抵扣",
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: pointsUsed } },
        });
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNo: genOrderNo(),
          userId,
          totalAmount,
          discount: couponDiscount + pointsValue,
          finalAmount,
          status: "paid" as const,
          paymentMethod,
          addressId,
          couponIds: appliedCouponIds.length ? JSON.stringify(appliedCouponIds) : null,
          pointsUsed,
          pointsValue,
          gameChances: 1,
          paidAt: new Date(),
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productImage: (Array.isArray(item.product.images) ? item.product.images[0] : (typeof item.product.images === 'string' ? JSON.parse(item.product.images)[0] : "")) || "",
              price: item.product.price,
              quantity: item.quantity,
              subtotal: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: { address: true, items: true },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId, productId: { in: cartItems.map((i) => i.productId) } },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * List user orders with pagination.
   */
  async list(userId: string, page: number, pageSize: number, status?: string) {
    const [orders, total] = await orderRepository.findOrdersByUser(
      userId,
      page,
      pageSize,
      status,
    );
    return {
      data: orders,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Get single order detail.
   */
  async getById(orderId: string, userId: string) {
    const order = await orderRepository.findOrderById(orderId, userId);
    if (!order) this.notFound("订单不存在");
    return order;
  }

  /**
   * Cancel order (only pending).
   */
  async cancel(orderId: string, userId: string, reason?: string) {
    const order = await orderRepository.findOrderById(orderId, userId);
    if (!order) this.notFound("订单不存在");
    if (order.status !== "pending") {
      this.badRequest("仅待支付订单可取消", "A4009");
    }

    return orderRepository.updateOrder(orderId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || null,
    });
  }

  /**
   * Confirm delivery (only shipped).
   */
  async confirm(orderId: string, userId: string) {
    const order = await orderRepository.findOrderById(orderId, userId);
    if (!order) this.notFound("订单不存在");
    if (order.status !== "shipped") {
      this.badRequest("仅已发货订单可确认", "A4009");
    }

    return orderRepository.updateOrder(orderId, {
      status: "completed",
      completedAt: new Date(),
    });
  }
}

export const orderService = new OrderService();

