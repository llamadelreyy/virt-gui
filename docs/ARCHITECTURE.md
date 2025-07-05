# System Architecture

This document describes the technical architecture of the Infrastructure Monitoring Dashboard, including system design, data flow, and component interactions.

## Overview

The Infrastructure Monitoring Dashboard is a full-stack web application designed to provide real-time monitoring of a multi-server infrastructure. The system follows a microservices architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                          │
│                    (React Frontend)                            │
│                   192.168.50.73:3000                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                    API Gateway                                 │
│                  (FastAPI Backend)                             │
│                   192.168.50.73:8000                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP Queries
┌─────────────────────▼───────────────────────────────────────────┐
│                 Metrics Database                               │
│                   (Prometheus)                                 │
│                   192.168.50.73:9090                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Scraping
┌─────────────────────▼───────────────────────────────────────────┐
│                Target Servers                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ AI Server   │ │ App Server  │ │Storage Server│              │
│  │ :9100,:9400 │ │    :9100    │ │    :9100    │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Frontend Layer (React Application)

**Technology Stack:**
- React 18 with JavaScript (as requested)
- Vite for build tooling and development server
- TailwindCSS for styling
- Shadcn UI components
- Recharts for data visualization
- WebSocket client for real-time updates

**Key Components:**
- [`App.jsx`](../frontend/src/App.jsx) - Main dashboard component
- [`ServerCard.jsx`](../frontend/src/components/dashboard/ServerCard.jsx) - Individual server display
- [`MetricsChart.jsx`](../frontend/src/components/charts/MetricsChart.jsx) - Real-time charts
- [`useWebSocket.js`](../frontend/src/hooks/useWebSocket.js) - WebSocket state management

**Responsibilities:**
- User interface rendering
- Real-time data visualization
- WebSocket connection management
- API communication
- State management

### 2. Backend Layer (FastAPI Application)

**Technology Stack:**
- FastAPI with Python 3.11
- Pydantic for data validation
- AsyncIO for concurrent operations
- WebSocket support for real-time updates
- Prometheus client for metrics querying

**Architecture Pattern:**
```
backend/app/
├── main.py              # Application entry point
├── config.py            # Configuration management
├── models/              # Data models
│   └── server_metrics.py
├── services/            # Business logic
│   ├── prometheus_client.py
│   ├── metrics_collector.py
│   └── websocket_manager.py
└── routers/             # API endpoints
    ├── ai_server.py
    ├── app_server.py
    ├── storage_server.py
    └── websocket.py
```

**Key Services:**
- [`PrometheusClient`](../backend/app/services/prometheus_client.py) - Metrics querying
- [`MetricsCollector`](../backend/app/services/metrics_collector.py) - Data aggregation
- [`WebSocketManager`](../backend/app/services/websocket_manager.py) - Real-time communication

**Responsibilities:**
- API endpoint management
- Prometheus query execution
- Data transformation and aggregation
- WebSocket connection handling
- Business logic implementation

### 3. Metrics Layer (Prometheus)

**Technology Stack:**
- Prometheus 2.45
- Node Exporter for system metrics
- NVIDIA GPU Exporter for GPU metrics
- Custom scraping configuration

**Configuration:**
- Scrape interval: 15 seconds
- Retention: 7 days
- Targets: All infrastructure servers

**Responsibilities:**
- Metrics collection and storage
- Time-series data management
- Query processing
- Data retention

### 4. Monitoring Targets

**Server Infrastructure:**
- **AI Server** (192.168.50.118) - GPU workloads, ML processing
- **App Server** (192.168.50.164) - Proxmox host, VMs
- **Storage Server** (192.168.50.223) - File storage, Qdrant database

**Exporters:**
- Node Exporter (port 9100) - System metrics
- GPU Exporter (port 9400) - NVIDIA GPU metrics

## Data Flow Architecture

### 1. Metrics Collection Flow

```
Target Servers → Node Exporters → Prometheus → Backend API → Frontend
     ↓               ↓              ↓           ↓           ↓
System Metrics → HTTP Endpoints → Time Series → JSON API → UI Charts
```

**Detailed Flow:**
1. **Collection**: Node Exporters gather system metrics (CPU, memory, disk, network)
2. **Scraping**: Prometheus scrapes exporters every 15 seconds
3. **Storage**: Metrics stored as time-series data in Prometheus
4. **Querying**: Backend queries Prometheus using PromQL
5. **Transformation**: Backend transforms data to application models
6. **Delivery**: Frontend receives data via REST API or WebSocket
7. **Visualization**: React components render charts and displays

### 2. Real-time Update Flow

```
Prometheus → Backend Collector → WebSocket Manager → Frontend
     ↓             ↓                    ↓              ↓
New Metrics → Periodic Collection → Broadcast → Live Updates
```

**WebSocket Communication:**
1. Frontend establishes WebSocket connection
2. Backend collector runs periodic metric collection (5-second intervals)
3. New metrics broadcast to all connected clients
4. Frontend updates charts and displays in real-time

### 3. API Request Flow

```
Frontend → API Router → Service Layer → Prometheus → Response
    ↓          ↓           ↓             ↓           ↓
HTTP Req → Route Match → Business Logic → Query → JSON Response
```

## Component Interactions

### 1. Frontend ↔ Backend Communication

**REST API:**
- HTTP requests for initial data loading
- Structured JSON responses
- Error handling and status codes

**WebSocket:**
- Persistent connection for real-time updates
- Event-based message system
- Automatic reconnection handling

### 2. Backend ↔ Prometheus Communication

**Query Interface:**
- HTTP API calls to Prometheus
- PromQL query language
- JSON response parsing

**Connection Management:**
- Connection pooling
- Retry logic for failed queries
- Timeout handling

### 3. Prometheus ↔ Exporters Communication

**Scraping Protocol:**
- HTTP GET requests to `/metrics` endpoints
- Prometheus exposition format
- Service discovery and health checks

## Security Architecture

### 1. Network Security

**Firewall Configuration:**
```
Port 3000: Frontend (HTTP)
Port 8000: Backend API (HTTP/WebSocket)
Port 9090: Prometheus (HTTP) - Internal only
Port 9100: Node Exporter (HTTP) - Prometheus only
Port 9400: GPU Exporter (HTTP) - Prometheus only
```

**Access Control:**
- Frontend accessible from user networks
- Backend API accessible from frontend
- Prometheus internal access only
- Exporters accessible from Prometheus only

### 2. Application Security

**CORS Configuration:**
```python
# Configured for specific origins
origins = [
    "http://192.168.50.73:3000",
    "http://localhost:3000"
]
```

**Input Validation:**
- Pydantic models for request validation
- Type checking and data sanitization
- Error handling for malformed requests

### 3. Data Security

**Metrics Data:**
- No sensitive data in metrics
- System performance data only
- No authentication credentials stored

## Scalability Design

### 1. Horizontal Scaling

**Frontend:**
- Stateless React application
- Can be deployed behind load balancer
- CDN-friendly static assets

**Backend:**
- Stateless FastAPI application
- Multiple instances with load balancing
- Shared Prometheus data source

### 2. Vertical Scaling

**Resource Requirements:**
```
Component     | CPU    | Memory | Storage
Frontend      | 0.1    | 256MB  | 100MB
Backend       | 0.5    | 512MB  | 100MB
Prometheus    | 1.0    | 1GB    | 10GB
```

### 3. Performance Optimization

**Caching Strategy:**
- Prometheus query result caching
- Frontend component memoization
- WebSocket connection pooling

**Query Optimization:**
- Efficient PromQL queries
- Appropriate time ranges
- Metric aggregation

## Monitoring and Observability

### 1. Health Checks

**Application Health:**
- [`/api/health`](../backend/app/main.py) endpoint
- Service dependency checks
- Response time monitoring

**Infrastructure Health:**
- Prometheus target monitoring
- Exporter availability checks
- Network connectivity tests

### 2. Logging

**Backend Logging:**
```python
# Structured logging with levels
logging.info("Metrics collected successfully")
logging.error("Prometheus connection failed")
logging.debug("Query execution time: 150ms")
```

**Frontend Logging:**
```javascript
// Console logging for debugging
console.log("WebSocket connected");
console.error("API request failed");
```

### 3. Metrics

**Application Metrics:**
- API response times
- WebSocket connection count
- Error rates and types

**System Metrics:**
- CPU, memory, disk usage
- Network throughput
- GPU utilization

## Deployment Architecture

### 1. Container Strategy

**Docker Compose Services:**
```yaml
services:
  frontend:    # React app with Nginx
  backend:     # FastAPI with Uvicorn
  prometheus:  # Metrics database
  grafana:     # Optional visualization
```

**Container Benefits:**
- Consistent deployment environment
- Easy scaling and updates
- Isolated service dependencies

### 2. Network Configuration

**Internal Network:**
```
virt-gui_default:
  - frontend:3000
  - backend:8000
  - prometheus:9090
  - grafana:3001
```

**External Access:**
- Frontend: 192.168.50.73:3000
- Backend: 192.168.50.73:8000
- Prometheus: 192.168.50.73:9090 (optional)

### 3. Data Persistence

**Volumes:**
```yaml
prometheus_data:  # Time-series metrics
grafana_data:     # Dashboard configurations
```

## Technology Decisions

### 1. Frontend Technology Choice

**React with JavaScript:**
- User specifically requested JavaScript over TypeScript
- React provides excellent ecosystem for dashboards
- Vite offers fast development and build times
- TailwindCSS enables rapid UI development

### 2. Backend Technology Choice

**FastAPI:**
- High performance async framework
- Automatic API documentation
- Excellent WebSocket support
- Strong typing with Pydantic

### 3. Monitoring Technology Choice

**Prometheus:**
- Industry standard for metrics
- Excellent query language (PromQL)
- Reliable time-series storage
- Rich ecosystem of exporters

### 4. Visualization Technology Choice

**Recharts:**
- React-native charting library
- Good performance for real-time updates
- Customizable and responsive
- Active development and community

## Future Considerations

### 1. Scalability Enhancements

**Potential Improvements:**
- Redis for caching and session management
- Message queue for async processing
- Database for configuration storage
- Load balancer for high availability

### 2. Feature Extensions

**Possible Additions:**
- Alert management system
- Historical data analysis
- Custom dashboard creation
- Mobile application support

### 3. Security Enhancements

**Security Improvements:**
- Authentication and authorization
- API rate limiting
- HTTPS/TLS encryption
- Audit logging

This architecture provides a solid foundation for infrastructure monitoring while maintaining flexibility for future enhancements and scaling requirements.