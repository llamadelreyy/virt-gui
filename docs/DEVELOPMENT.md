# Development Guide

This guide provides information for developers who want to contribute to, modify, or extend the Infrastructure Monitoring Dashboard.

## Development Environment Setup

### Prerequisites

**Required Software:**
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Git

**Optional Tools:**
- VS Code with extensions:
  - Python
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Docker
  - Prometheus

### Local Development Setup

1. **Clone and Setup:**
```bash
git clone <repository-url>
cd virt-gui

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Setup frontend
cd ../frontend
npm install
cp .env.example .env

# Return to project root
cd ..
```

2. **Start Development Services:**
```bash
# Start Prometheus (required for backend)
docker-compose up -d prometheus

# Start backend in development mode
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start frontend
cd frontend
npm run dev
```

3. **Access Development Environment:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Prometheus: http://localhost:9090

## Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic data models
│   │   ├── __init__.py
│   │   └── server_metrics.py
│   ├── services/            # Business logic services
│   │   ├── __init__.py
│   │   ├── prometheus_client.py
│   │   ├── metrics_collector.py
│   │   └── websocket_manager.py
│   └── routers/             # API route handlers
│       ├── __init__.py
│       ├── ai_server.py
│       ├── app_server.py
│       ├── storage_server.py
│       └── websocket.py
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
└── .env.example            # Environment variables template
```

### Frontend Structure

```
frontend/
├── src/
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # React entry point
│   ├── index.css           # Global styles
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/
│   │   │   └── ServerCard.jsx
│   │   ├── charts/
│   │   │   └── MetricsChart.jsx
│   │   └── ui/             # Shadcn UI components
│   ├── hooks/              # Custom React hooks
│   │   └── useWebSocket.js
│   ├── services/           # API and external services
│   │   ├── api.js
│   │   └── websocket.js
│   └── lib/                # Utility functions
│       └── utils.js
├── public/                 # Static assets
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
└── .env.example           # Environment variables template
```

## Development Workflow

### 1. Feature Development

**Branch Strategy:**
```bash
# Create feature branch
git checkout -b feature/new-metric-type
git checkout -b fix/websocket-reconnection
git checkout -b docs/api-documentation
```

**Development Process:**
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Test locally
5. Create pull request
6. Code review and merge

### 2. Backend Development

**Adding New API Endpoints:**

1. **Create Data Model:**
```python
# backend/app/models/server_metrics.py
from pydantic import BaseModel
from typing import Optional

class NewMetricType(BaseModel):
    metric_name: str
    value: float
    unit: str
    timestamp: str
    threshold: Optional[float] = None
```

2. **Add Service Logic:**
```python
# backend/app/services/metrics_collector.py
async def collect_new_metric(self, server_ip: str) -> NewMetricType:
    """Collect new metric type from server."""
    query = f'new_metric_query{{instance="{server_ip}:9100"}}'
    result = await self.prometheus_client.query(query)
    
    return NewMetricType(
        metric_name="new_metric",
        value=result.get('value', 0),
        unit="units",
        timestamp=datetime.utcnow().isoformat()
    )
```

3. **Create API Router:**
```python
# backend/app/routers/new_endpoint.py
from fastapi import APIRouter, HTTPException
from app.services.metrics_collector import MetricsCollector
from app.models.server_metrics import NewMetricType

router = APIRouter(prefix="/api/new-endpoint", tags=["new-endpoint"])
metrics_collector = MetricsCollector()

@router.get("/", response_model=NewMetricType)
async def get_new_metric():
    """Get new metric data."""
    try:
        return await metrics_collector.collect_new_metric("192.168.50.118")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

4. **Register Router:**
```python
# backend/app/main.py
from app.routers import new_endpoint

app.include_router(new_endpoint.router)
```

**Testing Backend Changes:**
```bash
# Run tests
cd backend
python -m pytest tests/

# Test specific endpoint
curl http://localhost:8000/api/new-endpoint/

# Check API documentation
open http://localhost:8000/docs
```

### 3. Frontend Development

**Adding New Components:**

1. **Create Component:**
```jsx
// frontend/src/components/dashboard/NewMetricCard.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewMetricCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Metric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Metric</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data?.value} {data?.unit}
        </div>
      </CardContent>
    </Card>
  );
}
```

2. **Add API Service:**
```javascript
// frontend/src/services/api.js
export const apiService = {
  // ... existing methods
  
  async getNewMetric() {
    const response = await fetch(`${API_BASE_URL}/api/new-endpoint/`);
    if (!response.ok) {
      throw new Error('Failed to fetch new metric');
    }
    return response.json();
  }
};
```

3. **Use in Main Component:**
```jsx
// frontend/src/App.jsx
import { NewMetricCard } from './components/dashboard/NewMetricCard';

function App() {
  const [newMetricData, setNewMetricData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewMetric = async () => {
      try {
        const data = await apiService.getNewMetric();
        setNewMetricData(data);
      } catch (error) {
        console.error('Failed to fetch new metric:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewMetric();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* ... existing components */}
      <NewMetricCard data={newMetricData} isLoading={isLoading} />
    </div>
  );
}
```

**Testing Frontend Changes:**
```bash
# Run development server
cd frontend
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. WebSocket Development

**Adding New WebSocket Events:**

1. **Backend WebSocket Handler:**
```python
# backend/app/services/websocket_manager.py
async def broadcast_new_event(self, data: dict):
    """Broadcast new event type to all connected clients."""
    message = {
        "event_type": "new_event",
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await self.broadcast(json.dumps(message))
```

2. **Frontend WebSocket Handler:**
```javascript
// frontend/src/hooks/useWebSocket.js
const handleMessage = useCallback((event) => {
  const data = JSON.parse(event.data);
  
  switch (data.event_type) {
    case 'new_event':
      setNewEventData(data.data);
      break;
    // ... existing cases
  }
}, []);
```

## Testing

### Backend Testing

**Unit Tests:**
```python
# backend/tests/test_metrics_collector.py
import pytest
from app.services.metrics_collector import MetricsCollector

@pytest.mark.asyncio
async def test_collect_cpu_metrics():
    collector = MetricsCollector()
    metrics = await collector.collect_cpu_metrics("192.168.50.118")
    
    assert metrics.usage_percent >= 0
    assert metrics.usage_percent <= 100
    assert metrics.cores > 0

@pytest.mark.asyncio
async def test_prometheus_connection():
    collector = MetricsCollector()
    result = await collector.prometheus_client.query("up")
    
    assert result is not None
```

**Integration Tests:**
```python
# backend/tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_server_overview():
    response = client.get("/api/servers/overview")
    assert response.status_code == 200
    data = response.json()
    assert "ai_server" in data
    assert "app_server" in data
    assert "storage_server" in data
```

**Run Backend Tests:**
```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app tests/

# Run specific test file
python -m pytest tests/test_metrics_collector.py -v
```

### Frontend Testing

**Component Tests:**
```javascript
// frontend/src/components/__tests__/ServerCard.test.jsx
import { render, screen } from '@testing-library/react';
import { ServerCard } from '../dashboard/ServerCard';

const mockData = {
  server_status: { status: 'online' },
  cpu: { usage_percent: 45.2 },
  memory: { usage_percent: 67.8 }
};

test('renders server card with data', () => {
  render(<ServerCard title="Test Server" data={mockData} />);
  
  expect(screen.getByText('Test Server')).toBeInTheDocument();
  expect(screen.getByText('45.2%')).toBeInTheDocument();
  expect(screen.getByText('67.8%')).toBeInTheDocument();
});

test('shows loading state', () => {
  render(<ServerCard title="Test Server" isLoading={true} />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

**API Service Tests:**
```javascript
// frontend/src/services/__tests__/api.test.js
import { apiService } from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('apiService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('getServerOverview returns data', async () => {
    const mockData = { ai_server: {}, app_server: {} };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const result = await apiService.getServerOverview();
    expect(result).toEqual(mockData);
  });

  test('handles API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(apiService.getServerOverview()).rejects.toThrow();
  });
});
```

**Run Frontend Tests:**
```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Code Style and Standards

### Backend Code Style

**Python Standards:**
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Use async/await for I/O operations

**Example:**
```python
from typing import Optional, List
from datetime import datetime

async def collect_metrics(
    server_ip: str,
    metric_types: Optional[List[str]] = None
) -> dict:
    """
    Collect metrics from specified server.
    
    Args:
        server_ip: IP address of target server
        metric_types: Optional list of specific metrics to collect
        
    Returns:
        Dictionary containing collected metrics
        
    Raises:
        ConnectionError: If server is unreachable
        ValueError: If invalid metric type specified
    """
    if metric_types is None:
        metric_types = ["cpu", "memory", "disk"]
    
    # Implementation here
    pass
```

**Linting and Formatting:**
```bash
# Install tools
pip install black isort flake8 mypy

# Format code
black backend/app/
isort backend/app/

# Check style
flake8 backend/app/
mypy backend/app/
```

### Frontend Code Style

**JavaScript/React Standards:**
- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Implement proper error handling

**Example:**
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ServerCard component displays server metrics in a card format
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {Object} props.data - Server metrics data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onRefresh - Refresh callback
 */
export function ServerCard({ title, data, isLoading, onRefresh }) {
  const [error, setError] = useState(null);

  const handleRefresh = useCallback(() => {
    setError(null);
    onRefresh?.();
  }, [onRefresh]);

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4">
          <div className="text-red-600">Error: {error}</div>
          <button onClick={handleRefresh} className="mt-2 text-blue-600">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  // Component implementation
}
```

**Linting and Formatting:**
```bash
# Install tools
npm install --save-dev eslint prettier eslint-plugin-react

# Format code
npx prettier --write frontend/src/

# Check style
npx eslint frontend/src/
```

## Debugging

### Backend Debugging

**VS Code Debug Configuration:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/app/main.py",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      },
      "args": ["--reload"]
    }
  ]
}
```

**Logging Configuration:**
```python
# backend/app/main.py
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.3f}s"
    )
    
    return response
```

### Frontend Debugging

**Browser DevTools:**
- Use React Developer Tools extension
- Monitor Network tab for API calls
- Check Console for JavaScript errors
- Use Performance tab for optimization

**Debug Logging:**
```javascript
// frontend/src/lib/debug.js
const DEBUG = import.meta.env.VITE_DEV_MODE === 'true';

export const debug = {
  log: (...args) => DEBUG && console.log('[DEBUG]', ...args),
  error: (...args) => DEBUG && console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  time: (label) => DEBUG && console.time(label),
  timeEnd: (label) => DEBUG && console.timeEnd(label)
};

// Usage
import { debug } from '@/lib/debug';

debug.log('WebSocket connected');
debug.time('API Request');
// ... API call
debug.timeEnd('API Request');
```

## Performance Optimization

### Backend Performance

**Database Query Optimization:**
```python
# Use connection pooling
from prometheus_api_client import PrometheusConnect

class PrometheusClient:
    def __init__(self):
        self.client = PrometheusConnect(
            url=settings.prometheus_url,
            disable_ssl=True
        )
        self._query_cache = {}
    
    async def query_with_cache(self, query: str, ttl: int = 30):
        """Query with caching to reduce load."""
        cache_key = f"{query}:{int(time.time() // ttl)}"
        
        if cache_key in self._query_cache:
            return self._query_cache[cache_key]
        
        result = await self.query(query)
        self._query_cache[cache_key] = result
        
        # Clean old cache entries
        if len(self._query_cache) > 100:
            old_keys = list(self._query_cache.keys())[:-50]
            for key in old_keys:
                del self._query_cache[key]
        
        return result
```

**Async Optimization:**
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def collect_all_metrics():
    """Collect metrics from all servers concurrently."""
    tasks = [
        collect_server_metrics("192.168.50.118"),
        collect_server_metrics("192.168.50.164"),
        collect_server_metrics("192.168.50.223")
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### Frontend Performance

**Component Optimization:**
```jsx
import React, { memo, useMemo, useCallback } from 'react';

export const ServerCard = memo(({ data, onRefresh }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processMetricsData(data);
  }, [data]);

  // Memoize callbacks
  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <Card>
      {/* Component content */}
    </Card>
  );
});

ServerCard.displayName = 'ServerCard';
```

**Bundle Optimization:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-slot']
        }
      }
    }
  }
});
```

## Contributing Guidelines

### Pull Request Process

1. **Fork and Branch:**
```bash
git fork <repository>
git checkout -b feature/your-feature-name
```

2. **Development:**
- Write code following style guidelines
- Add tests for new functionality
- Update documentation
- Test locally

3. **Commit:**
```bash
git add .
git commit -m "feat: add new metric collection for storage usage

- Add storage filesystem metrics collection
- Update API endpoints for storage data
- Add frontend components for storage visualization
- Include tests for new functionality"
```

4. **Pull Request:**
- Create PR with clear description
- Include screenshots for UI changes
- Reference related issues
- Request review from maintainers

### Code Review Checklist

**Backend:**
- [ ] Code follows PEP 8 standards
- [ ] Type hints are used
- [ ] Functions have docstrings
- [ ] Tests are included
- [ ] Error handling is implemented
- [ ] Async/await used for I/O operations

**Frontend:**
- [ ] Components are properly structured
- [ ] Props are documented
- [ ] Error boundaries are implemented
- [ ] Accessibility considerations
- [ ] Performance optimizations
- [ ] Tests are included

**General:**
- [ ] Documentation is updated
- [ ] Breaking changes are noted
- [ ] Security considerations
- [ ] Performance impact assessed

This development guide provides the foundation for contributing to and extending the Infrastructure Monitoring Dashboard. Follow these guidelines to maintain code quality and consistency across the project.