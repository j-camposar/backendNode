# Monitoreo de Node.js con Prometheus y Grafana

Este proyecto enseña a levantar un stack básico de monitoreo usando **Docker**, **Prometheus** y **Grafana**, para exponer y visualizar métricas de una aplicación Node.js.

---

## 1️⃣ Prerrequisitos

Antes de comenzar, asegúrate de tener:

- Docker y Docker Compose instalados
- Node.js instalado (si deseas modificar la app de métricas)
- Un editor de texto para visualizar archivos (`VS Code` recomendado)

---

## 2️⃣ Estructura del proyecto
```
project/
├─ app/ # Código de la aplicación Node.js que expone métricas
├─ prometheus.yml # Configuración de Prometheus
└─ docker-compose.yml # Stack completo (Node + Prometheus + Grafana)
```
---

## 3️⃣ Configuración de Docker Compose

Archivo `docker-compose.yml`:

```yaml
version: "3.8"

services:
  node-app:
    image: jocamposar/metricas
    container_name: node-app
    ports:
      - "3001:3001"
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus
    networks:
      - monitoring

networks:
  monitoring:
```

> **Nota**: Montamos prometheus.yml como volumen para que Prometheus lea la configuración personalizada.

---

## 4️⃣ Configuración de Prometheus

Archivo `prometheus.yml`:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["prometheus:9090"]

  - job_name: "node-app"
    static_configs:
      - targets: ["node-app:3001"]
```
> scrape_interval define cada cuánto Prometheus consulta los targets.

> Cada job_name representa un servicio que se monitorea.

---

## 5️⃣ Aplicación Node.js

La aplicación Node.js expone métricas que Prometheus puede recolectar.

- Endpoint principal: `http://localhost:3001/metrics`
- Métricas expuestas:
  - `http_requests_total` → Conteo total de requests HTTP.
  - `http_request_duration_seconds` → Latencia de requests HTTP.
  - `process_cpu_seconds_total` → Tiempo total de CPU consumido por el proceso Node.
  - `process_resident_memory_bytes` → Memoria RAM usada por el proceso Node.

> Estas métricas se generan usando el paquete [`prom-client`](https://github.com/siimon/prom-client).

---

## 6️⃣ Levantar el stack

1. Abrir una terminal en la carpeta del proyecto.
2. Ejecutar:

```bash
docker-compose up -d
```
3. Verificar que los contenedores estén corriendo:
```bash
docker ps
```
Deberías ver los contenedores:

- `node-app` → puerto 3001
- `prometheus` → puerto 9090
- `grafana` → puerto 3000

---

## 7️⃣ Verificar métricas en Prometheus

1. Abrir Prometheus en: [http://localhost:9090](http://localhost:9090)
2. Ir a **Status → Targets**.
3. Asegurarse que `node-app:3001` aparezca como **UP**.
4. Probar queries como:

```promql
up{job="node-app"}
rate(http_requests_total[1m])
process_resident_memory_bytes{job="node-app"}
```

---

## 8️⃣ Dashboard en Grafana

1. Abrir Grafana en: [http://localhost:3000](http://localhost:3000)  
   - Usuario: `admin`  
   - Contraseña: `admin`  
2. Configurar el datasource:  
   - Tipo: **Prometheus**  
   - URL: `http://prometheus:9090`  
   - Nombre: opcional, por ejemplo `Prometheus`
   - Uid: obtener el id desde la url 
3. Crear un nuevo dashboard o **Importar JSON** con la configuración del dashboard.

```json
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0,211,255,1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": 0,
  "links": [],
  "panels": [
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "hidden",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "points",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "max": 1,
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 1,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.2.1",
      "targets": [
        {
          "expr": "up{job=\"node-app\"}",
          "legendFormat": "{{instance}}",
          "refId": "A"
        }
      ],
      "title": "Node App Availability",
      "type": "timeseries"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "hidden",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "points",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "req/s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 12,
        "x": 0,
        "y": 6
      },
      "id": 2,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.2.1",
      "targets": [
        {
          "expr": "rate(http_requests_total[1m])",
          "legendFormat": "{{method}} {{route}}",
          "refId": "B"
        }
      ],
      "title": "HTTP Requests per Second",
      "type": "timeseries"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "hidden",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "points",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 12,
        "x": 0,
        "y": 13
      },
      "id": 3,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.2.1",
      "targets": [
        {
          "expr": "rate(http_request_duration_seconds_sum[5m])/rate(http_request_duration_seconds_count[5m])",
          "legendFormat": "{{route}}",
          "refId": "C"
        }
      ],
      "title": "HTTP Request Latency (avg)",
      "type": "timeseries"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "hidden",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "points",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 12,
        "x": 0,
        "y": 19
      },
      "id": 4,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.2.1",
      "targets": [
        {
          "expr": "rate(process_cpu_seconds_total[1m])",
          "legendFormat": "{{instance}}",
          "refId": "D"
        }
      ],
      "title": "Node CPU Usage",
      "type": "timeseries"
    },
    {
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "hidden",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "points",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "bytes"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 4,
        "w": 12,
        "x": 0,
        "y": 24
      },
      "id": 5,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.2.1",
      "targets": [
        {
          "expr": "process_resident_memory_bytes{job=\"node-app\"}",
          "legendFormat": "{{instance}}",
          "refId": "E"
        }
      ],
      "title": "Node Memory Usage",
      "type": "timeseries"
    }
  ],
  "preload": false,
  "refresh": "",
  "schemaVersion": 42,
  "tags": [
    "node",
    "metrics",
    "prometheus"
  ],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-5m",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "browser",
  "title": "Node.js Metrics",
  "uid": "af2164t9kl79cb",
  "version": 2
}
```

4. Panels incluidos:
   - **Node App Availability** → muestra si la app está UP
   - **HTTP Requests per Second** → tasa de requests por segundo
   - **HTTP Request Latency (avg)** → latencia promedio de requests
   - **Node CPU Usage** → CPU usada por Node
   - **Node Memory Usage** → memoria RAM consumida por Node

5. Guardar el dashboard para poder visualizar métricas en tiempo real.

---

## 9️⃣ PromQL importantes

| Métrica | Query | Descripción |
|---------|-------|-------------|
| Disponibilidad | `up{job="node-app"}` | 1 si la app está viva, 0 si no |
| Requests/sec | `rate(http_requests_total[1m])` | Requests promedio por segundo |
| Latencia | `rate(http_request_duration_seconds_sum[5m])/rate(http_request_duration_seconds_count[5m])` | Latencia promedio de requests |
| CPU | `rate(process_cpu_seconds_total[1m])` | CPU usada en segundos por segundo |
| Memoria | `process_resident_memory_bytes{job="node-app"}` | Memoria RAM consumida por Node |

---

## 10️⃣ Recomendaciones

- Usar **volúmenes** para persistir configuración y datos de Prometheus y Grafana.  
- Verifica que `/metrics` de Node.js esté funcionando antes de levantar Prometheus.  
- Ajusta `scrape_interval` en Prometheus según la frecuencia que quieras recolectar métricas.  
- Para producción, considera usar **paneles Gauge y Stat Panels** para CPU, memoria y disponibilidad.

---

## 11️⃣ Limpieza

Para detener y eliminar los contenedores:

```bash
docker-compose down
```