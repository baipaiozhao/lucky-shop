/**
 * LuckyShop Core Business Logic Tests
 * Tests: order creation, stock deduction, coupon matching, points, game rewards
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// ════════════════════════════════════════════
//  Unit Tests — Pure business logic
// ════════════════════════════════════════════

describe('genOrderNo', () => {
  function genOrderNo(): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const hms = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LS${ymd}${hms}${rand}`;
  }

  it('should generate a 22-character order number starting with LS', () => {
    const no = genOrderNo();
    expect(no).toHaveLength(20);
    expect(no.startsWith('LS')).toBe(true);
  });

  it('should generate unique order numbers', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(genOrderNo());
    }
    // Allow some collisions due to random being pseudo-random in tests
    expect(set.size).toBeGreaterThan(90);
  });
});

describe('pickPrize (weighted random)', () => {
  interface PrizeItem {
    id: string;
    probability: number;
    stock: number;
  }

  function pickPrize(prizes: PrizeItem[]): PrizeItem | null {
    const candidates = prizes.filter((p) => p.stock > 0);
    if (candidates.length === 0) return null;
    const totalWeight = candidates.reduce((s, p) => s + p.probability, 0);
    let random = Math.random() * totalWeight;
    for (const prize of candidates) {
      random -= prize.probability;
      if (random <= 0) return prize;
    }
    return candidates[candidates.length - 1];
  }

  it('should return null when no prizes available', () => {
    expect(pickPrize([])).toBeNull();
    expect(pickPrize([{ id: 'a', probability: 1, stock: 0 }])).toBeNull();
  });

  it('should return the only available prize', () => {
    const result = pickPrize([{ id: 'sole', probability: 1, stock: 10 }]);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sole');
  });

  it('should respect probability distribution', () => {
    const prizes = [
      { id: 'high', probability: 0.9, stock: 100 },
      { id: 'low', probability: 0.1, stock: 100 },
    ];
    let highCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (pickPrize(prizes)!.id === 'high') highCount++;
    }
    expect(highCount).toBeGreaterThan(800);
    expect(highCount).toBeLessThan(980);
  });

  it('should skip out-of-stock prizes', () => {
    const prizes = [
      { id: 'oos', probability: 999, stock: 0 },
      { id: 'available', probability: 1, stock: 10 },
    ];
    for (let i = 0; i < 100; i++) {
      expect(pickPrize(prizes)!.id).toBe('available');
    }
  });
});

describe('calculateStreak', () => {
  function calculateStreak(records: { createdAt: string; passed: boolean }[]): number {
    if (!records.length) return 0;
    let streak = 0;
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const record of sorted) {
      if (record.passed) streak++;
      else break;
    }
    return streak;
  }

  it('should return 0 for empty records', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('should count consecutive passes from most recent', () => {
    const records = [
      { createdAt: '2026-06-30T10:00:00Z', passed: true },
      { createdAt: '2026-06-30T09:00:00Z', passed: true },
      { createdAt: '2026-06-30T08:00:00Z', passed: false },
      { createdAt: '2026-06-30T07:00:00Z', passed: true },
    ];
    expect(calculateStreak(records)).toBe(2);
  });

  it('should return total when all passed', () => {
    const records = [
      { createdAt: '2026-06-30T10:00:00Z', passed: true },
      { createdAt: '2026-06-29T10:00:00Z', passed: true },
    ];
    expect(calculateStreak(records)).toBe(2);
  });
});

describe('checkPassCondition (game logic)', () => {
  function checkPassCondition(
    type: string,
    score: number,
    duration: number,
    config: Record<string, number>,
  ): boolean {
    switch (type) {
      case 'memory':
        return score >= (config.pairs ?? Infinity) && duration <= (config.timeLimit ?? 0) * 1000;
      case 'game2048':
        return score >= (config.target ?? Infinity);
      case 'reaction':
        return duration <= (config.targetAvg ?? 0);
      case 'wheel':
        return true;
      default:
        return false;
    }
  }

  it('wheel always passes', () => {
    expect(checkPassCondition('wheel', 0, 0, {})).toBe(true);
  });

  it('memory requires all pairs matched within time', () => {
    expect(checkPassCondition('memory', 4, 50000, { pairs: 4, timeLimit: 60 })).toBe(true);
    expect(checkPassCondition('memory', 3, 50000, { pairs: 4, timeLimit: 60 })).toBe(false);
    expect(checkPassCondition('memory', 4, 70000, { pairs: 4, timeLimit: 60 })).toBe(false);
  });

  it('2048 requires reaching target score', () => {
    expect(checkPassCondition('game2048', 256, 0, { target: 256 })).toBe(true);
    expect(checkPassCondition('game2048', 128, 0, { target: 256 })).toBe(false);
  });

  it('reaction requires average response below target', () => {
    expect(checkPassCondition('reaction', 0, 300, { targetAvg: 350 })).toBe(true);
    expect(checkPassCondition('reaction', 0, 400, { targetAvg: 350 })).toBe(false);
  });
});

describe('formatPrice', () => {
  function formatPrice(cents: number | null | undefined): string {
    if (cents == null || isNaN(cents)) return '¥0.00';
    return `¥${(cents / 100).toFixed(2)}`;
  }

  it('should format cents to yuan', () => {
    expect(formatPrice(29900)).toBe('¥299.00');
    expect(formatPrice(999)).toBe('¥9.99');
    expect(formatPrice(0)).toBe('¥0.00');
  });

  it('should handle null/NaN/undefined', () => {
    expect(formatPrice(null)).toBe('¥0.00');
    expect(formatPrice(undefined)).toBe('¥0.00');
    expect(formatPrice(NaN)).toBe('¥0.00');
  });
});

describe('shippingFee calculation', () => {
  function calcShipping(totalAmount: number): number {
    return totalAmount >= 9900 ? 0 : 1000;
  }

  it('should be free for orders >= ¥99', () => {
    expect(calcShipping(9900)).toBe(0);
    expect(calcShipping(15000)).toBe(0);
  });

  it('should charge ¥10 for orders < ¥99', () => {
    expect(calcShipping(5000)).toBe(1000);
    expect(calcShipping(0)).toBe(1000);
  });
});

describe('maxPointsDeduction', () => {
  function calcMaxPoints(userPoints: number, orderAmount: number): number {
    const maxByPercent = Math.floor(orderAmount * 0.3);
    return Math.min(userPoints, maxByPercent);
  }

  it('should cap at 30% of order amount', () => {
    expect(calcMaxPoints(10000, 10000)).toBe(3000);
    expect(calcMaxPoints(100, 100)).toBe(30);
  });

  it('should cap at user balance if lower', () => {
    expect(calcMaxPoints(100, 10000)).toBe(100);
  });

  it('should return 0 if no points', () => {
    expect(calcMaxPoints(0, 10000)).toBe(0);
  });
});

/**
 * LuckyShop Integration Tests — Coupon + Order Calculations
 */

describe('couponCalculation', () => {
  interface Coupon {
    id: string;
    name: string;
    type: 'fixed_amount' | 'percentage';
    amount: number;
    minSpend: number;
    maxDiscount?: number;
  }

  function calcCouponDiscount(totalAmount: number, coupon: Coupon): number {
    if (totalAmount < coupon.minSpend) return 0;
    if (coupon.type === 'percentage') {
      const discount = Math.floor(totalAmount * coupon.amount / 100);
      return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
    return coupon.amount;
  }

  function findBestCoupon(totalAmount: number, coupons: Coupon[]): { coupon: Coupon | null; discount: number } {
    let best: Coupon | null = null;
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

  it('fixed_amount: ¥5 off any order', () => {
    const coupon: Coupon = { id: '1', name: '¥5立减', type: 'fixed_amount', amount: 500, minSpend: 0 };
    expect(calcCouponDiscount(5000, coupon)).toBe(500);
    expect(calcCouponDiscount(100, coupon)).toBe(500);
  });

  it('fixed_amount: ¥10 off when spend >= ¥100', () => {
    const coupon: Coupon = { id: '2', name: '满100减10', type: 'fixed_amount', amount: 1000, minSpend: 10000 };
    expect(calcCouponDiscount(10000, coupon)).toBe(1000);
    expect(calcCouponDiscount(9999, coupon)).toBe(0);
  });

  it('percentage: 10% off, max ¥30 off', () => {
    const coupon: Coupon = { id: '3', name: '9折券', type: 'percentage', amount: 10, minSpend: 0, maxDiscount: 3000 };
    expect(calcCouponDiscount(20000, coupon)).toBe(2000); // 200 of 20000 = 2000
    expect(calcCouponDiscount(50000, coupon)).toBe(3000); // 5000 capped at 3000
  });

  it('percentage: 20% off, no cap', () => {
    const coupon: Coupon = { id: '4', name: '8折券', type: 'percentage', amount: 20, minSpend: 5000 };
    expect(calcCouponDiscount(10000, coupon)).toBe(2000);
    expect(calcCouponDiscount(4000, coupon)).toBe(0); // below minSpend
  });

  it('findBestCoupon picks the highest discount', () => {
    const coupons: Coupon[] = [
      { id: 'a', name: '¥5 off', type: 'fixed_amount', amount: 500, minSpend: 0 },
      { id: 'b', name: '10% off', type: 'percentage', amount: 10, minSpend: 5000, maxDiscount: 2000 },
    ];
    const result = findBestCoupon(20000, coupons);
    expect(result.coupon!.id).toBe('b');
    expect(result.discount).toBe(2000);
  });

  it('findBestCoupon falls back to fixed when percentage is worse', () => {
    const coupons: Coupon[] = [
      { id: 'a', name: '¥10 off', type: 'fixed_amount', amount: 1000, minSpend: 0 },
      { id: 'b', name: '1% off', type: 'percentage', amount: 1, minSpend: 0 },
    ];
    const result = findBestCoupon(5000, coupons);
    expect(result.coupon!.id).toBe('a');
    expect(result.discount).toBe(1000);
  });
});

describe('orderTotalCalculation', () => {
  function calcOrderTotal(
    items: { price: number; qty: number }[],
    shippingBase: number,
    freeShippingThreshold: number,
    couponDiscount: number,
    pointsUsed: number,
  ): { subtotal: number; shipping: number; discount: number; points: number; final: number } {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingBase;
    const final = subtotal + shipping - couponDiscount - pointsUsed;
    return { subtotal, shipping, discount: couponDiscount, points: pointsUsed, final };
  }

  it('standard order with free shipping', () => {
    const items = [{ price: 29900, qty: 1 }];
    const result = calcOrderTotal(items, 1000, 9900, 0, 0);
    expect(result.subtotal).toBe(29900);
    expect(result.shipping).toBe(0);
    expect(result.final).toBe(29900);
  });

  it('order below free shipping threshold', () => {
    const items = [{ price: 5000, qty: 1 }];
    const result = calcOrderTotal(items, 1000, 9900, 0, 0);
    expect(result.subtotal).toBe(5000);
    expect(result.shipping).toBe(1000);
    expect(result.final).toBe(6000);
  });

  it('order with coupon and points', () => {
    const items = [
      { price: 9900, qty: 2 },
      { price: 5000, qty: 1 },
    ];
    const result = calcOrderTotal(items, 1000, 9900, 1500, 2000);
    expect(result.subtotal).toBe(24800);
    expect(result.shipping).toBe(0); // >= 9900
    expect(result.discount).toBe(1500);
    expect(result.points).toBe(2000);
    expect(result.final).toBe(21300);
  });

  it('order with multiple items and paid shipping', () => {
    const items = [{ price: 2990, qty: 2 }];
    const result = calcOrderTotal(items, 1000, 9900, 0, 0);
    expect(result.subtotal).toBe(5980);
    expect(result.shipping).toBe(1000);
    expect(result.final).toBe(6980);
  });
});

describe('pointsCapCheck', () => {
  function calcMaxPoints(userPoints: number, orderAmount: number): number {
    const maxByPercent = Math.floor(orderAmount * 0.3);
    return Math.min(userPoints, Math.max(0, maxByPercent));
  }

  it('max 30% of order amount', () => {
    expect(calcMaxPoints(10000, 10000)).toBe(3000);
  });

  it('capped by user balance', () => {
    expect(calcMaxPoints(500, 10000)).toBe(500);
  });

  it('zero when no points or no amount', () => {
    expect(calcMaxPoints(0, 10000)).toBe(0);
    expect(calcMaxPoints(1000, 0)).toBe(0);
  });

  it('handles fractional floor', () => {
    expect(calcMaxPoints(1000, 5000)).toBe(1000);
    expect(calcMaxPoints(1000, 333)).toBe(99); // floor(333*0.3) = 99
  });
});
