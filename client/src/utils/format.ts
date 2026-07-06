/**
 * 通用格式化工具
 */
export function formatPrice(cents: number): string {
  if (cents == null || isNaN(cents)) return '¥0.00';
  return `¥${(cents / 100).toFixed(2)}`;
}

export function formatPriceShort(cents: number): string {
  if (cents == null || isNaN(cents)) return '¥0';
  return `¥${(cents / 100).toFixed(0)}`;
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// CSS-based placeholder ? no external dependency
// Product placeholder with category-aware colors and emoji
export function placeholderImage(text = "Product", categoryName?: string): string {
  const categories = [
    { key: "??", bg1: "#004E89", bg2: "#7B2FF7", emoji: "??" },
    { key: "??", bg1: "#EF476F", bg2: "#FF6B35", emoji: "??" },
    { key: "??", bg1: "#FF6B35", bg2: "#FF9F1C", emoji: "??" },
    { key: "??", bg1: "#06D6A0", bg2: "#48CAE4", emoji: "??" },
    { key: "??", bg1: "#8338EC", bg2: "#C084FC", emoji: "??" },
    { key: "??", bg1: "#1A73E8", bg2: "#4FC3F7", emoji: "??" },
  ];
  const found = categories.find((c) => c.key === categoryName);
  const cfg = found || { bg1: "#FF6B35", bg2: "#FF9F1C", emoji: "???" };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:' + cfg.bg1 + '"/><stop offset="100%" style="stop-color:' + cfg.bg2 + '"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="110" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">' + cfg.emoji + '</text><text x="200" y="160" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" font-weight="bold" opacity="0.95">' + text + '</text><text x="200" y="186" text-anchor="middle" fill="white" font-size="13" font-family="sans-serif" opacity="0.55">' + (categoryName || "我买我卖") + '</text></svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
