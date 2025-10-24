const express = require('express');
const client = require('prom-client');

const app = express();
const register = new client.Registry();

// Métrica personalizada
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Número total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

// Registrar métricas
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.setDefaultLabels({ app: 'node-metrics-demo' });
client.collectDefaultMetrics({ register });

// Middleware para medir peticiones
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    end({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Hola desde Node.js con métricas Prometheus' });
});

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3001, () => console.log('🚀 Node.js app corriendo en puerto 3001'));
