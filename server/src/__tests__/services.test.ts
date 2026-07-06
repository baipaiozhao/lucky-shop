import { describe, it, expect } from "@jest/globals";
import { calcCouponDiscount, findBestCoupon } from "../shared";

describe("calcCouponDiscount (shared)", () => {
  it("fixed_amount: flat discount", () => {
    expect(calcCouponDiscount(5000, { type: "fixed_amount", amount: 500, minSpend: 0 })).toBe(500);
  });
  it("fixed_amount: respects minSpend", () => {
    expect(calcCouponDiscount(5000, { type: "fixed_amount", amount: 1000, minSpend: 10000 })).toBe(0);
    expect(calcCouponDiscount(10000, { type: "fixed_amount", amount: 1000, minSpend: 10000 })).toBe(1000);
  });
  it("percentage: 10% off", () => {
    expect(calcCouponDiscount(20000, { type: "percentage", amount: 10, minSpend: 0 })).toBe(2000);
  });
  it("percentage: capped by maxDiscount", () => {
    expect(calcCouponDiscount(50000, { type: "percentage", amount: 10, minSpend: 0, maxDiscount: 3000 })).toBe(3000);
  });
  it("percentage: below minSpend returns 0", () => {
    expect(calcCouponDiscount(3000, { type: "percentage", amount: 20, minSpend: 5000 })).toBe(0);
  });
});

describe("findBestCoupon (shared)", () => {
  it("picks the highest discount", () => {
    const coupons = [
      { id: "a", name: "5yuan", type: "fixed_amount", amount: 500, minSpend: 0 },
      { id: "b", name: "10pct", type: "percentage", amount: 10, minSpend: 5000, maxDiscount: 2000 },
      { id: "c", name: "20pct", type: "percentage", amount: 20, minSpend: 20000 },
    ];
    const result = findBestCoupon(30000, coupons);
    expect(result.coupon!.id).toBe("c");
    expect(result.discount).toBe(6000);
  });

  it("returns null when all coupons have minSpend above total", () => {
    const coupons = [
      { id: "x", name: "over100", type: "fixed_amount", amount: 500, minSpend: 10000 },
      { id: "y", name: "over200", type: "percentage", amount: 10, minSpend: 20000 },
    ];
    const result = findBestCoupon(100, coupons);
    expect(result.coupon).toBeNull();
    expect(result.discount).toBe(0);
  });

  it("picks fixed when better than percentage", () => {
    const simple = [
      { id: "x", name: "10yuan", type: "fixed_amount", amount: 1000, minSpend: 0 },
      { id: "y", name: "1pct", type: "percentage", amount: 1, minSpend: 0 },
    ];
    const result = findBestCoupon(5000, simple);
    expect(result.coupon!.id).toBe("x");
  });
});
