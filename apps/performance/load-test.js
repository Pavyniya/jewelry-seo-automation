import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const responseTime = new Trend('response_time');
const errorRate = new Rate('errors');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },     // Stay at 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },     // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },    // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.05'], // Less than 5% error rate
  },
  ext: {
    loadimpact: {
      projectID: __ENV.K6_PROJECT_ID,
      name: 'Jewelry SEO API Load Test',
    },
  },
};

// Test data
const testProducts = [
  { id: '1', title: 'Gold Ring', price: 299.99 },
  { id: '2', title: 'Silver Necklace', price: 199.99 },
  { id: '3', title: 'Diamond Earrings', price: 499.99 },
  { id: '4', title: 'Pearl Bracelet', price: 149.99 },
  { id: '5', title: 'Platinum Pendant', price: 399.99 },
];

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });
  responseTime.add(healthRes.timings.duration);
  requestCount.add(1);
  errorRate.add(healthRes.status >= 400);

  sleep(1);

  // Test products endpoint
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    'products endpoint status is 200': (r) => r.status === 200,
    'products response has data': (r) => r.json().products !== undefined,
  });
  responseTime.add(productsRes.timings.duration);
  requestCount.add(1);
  errorRate.add(productsRes.status >= 400);

  sleep(1);

  // Test product detail endpoint
  const randomProduct = testProducts[Math.floor(Math.random() * testProducts.length)];
  const productRes = http.get(`${BASE_URL}/api/products/${randomProduct.id}`);
  check(productRes, {
    'product detail status is 200': (r) => r.status === 200,
    'product detail has correct data': (r) => r.json().id === randomProduct.id,
  });
  responseTime.add(productRes.timings.duration);
  requestCount.add(1);
  errorRate.add(productRes.status >= 400);

  sleep(1);

  // Test AI providers endpoint
  const aiRes = http.get(`${BASE_URL}/api/ai-providers`);
  check(aiRes, {
    'AI providers endpoint status is 200': (r) => r.status === 200,
    'AI providers has data': (r) => Array.isArray(r.json()),
  });
  responseTime.add(aiRes.timings.duration);
  requestCount.add(1);
  errorRate.add(aiRes.status >= 400);

  sleep(1);

  // Test analytics endpoint
  const analyticsRes = http.get(`${BASE_URL}/api/analytics/overview`);
  check(analyticsRes, {
    'analytics endpoint status is 200': (r) => r.status === 200,
    'analytics has data': (r) => r.json().searchVisibility !== undefined,
  });
  responseTime.add(analyticsRes.timings.duration);
  requestCount.add(1);
  errorRate.add(analyticsRes.status >= 400);

  sleep(2);
}

export function setup() {
  // Create test data before load test
  console.log('Setting up load test data...');
  return { testData: 'load_test_setup' };
}

export function teardown(data) {
  // Clean up test data after load test
  console.log('Cleaning up load test data...');
}