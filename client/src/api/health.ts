import { request } from './client';
import type { ApiSuccess } from '@types';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  env: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await request<ApiSuccess<HealthResponse>>({ method: 'GET', url: '/health' });
  return res.data;
}
