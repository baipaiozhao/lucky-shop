import { describe, it, expect } from 'vitest';

// 奖品加权随机抽取算法测试
describe('prizePicker', () => {
  function pickPrize(
    prizes: Array<{ id: string; probability: number; stock: number }>,
  ): (typeof prizes)[number] | null {
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

  it('should return a prize when available', () => {
    const prizes = [{ id: 'a', probability: 1, stock: 10 }];
    const result = pickPrize(prizes);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('a');
  });

  it('should respect probability weights', () => {
    const prizes = [
      { id: 'a', probability: 0.9, stock: 100 },
      { id: 'b', probability: 0.1, stock: 100 },
    ];
    let aCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (pickPrize(prizes)!.id === 'a') aCount++;
    }
    expect(aCount).toBeGreaterThan(800);
    expect(aCount).toBeLessThan(980);
  });

  it('should skip out-of-stock prizes', () => {
    const prizes = [
      { id: 'a', probability: 0.5, stock: 0 },
      { id: 'b', probability: 0.5, stock: 10 },
    ];
    for (let i = 0; i < 100; i++) {
      expect(pickPrize(prizes)!.id).toBe('b');
    }
  });
});

// 2048 移动合并算法测试
describe('game2048', () => {
  type Board = number[][];

  function moveLeft(board: Board): { board: Board; score: number } {
    let score = 0;
    const result = board.map((row) => {
      const filtered = row.filter((v) => v !== 0);
      const merged: number[] = [];
      for (let i = 0; i < filtered.length; i++) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          score += filtered[i] * 2;
          i++;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      return merged.slice(0, 4);
    });
    return { board: result, score };
  }

  it('should merge adjacent equal tiles', () => {
    const board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result, score } = moveLeft(board);
    expect(result[0]).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
  });

  it('should not merge non-adjacent equal tiles', () => {
    const board = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = moveLeft(board);
    expect(result[0]).toEqual([4, 0, 0, 0]);
  });

  it('should slide all tiles to the left', () => {
    const board = [
      [0, 0, 2, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = moveLeft(board);
    expect(result[0]).toEqual([2, 4, 0, 0]);
  });

  it('should handle complex merge', () => {
    const board = [
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result, score } = moveLeft(board);
    expect(result[0]).toEqual([4, 8, 0, 0]);
    expect(score).toBe(12);
  });

  it('should handle triple merge (only first pair merges)', () => {
    const board = [
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = moveLeft(board);
    expect(result[0]).toEqual([4, 2, 0, 0]);
  });
});

// 价格格式化测试
describe('formatPrice', () => {
  function formatPrice(cents: number | null): string {
    if (cents == null || isNaN(cents)) return '¥0.00';
    return `¥${(cents / 100).toFixed(2)}`;
  }

  it('should format cents to yuan', () => {
    expect(formatPrice(29900)).toBe('¥299.00');
    expect(formatPrice(999)).toBe('¥9.99');
    expect(formatPrice(0)).toBe('¥0.00');
  });

  it('should handle null/NaN', () => {
    expect(formatPrice(null)).toBe('¥0.00');
    expect(formatPrice(NaN)).toBe('¥0.00');
  });
});
