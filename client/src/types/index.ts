
// ════════════════════════════════════════════
//  Re-exported from @lucky-shop/shared
// ════════════════════════════════════════════
export type { ApiSuccess, ApiError, ApiResponse, PaginationMeta, OrderStatus } from '../shared';
export { ErrorCodes } from '../shared';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  points: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  detail?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  category?: { name: string };
  stock: number;
  sales: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
  isActive?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  stock: number;
  isActive: boolean;
  quantity: number;
  selected: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  address?: Address;
  addressId: string;
  pointsUsed: number;
  pointsValue: number;
  gameChances: number;
  gameChancesUsed: number;
  trackingNo?: string;
  carrier?: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// ApiSuccess, ApiError, ApiResponse re-exported from @lucky-shop/shared
