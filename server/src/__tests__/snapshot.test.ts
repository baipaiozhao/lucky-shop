import { describe, it, expect } from "@jest/globals";
import { calcCouponDiscount, findBestCoupon } from "../shared";

describe("Coupon utilities — snapshot regression", () => {
  it("calcCouponDiscount snapshots", () => {
    const results = [
      calcCouponDiscount(5000, { type: "fixed_amount", amount: 500, minSpend: 0 }),
      calcCouponDiscount(5000, { type: "fixed_amount", amount: 1000, minSpend: 10000 }),
      calcCouponDiscount(20000, { type: "percentage", amount: 10, minSpend: 0 }),
      calcCouponDiscount(50000, { type: "percentage", amount: 10, minSpend: 0, maxDiscount: 3000 }),
      calcCouponDiscount(3000, { type: "percentage", amount: 20, minSpend: 5000 }),
    ];
    expect(results).toMatchSnapshot();
  });

  it("findBestCoupon snapshots", () => {
    const coupons = [
      { id: "a", name: "5元", type: "fixed_amount", amount: 500, minSpend: 0 },
      { id: "b", name: "10%", type: "percentage", amount: 10, minSpend: 5000, maxDiscount: 2000 },
      { id: "c", name: "20%", type: "percentage", amount: 20, minSpend: 20000 },
    ];
    const best = findBestCoupon(30000, coupons);
    expect(best).toMatchSnapshot();
  });

  it("API error code format snapshot", () => {
    const { ErrorCodes } = require("../shared");
    // Verify error code format consistency (A + 4 digits)
    const codes = Object.values(ErrorCodes) as string[];
    codes.forEach(code => {
      expect(code).toMatch(/^A\d{4}$/);
    });
  });
});
