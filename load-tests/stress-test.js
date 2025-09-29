import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Custom metrics for stress testing
const errorRate = new Rate('errors');
const requestCounter = new Counter('requests');
const responseTime = new Trend('response_time');
const throughput = new Rate('throughput');

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up to 100 users
    { duration: '3m', target: 100 },    // Stay at 100 users
    { duration: '2m', target: 500 },    // Spike to 500 users
    { duration: '5m', target: 500 },    // Hold at 500 users
    { duration: '2m', target: 1000 },   // Spike to 1000 users
    { duration: '5m', target: 1000 },   // Hold at 1000 users
    { duration: '2m', target: 2000 },   // Stress test at 2000 users
    { duration: '3m', target: 2000 },   // Hold at 2000 users
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],  // Looser thresholds for stress test
    http_req_failed: ['rate<0.10'],                   // Allow up to 10% errors under stress
    errors: ['rate<0.10'],                            // Custom error rate
    http_reqs: ['rate>10'],                          // At least 10 requests per second
    vus: ['value>0'],                                 // Virtual users should be > 0
  },
  ext: {
    loadimpact: {
      projectID: __ENV.PROJECT_ID,
      name: 'Jewelry SEO Stress Test',
    },
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3001';
let authToken = '';

// Test scenarios
const scenarios = [
  { endpoint: '/api/health', method: 'GET', weight: 2 },
  { endpoint: '/api/products', method: 'GET', weight: 5 },
  { endpoint: '/api/analytics/summary', method: 'GET', weight: 3 },
  { endpoint: '/api/ai/providers', method: 'GET', weight: 2 },
  { endpoint: '/api/content-strategies', method: 'GET', weight: 3 },
];

export function setup() {
  // Attempt to authenticate
  const loginRes = http.post(`${API_URL}/api/auth/login`, {
    email: 'stress@test.com',
    password: 'stress123',
  });

  if (loginRes.status === 200) {
    authToken = loginRes.json('token');
    console.log('Stress test authentication successful');
  } else {
    console.log('Stress test running without authentication');
  }

  return { token: authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-stress-test',
  };

  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // Randomly select scenario based on weights
  const scenario = selectWeightedScenario(scenarios);

  // Add random query parameters to simulate real usage
  const queryParams = generateRandomParams(scenario.endpoint);
  const url = `${API_URL}${scenario.endpoint}${queryParams}`;

  let response;
  const startTime = Date.now();

  if (scenario.method === 'GET') {
    response = http.get(url, { headers });
  } else if (scenario.method === 'POST') {
    const payload = generatePayload(scenario.endpoint);
    response = http.post(url, payload, { headers });
  }

  const responseTimeMs = Date.now() - startTime;

  // Record metrics
  requestCounter.add(1);
  responseTime.add(responseTimeMs);
  throughput.add(1);

  // Basic checks
  const success = check(response, {
    'status is 2xx or 4xx': (r) => r.status >= 200 && r.status < 500,
    'response received': (r) => r.status !== 0,
    'response time < 5s': (r) => responseTimeMs < 5000,
  });

  if (!success || response.status >= 500) {
    errorRate.add(1);
    console.log(`Request failed: ${scenario.method} ${scenario.endpoint} - Status: ${response.status}, Time: ${responseTimeMs}ms`);
  }

  // Variable think time to simulate real users
  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log(`Total requests: ${requestCounter.count}`);
  console.log(`Error rate: ${(errorRate.count / requestCounter.count) * 100}%`);
  console.log(`Average response time: ${responseTime.mean}ms`);
}

export function handleSummary(data) {
  return {
    "stress-test-summary.html": htmlReport(data),
  };
}

// Helper functions
function selectWeightedScenario(scenarios) {
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }

  return scenarios[0];
}

function generateRandomParams(endpoint) {
  const params = new URLSearchParams();

  if (endpoint.includes('/products')) {
    params.set('limit', Math.floor(Math.random() * 50) + 10);
    params.set('page', Math.floor(Math.random() * 10) + 1);
    if (Math.random() > 0.5) {
      params.set('status', ['active', 'pending', 'completed'][Math.floor(Math.random() * 3)]);
    }
  } else if (endpoint.includes('/analytics')) {
    params.set('days', Math.floor(Math.random() * 30) + 7);
    if (Math.random() > 0.5) {
      params.set('type', ['seo', 'performance', 'conversion'][Math.floor(Math.random() * 3)]);
    }
  }

  return params.toString() ? `?${params.toString()}` : '';
}

function generatePayload(endpoint) {
  if (endpoint.includes('/optimization')) {
    return {
      productId: `prod_${Math.floor(Math.random() * 1000)}`,
      strategy: ['seo', 'performance', 'conversion'][Math.floor(Math.random() * 3)],
    };
  }

  return {};
}