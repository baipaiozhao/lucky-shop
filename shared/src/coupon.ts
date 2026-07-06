/**
 * Coupon discount calculation — shared between server and client.
 * Coupon types: "fixed_amount" | "percentage"
 * amount for percentage = the percent value (e.g. 10 = 10%)
 */
export function calcCouponDiscount(
  totalAmount: number,
  coupon: { type: string; amount: number; minSpend: number; maxDiscount?: number },
): number {
  if (totalAmount < coupon.minSpend) return 0;
  if (coupon.type === "fixed_amount") return coupon.amount;
  // percentage
  const pctDisc = Math.floor(totalAmount * coupon.amount / 100);
  return coupon.maxDiscount ? Math.min(pctDisc, coupon.maxDiscount) : pctDisc;
}

/**
 * Pick the coupon that gives the highest discount for a given total.
 */
export function findBestCoupon(
  totalAmount: number,
  coupons: Array<{ id: string; name: string; type: string; amount: number; minSpend: number; maxDiscount?: number }>,
): { coupon: typeof coupons[number] | null; discount: number } {
  let best: typeof coupons[number] | null = null;
  let bestDiscount = 0;

  for (const c of coupons) {
    const d = calcCouponDiscount(totalAmount, c);
    if (d > bestDiscount) {
      bestDiscount = d;
      best = c;
    }
  }
  return { coupon: best, discount: bestDiscount };
}
