import type { Request, Response, NextFunction } from 'express';
import { getRequestContext } from './requestId';
import { logger } from '../utils/logger';

// ── In-memory metrics (Prometheus text format compatible) ──

interface MetricBucket {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p99: number;
  values: number[];
}

const httpMetrics = {
  requestsTotal: 0,
  requestsByMethod: new Map<string, number>(),
  requestsByStatus: new Map<string, number>(),
  requestsByPath: new Map<string, number>(),
  latencyBuckets: new Map<string, MetricBucket>(),
  activeConnections: 0,
  errorsTotal: 0,
  startTime: Date.now(),
};

function getOrCreateBucket(key: string): MetricBucket {
  let bucket = httpMetrics.latencyBuckets.get(key);
  if (!bucket) {
    bucket = { count: 0, sum: 0, min: Infinity, max: -Infinity, p50: 0, p90: 0, p99: 0, values: [] };
    httpMetrics.latencyBuckets.set(key, bucket);
  }
  return bucket;
}

function updatePercentiles(bucket: MetricBucket): void {
  const sorted = [...bucket.values].sort((a, b) => a - b);
  const len = sorted.length;
  if (len === 0) return;
  bucket.p50 = sorted[Math.floor(len * 0.5)];
  bucket.p90 = sorted[Math.floor(len * 0.9)];
  bucket.p99 = sorted[Math.floor(len * 0.99)];
}

// ── Middleware: record metrics ──
export function metricsRecorderMiddleware(req: Request, res: Response, next: NextFunction): void {
  httpMetrics.requestsTotal++;
  httpMetrics.activeConnections++;

  const method = req.method;
  const path = req.route?.path || req.path;
  httpMetrics.requestsByMethod.set(method, (httpMetrics.requestsByMethod.get(method) || 0) + 1);
  httpMetrics.requestsByPath.set(path, (httpMetrics.requestsByPath.get(path) || 0) + 1);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = String(res.statusCode);
    const codeFamily = status[0] + 'xx';

    httpMetrics.activeConnections--;
    httpMetrics.requestsByStatus.set(codeFamily, (httpMetrics.requestsByStatus.get(codeFamily) || 0) + 1);

    if (res.statusCode >= 400) {
      httpMetrics.errorsTotal++;
    }

    // Record latency
    const key = `${method} ${path}`;
    const bucket = getOrCreateBucket(key);
    bucket.count++;
    bucket.sum += duration;
    bucket.min = Math.min(bucket.min, duration);
    bucket.max = Math.max(bucket.max, duration);
    // Keep max 1000 samples for percentile calculation
    if (bucket.values.length < 1000) {
      bucket.values.push(duration);
    }
    updatePercentiles(bucket);
  });

  next();
}

// ── GET /metrics endpoint (Prometheus text format) ──
export function metricsEndpoint(_req: Request, res: Response): void {
  const lines: string[] = [];

  const uptime = Math.floor((Date.now() - httpMetrics.startTime) / 1000);

  lines.push('# HELP lucky_shop_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE lucky_shop_uptime_seconds gauge');
  lines.push(`lucky_shop_uptime_seconds ${uptime}`);

  lines.push('# HELP lucky_shop_http_requests_total Total HTTP requests');
  lines.push('# TYPE lucky_shop_http_requests_total counter');
  lines.push(`lucky_shop_http_requests_total ${httpMetrics.requestsTotal}`);

  lines.push('# HELP lucky_shop_http_errors_total Total HTTP errors (4xx/5xx)');
  lines.push('# TYPE lucky_shop_http_errors_total counter');
  lines.push(`lucky_shop_http_errors_total ${httpMetrics.errorsTotal}`);

  lines.push('# HELP lucky_shop_http_active_connections Current active connections');
  lines.push('# TYPE lucky_shop_http_active_connections gauge');
  lines.push(`lucky_shop_http_active_connections ${httpMetrics.activeConnections}`);

  for (const [method, count] of httpMetrics.requestsByMethod) {
    lines.push(`# HELP lucky_shop_http_requests_by_method Total requests by HTTP method`);
    lines.push('# TYPE lucky_shop_http_requests_by_method counter');
    lines.push(`lucky_shop_http_requests_by_method{method="${method}"} ${count}`);
  }

  for (const [status, count] of httpMetrics.requestsByStatus) {
    lines.push('# HELP lucky_shop_http_requests_by_status Total requests by status family');
    lines.push('# TYPE lucky_shop_http_requests_by_status counter');
    lines.push(`lucky_shop_http_requests_by_status{status="${status}"} ${count}`);
  }

  // Latency percentiles per endpoint
  for (const [key, bucket] of httpMetrics.latencyBuckets) {
    const [method, path] = key.split(' ');
    lines.push('# HELP lucky_shop_http_request_duration_ms Request duration in ms');
    lines.push('# TYPE lucky_shop_http_request_duration_ms summary');
    lines.push(`lucky_shop_http_request_duration_ms{quantile="0.5",method="${method}",path="${path}"} ${bucket.p50}`);
    lines.push(`lucky_shop_http_request_duration_ms{quantile="0.9",method="${method}",path="${path}"} ${bucket.p90}`);
    lines.push(`lucky_shop_http_request_duration_ms{quantile="0.99",method="${method}",path="${path}"} ${bucket.p99}`);
    lines.push(`lucky_shop_http_request_duration_ms_sum{method="${method}",path="${path}"} ${bucket.sum}`);
    lines.push(`lucky_shop_http_request_duration_ms_count{method="${method}",path="${path}"} ${bucket.count}`);
  }

  lines.push('# EOF');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(lines.join('\n') + '\n');
}
