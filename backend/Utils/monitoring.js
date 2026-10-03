const promClient = require('prom-client');

promClient.collectDefaultMetrics({ prefix: 'expense_app_' });

const requestCounter = new promClient.Counter({
  name: 'expense_app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const requestDuration = new promClient.Histogram({
  name: 'expense_app_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000, 5000],
});

const errorCounter = new promClient.Counter({
  name: 'expense_app_http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status'],
});

const slowRequestCounter = new promClient.Counter({
  name: 'expense_app_slow_requests_total',
  help: 'Total number of slow requests over 500ms',
  labelNames: ['method', 'route'],
});

const memoryUsageGauge = new promClient.Gauge({
  name: 'expense_app_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

const cpuUsageGauge = new promClient.Gauge({
  name: 'expense_app_cpu_usage_microseconds',
  help: 'CPU usage in microseconds',
  labelNames: ['type'],
});

const dbConnectionStatusGauge = new promClient.Gauge({
  name: 'expense_app_mongodb_connection_status',
  help: 'MongoDB connection status (1=connected, 0=disconnected)',
});

function updateRuntimeMetrics() {
  const memory = process.memoryUsage();
  memoryUsageGauge.set({ type: 'rss' }, memory.rss);
  memoryUsageGauge.set({ type: 'heapTotal' }, memory.heapTotal);
  memoryUsageGauge.set({ type: 'heapUsed' }, memory.heapUsed);
  memoryUsageGauge.set({ type: 'external' }, memory.external);

  const cpu = process.cpuUsage();
  cpuUsageGauge.set({ type: 'user' }, cpu.user);
  cpuUsageGauge.set({ type: 'system' }, cpu.system);

  dbConnectionStatusGauge.set(mongooseConnectionStatus());
}

function mongooseConnectionStatus() {
  const ready = require('mongoose').connection.readyState;
  return ready === 1 ? 1 : 0;
}

function getRouteLabel(req) {
  return req.route && req.route.path ? req.route.path : req.originalUrl.split('?')[0] || 'unknown';
}

function observeRequest(req, res, durationMs) {
  const route = getRouteLabel(req);
  const status = String(res.statusCode);
  requestCounter.inc({ method: req.method, route, status });
  requestDuration.observe({ method: req.method, route, status }, durationMs);
  if (res.statusCode >= 500) {
    errorCounter.inc({ method: req.method, route, status });
  }
  if (durationMs >= 500) {
    slowRequestCounter.inc({ method: req.method, route });
  }
}

function startMetricsCollection(intervalMs = 15000) {
  updateRuntimeMetrics();
  return setInterval(updateRuntimeMetrics, intervalMs);
}

module.exports = {
  requestCounter,
  requestDuration,
  errorCounter,
  slowRequestCounter,
  memoryUsageGauge,
  cpuUsageGauge,
  dbConnectionStatusGauge,
  observeRequest,
  updateRuntimeMetrics,
  startMetricsCollection,
  register: promClient.register,
  getRouteLabel,
};
