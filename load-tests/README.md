# Load Testing for Jewelry SEO Automation

This directory contains load testing scripts using k6 to validate system performance under various load conditions.

## Test Types

### 1. Smoke Test (`smoke-test.js`)
- **Purpose**: Basic functionality check with light load
- **Load**: 10 users for 2 minutes
- **Thresholds**:
  - 95% of requests < 200ms
  - Error rate < 1%

### 2. API Load Test (`api-load-test.js`)
- **Purpose**: Validate API performance under normal load
- **Load**: 50 → 100 → 200 users over 16 minutes
- **Thresholds**:
  - 95% of requests < 500ms
  - 99% of requests < 1s
  - Error rate < 5%

### 3. Stress Test (`stress-test.js`)
- **Purpose**: Identify system limits and breaking points
- **Load**: 100 → 500 → 1000 → 2000 users over 24 minutes
- **Thresholds**:
  - 95% of requests < 2s
  - Error rate < 10%

## Prerequisites

1. Install k6:
```bash
# macOS
brew install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

2. Install k6 reporter for HTML reports:
```bash
k6 install xk6-reporter
```

## Running Tests

### Local Testing

Set environment variables:
```bash
export BASE_URL=http://localhost:4000
export API_URL=http://localhost:3001
```

Run smoke test:
```bash
k6 run load-tests/smoke-test.js
```

Run API load test:
```bash
k6 run load-tests/api-load-test.js
```

Run stress test:
```bash
k6 run load-tests/stress-test.js
```

### Cloud Testing (Using k6 Cloud)

1. Sign up at https://k6.io/cloud
2. Get your project ID
3. Set environment variable:
```bash
export PROJECT_ID=your-project-id
```

4. Run tests with cloud execution:
```bash
k6 cloud load-tests/smoke-test.js
k6 cloud load-tests/api-load-test.js
k6 cloud load-tests/stress-test.js
```

### Docker-based Testing

1. Build k6 Docker image:
```dockerfile
FROM loadimpact/k6:latest

COPY load-tests/ /tests/
WORKDIR /tests
```

2. Run tests:
```bash
docker run -i --rm \
  -e BASE_URL=http://host.docker.internal:4000 \
  -e API_URL=http://host.docker.internal:3001 \
  loadimpact/k6 run /tests/smoke-test.js
```

## Test Configuration

### Environment Variables

- `BASE_URL`: Frontend application URL (default: http://localhost:4000)
- `API_URL`: Backend API URL (default: http://localhost:3001)
- `PROJECT_ID`: k6 Cloud project ID (for cloud execution)

### Customizing Tests

#### Modify Load Patterns
Edit the `stages` array in each test file:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp to 100 users in 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
};
```

#### Adjust Thresholds
Update the `thresholds` object:

```javascript
thresholds: {
  http_req_duration: ['p(95)<200'],  // 95th percentile < 200ms
  http_req_failed: ['rate<0.01'],     // Error rate < 1%
},
```

#### Add Custom Metrics
Create custom metrics in your test:

```javascript
import { Rate, Counter, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const requestCounter = new Counter('requests');
const responseTime = new Trend('response_time');
```

## Monitoring and Analysis

### Real-time Monitoring
During test execution, k6 provides real-time metrics:
- Requests per second
- Response times
- Error rates
- Virtual user count

### HTML Reports
After test completion, HTML reports are generated:
- `smoke-test-summary.html`
- `api-load-test-summary.html`
- `stress-test-summary.html`

### Key Metrics to Monitor
1. **Response Times**: P95, P99, max, average
2. **Error Rates**: HTTP errors, timeouts
3. **Throughput**: Requests per second
4. **Resource Usage**: CPU, memory, network (requires external monitoring)

## Performance Targets

Based on the requirements in Story 4.3:

| Metric | Target | Description |
|--------|---------|-------------|
| API Response Time | <200ms | P95 response time for API endpoints |
| Page Load Time | <1s | Frontend page load time |
| Error Rate | <1% | HTTP error rate under normal load |
| Concurrent Users | 1000+ | System should handle 1000+ concurrent users |
| Uptime | 99.9% | System availability |
| Cache Hit Rate | >80% | Cache effectiveness |

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify services are running
   - Check network connectivity
   - Validate URLs and ports

2. **High Response Times**
   - Monitor system resources (CPU, memory)
   - Check database performance
   - Review caching configuration

3. **High Error Rates**
   - Check application logs
   - Verify authentication tokens
   - Monitor service health

4. **Test Infrastructure Issues**
   - Ensure sufficient k6 resources
   - Check Docker/container limits
   - Monitor network bandwidth

### Debug Tips

1. Use `--http-debug` flag for verbose HTTP output
2. Lower VU count for initial debugging
3. Test individual endpoints separately
4. Monitor application logs during test execution

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Load Tests
  run: |
    npm install -g k6
    k6 run load-tests/smoke-test.js
    k6 run load-tests/api-load-test.js

- name: Upload Load Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: load-test-reports
    path: |
      smoke-test-summary.html
      api-load-test-summary.html
      stress-test-summary.html
```

## Performance Regression Testing

1. Establish baseline metrics
2. Run tests regularly (e.g., nightly)
3. Compare results against baseline
4. Set up alerts for performance degradation
5. Integrate with deployment pipeline

## Best Practices

1. **Test in staging environment** before production
2. **Use realistic test data** and scenarios
3. **Monitor system resources** during tests
4. **Analyze results** and identify bottlenecks
5. **Document findings** and share with team
6. **Run tests regularly** to catch regressions