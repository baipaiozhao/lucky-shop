import { request } from './client';
import type { ApiSuccess } from '@types';

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
export interface CartSummary {
  itemCount: number;
  totalPrice: number;
}

export async function getCart(): Promise<{ items: CartItem[]; summary: CartSummary }> {
  const res = await request<ApiSuccess<CartItem[]>>({ method: 'GET', url: '/cart' });
  const meta = res.meta as Partial<CartSummary> | undefined;

  return {
    items: res.data || [],
    summary: {
      itemCount: Number(meta?.itemCount || 0),
      totalPrice: Number(meta?.totalPrice || 0),
    },
  };
}

export async function addToCart(productId: string, quantity = 1): Promise<CartItem> {
  const res = await request<ApiSuccess<CartItem>>({
    method: 'POST',
    url: '/cart',
    data: { productId, quantity },
  });
  return res.data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartItem> {
  const res = await request<ApiSuccess<CartItem>>({
    method: 'PATCH',
    url: `/cart/${itemId}`,
    data: { quantity },
  });
  return res.data;
}

export async function toggleCartItem(itemId: string, selected: boolean): Promise<CartItem> {
  const res = await request<ApiSuccess<CartItem>>({
    method: 'PATCH',
    url: `/cart/${itemId}`,
    data: { selected },
  });
  return res.data;
}

export async function removeCartItem(itemId: string): Promise<void> {
  await request<ApiSuccess<null>>({ method: 'DELETE', url: `/cart/${itemId}` });
}

export async function clearCart(): Promise<void> {
  await request<ApiSuccess<null>>({ method: 'DELETE', url: '/cart' });
}
