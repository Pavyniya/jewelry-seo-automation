import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    http_req_failed: ['rate<0.01'],   // <1% error rate
    http_req_connecting: ['max<0.5'], // Connection time < 500ms
  },
  ext: {
    loadimpact: {
      projectID: __ENV.PROJECT_ID,
      name: 'Jewelry SEO Smoke Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const API_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test main page
  const homeRes = http.get(BASE_URL);
  check(homeRes, {
    'homepage loaded successfully': (r) => r.status === 200,
    'homepage response time < 1s': (r) => r.timings.duration < 1000,
    'homepage has content': (r) => r.body.length > 1000,
  });

  // Test API health endpoint
  const healthRes = http.get(`${API_URL}/health`);
  check(healthRes, {
    'health endpoint responds': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  // Test login endpoint
  const loginRes = http.post(`${API_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });

  check(loginRes, {
    'login request successful': (r) => r.status === 200 || r.status === 401, // 401 is acceptable for invalid credentials
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "smoke-test-summary.html": htmlReport(data),
  };
}