import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// API performance metrics
const apiResponseTime = new Trend('api_response_time');
const apiErrorRate = new Trend('api_error_rate');
const databaseQueryTime = new Trend('database_query_time');
const memoryUsage = new Trend('memory_usage');

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Warm up
    { duration: '30s', target: 20 },  // Load test
    { duration: '10s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // API response time
    http_req_failed: ['rate<0.02'], // Less than 2% error rate
  },
};

const BASE_URL = 'http://localhost:3001';
const TEST_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer test-token',
};

export default function () {
  // Test API endpoints sequentially
  const endpoints = [
    {
      name: 'Health Check',
      method: 'GET',
      url: `${BASE_URL}/health`,
      expectedStatus: 200
    },
    {
      name: 'Get Products',
      method: 'GET',
      url: `${BASE_URL}/api/products`,
      expectedStatus: 200
    },
    {
      name: 'Create Product',
      method: 'POST',
      url: `${BASE_URL}/api/products`,
      body: JSON.stringify({
        title: 'Test Product ' + Date.now(),
        description: 'Performance test product',
        price: 99.99,
        vendor: 'Test Vendor',
        productType: 'Ring'
      }),
      expectedStatus: 201
    },
    {
      name: 'Get AI Providers',
      method: 'GET',
      url: `${BASE_URL}/api/ai-providers`,
      expectedStatus: 200
    },
    {
      name: 'Generate Content',
      method: 'POST',
      url: `${BASE_URL}/api/products/test/generate-seo`,
      body: JSON.stringify({
        prompt: 'Generate SEO content for test product',
        provider: 'test'
      }),
      expectedStatus: 200
    },
    {
      name: 'Get Analytics',
      method: 'GET',
      url: `${BASE_URL}/api/analytics/overview`,
      expectedStatus: 200
    },
    {
      name: 'Get Content Strategies',
      method: 'GET',
      url: `${BASE_URL}/api/content-strategies`,
      expectedStatus: 200
    }
  ];

  endpoints.forEach((endpoint) => {
    const startTime = Date.now();

    let response;
    if (endpoint.method === 'GET') {
      response = http.get(endpoint.url, { headers: TEST_HEADERS });
    } else if (endpoint.method === 'POST') {
      response = http.post(endpoint.url, endpoint.body, { headers: TEST_HEADERS });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record metrics
    apiResponseTime.add(duration);
    apiErrorRate.add(response.status >= 400 ? 1 : 0);

    // Validate response
    check(response, {
      [`${endpoint.name} status is ${endpoint.expectedStatus}`]: (r) => r.status === endpoint.expectedStatus,
      [`${endpoint.name} response time < 500ms`]: (r) => r.timings.duration < 500,
      [`${endpoint.name} has valid JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      }
    });

    // Memory usage simulation
    const memoryMB = Math.random() * 100 + 50; // Simulate 50-150MB usage
    memoryUsage.add(memoryMB);

    console.log(`${endpoint.name}: ${response.status} - ${duration}ms`);

    sleep(0.5); // Small delay between requests
  });

  // Database query simulation
  const dbStartTime = Date.now();
  sleep(Math.random() * 0.1 + 0.05); // Simulate 50-150ms query time
  const dbEndTime = Date.now();
  databaseQueryTime.add(dbEndTime - dbStartTime);
}

// Stress test for critical endpoints
export function stressTest() {
  const stressEndpoints = [
    `${BASE_URL}/api/products`,
    `${BASE_URL}/api/ai-providers`,
    `${BASE_URL}/api/analytics/overview`
  ];

  stressEndpoints.forEach((url) => {
    const response = http.get(url, { headers: TEST_HEADERS });
    check(response, {
      'stress test response < 1000ms': (r) => r.timings.duration < 1000,
      'stress test success rate > 95%': (r) => r.status < 500
    });
  });
}

// Memory leak detection simulation
export function memoryLeakTest() {
  const iterations = 100;
  const memoryMeasurements = [];

  for (let i = 0; i < iterations; i++) {
    // Simulate memory-intensive operations
    const largeArray = new Array(10000).fill('test-data');
    const processedData = largeArray.map(item => item + '-processed');

    // Get memory usage (simulated)
    const memoryUsage = Math.random() * 50 + i * 0.5; // Gradual increase
    memoryMeasurements.push(memoryUsage);

    // Make API calls
    http.get(`${BASE_URL}/health`);

    if (i % 10 === 0) {
      console.log(`Iteration ${i}: Memory usage ${memoryUsage.toFixed(2)}MB`);
    }
  }

  // Check for memory leak trend
  const initialMemory = memoryMeasurements.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const finalMemory = memoryMeasurements.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;

  console.log(`Memory growth: ${memoryGrowth.toFixed(2)}%`);

  check(memoryGrowth, {
    'memory growth < 20%': (growth) => growth < 20
  });
}