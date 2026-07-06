import { request } from './client';
import type { ApiSuccess, Order } from '@types';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderPreview {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  totalAmount: number;
  couponDiscount: number;
  pointsUsed: number;
  pointsValue: number;
  shippingFee: number;
  finalAmount: number;
  appliedCoupons: Array<{ id: string; name: string; discount: number }>;
  availableCoupons: Array<{
    id: string;
    name: string;
    amount: number;
    minSpend: number;
    status: string;
  }>;
}

export interface CreateOrderParams {
  addressId: string;
  paymentMethod: string;
  couponIds?: string[];
  usePoints?: number;
}

export async function previewOrder(params: {
  items: Array<{ productId: string; quantity: number }>;
  couponIds?: string[];
  usePoints?: number;
}): Promise<OrderPreview> {
  const res = await request<ApiSuccess<OrderPreview>>({
    method: 'POST',
    url: '/orders/preview',
    data: params,
  });
  return res.data;
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const res = await request<ApiSuccess<Order>>({ method: 'POST', url: '/orders', data: params });
  return res.data;
}

export async function getOrders(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
  const res = await request<ApiSuccess<Order[]>>({ method: 'GET', url: '/orders', params });
  return {
    orders: res.data || [],
    total: Number(res.meta?.total || 0),
    page: Number(res.meta?.page || 1),
    totalPages: Number(res.meta?.totalPages || 1),
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const res = await request<ApiSuccess<Order>>({ method: 'GET', url: `/orders/${id}` });
  return res.data;
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const res = await request<ApiSuccess<Order>>({
    method: 'PUT',
    url: `/orders/${id}/cancel`,
    data: { reason },
  });
  return res.data;
}

export async function confirmOrder(id: string): Promise<Order> {
  const res = await request<ApiSuccess<Order>>({ method: 'POST', url: `/orders/${id}/confirm` });
  return res.data;
}
