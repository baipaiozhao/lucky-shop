import { request } from './client';
import type { ApiSuccess, Product } from '@types';

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  keyword?: string;
  sort?: 'price_asc' | 'price_desc' | 'sales' | 'newest';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort: number;
}

export async function getProducts(params: ProductListParams = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const res = await request<ApiSuccess<Product[]>>({ method: 'GET', url: '/products', params });
  return {
    products: res.data || [],
    total: Number(res.meta?.total || 0),
    page: Number(res.meta?.page || 1),
    pageSize: Number(res.meta?.pageSize || 12),
    totalPages: Number(res.meta?.totalPages || 1),
  };
}

export async function getProductById(id: string): Promise<Product> {
  const res = await request<ApiSuccess<Product>>({ method: 'GET', url: `/products/${id}` });
  return res.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await request<ApiSuccess<Category[]>>({ method: 'GET', url: '/products/categories' });
  return res.data;
}

export async function searchSuggestions(keyword: string): Promise<string[]> {
  const res = await request<ApiSuccess<string[]>>({
    method: 'GET',
    url: '/products/search/suggestions',
    params: { keyword },
  });
  return res.data;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const res = await request<ApiSuccess<Product[]>>({ method: 'GET', url: '/products/featured' });
  return res.data;
}

export async function getNewProducts(): Promise<Product[]> {
  const res = await request<ApiSuccess<Product[]>>({ method: 'GET', url: '/products/new' });
  return res.data;
}

export async function getHotProducts(): Promise<Product[]> {
  const res = await request<ApiSuccess<Product[]>>({ method: 'GET', url: '/products/hot' });
  return res.data;
}

export async function getFavorites(): Promise<Product[]> {
  const res = await request<ApiSuccess<Product[]>>({ method: 'GET', url: '/favorites' });
  return res.data;
}

export async function addFavorite(productId: string): Promise<void> {
  await request<ApiSuccess<null>>({ method: 'POST', url: '/favorites', data: { productId } });
}

export async function removeFavorite(productId: string): Promise<void> {
  await request<ApiSuccess<null>>({ method: 'DELETE', url: `/favorites/${productId}` });
}

export async function checkFavorite(productId: string): Promise<boolean> {
  const res = await request<ApiSuccess<boolean>>({
    method: 'GET',
    url: `/favorites/check/${productId}`,
  });
  return res.data;
}
