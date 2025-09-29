import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Custom metrics
const errorRate = new Rate('errors');
const requestCounter = new Counter('requests');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.05'],                  // <5% error rate
    errors: ['rate<0.05'],                           // Custom error rate < 5%
    response_time: ['p(95)<500'],                   // Custom response time trend
  },
  ext: {
    loadimpact: {
      projectID: __ENV.PROJECT_ID,
      name: 'Jewelry SEO API Load Test',
    },
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3001';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
};

export function setup() {
  // Login and get auth token
  const loginRes = http.post(`${API_URL}/api/auth/login`, testUser);

  if (loginRes.status === 200) {
    authToken = loginRes.json('token');
    console.log('Successfully authenticated');
  } else {
    console.log('Authentication failed, running without auth');
  }

  return { token: authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // Test products endpoint
  const productsRes = http.get(`${API_URL}/api/products?limit=20`, {
    headers,
  });

  requestCounter.add(1);
  responseTime.add(productsRes.timings.duration);

  check(productsRes, {
    'products endpoint status': (r) => r.status === 200,
    'products response time < 500ms': (r) => r.timings.duration < 500,
    'products data structure': (r) => {
      const body = r.json();
      return Array.isArray(body.products) && body.products.length >= 0;
    },
  });

  if (productsRes.status !== 200) {
    errorRate.add(1);
  }

  // Test analytics endpoint
  const analyticsRes = http.get(`${API_URL}/api/analytics/summary`, {
    headers,
  });

  requestCounter.add(1);
  responseTime.add(analyticsRes.timings.duration);

  check(analyticsRes, {
    'analytics endpoint status': (r) => r.status === 200,
    'analytics response time < 1s': (r) => r.timings.duration < 1000,
    'analytics data structure': (r) => {
      const body = r.json();
      return typeof body === 'object' && body !== null;
    },
  });

  if (analyticsRes.status !== 200) {
    errorRate.add(1);
  }

  // Test AI providers endpoint
  const aiProvidersRes = http.get(`${API_URL}/api/ai/providers`, {
    headers,
  });

  requestCounter.add(1);
  responseTime.add(aiProvidersRes.timings.duration);

  check(aiProvidersRes, {
    'AI providers endpoint status': (r) => r.status === 200,
    'AI providers response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (aiProvidersRes.status !== 200) {
    errorRate.add(1);
  }

  // Test content strategies endpoint
  const strategiesRes = http.get(`${API_URL}/api/content-strategies`, {
    headers,
  });

  requestCounter.add(1);
  responseTime.add(strategiesRes.timings.duration);

  check(strategiesRes, {
    'content strategies endpoint status': (r) => r.status === 200,
    'content strategies response time < 300ms': (r) => r.timings.duration < 300,
  });

  if (strategiesRes.status !== 200) {
    errorRate.add(1);
  }

  // Simulate think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  // Logout if authenticated
  if (data.token) {
    const logoutRes = http.post(`${API_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    if (logoutRes.status === 200) {
      console.log('Successfully logged out');
    }
  }
}

export function handleSummary(data) {
  return {
    "api-load-test-summary.html": htmlReport(data),
  };
}