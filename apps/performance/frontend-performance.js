import { chromium } from 'playwright';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

// Frontend performance metrics
const pageLoadTime = new Trend('page_load_time');
const firstContentfulPaint = new Trend('first_contentful_paint');
const timeToInteractive = new Trend('time_to_interactive');
const cumulativeLayoutShift = new Trend('cumulative_layout_shift');
const largestContentfulPaint = new Trend('largest_contentful_paint');

export const options = {
  scenarios: {
    ui_performance: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    page_load_time: ['p(95)<3000'], // 95% of page loads < 3s
    first_contentful_paint: ['p(95)<1500'], // 95% FCP < 1.5s
    time_toInteractive: ['p(95)<4000'], // 95% TTI < 4s
  },
};

const BASE_URL = 'http://localhost:4000';

export default async function () {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await context.newPage();

    // Enable performance metrics collection
    await page.goto('about:blank');
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // Test 1: Dashboard page load
    await testPageLoad(page, `${BASE_URL}/`, 'Dashboard');

    // Test 2: Products page
    await testPageLoad(page, `${BASE_URL}/products`, 'Products');

    // Test 3: Analytics page
    await testPageLoad(page, `${BASE_URL}/analytics`, 'Analytics');

    // Test 4: Content strategies page
    await testPageLoad(page, `${BASE_URL}/content-strategies`, 'Content Strategies');

    // Test 5: User interactions
    await testUserInteractions(page);

  } finally {
    await context.close();
    await browser.close();
  }
}

async function testPageLoad(page, url, pageName) {
  console.log(`Testing ${pageName} page load...`);

  // Start navigation and performance metrics
  const navigationStart = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const navigationEnd = Date.now();

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
    const cls = performance.getEntriesByType('layout-shift');

    return {
      loadEventEnd: navigation.loadEventEnd,
      domContentLoaded: navigation.domContentLoadedEventEnd,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      largestContentfulPaint: lcp?.startTime,
      cumulativeLayoutShift: cls.reduce((acc, shift) => acc + shift.value, 0),
    };
  });

  const pageLoadTime = navigationEnd - navigationStart;

  // Record metrics
  pageLoadTime.add(pageLoadTime);
  firstContentfulPaint.add(metrics.firstContentfulPaint || 0);
  largestContentfulPaint.add(metrics.largestContentfulPaint || 0);
  cumulativeLayoutShift.add(metrics.cumulativeLayoutShift || 0);

  // Validate performance
  check(pageLoadTime, {
    [`${pageName} page load < 3s`]: (time) => time < 3000,
  });

  check(metrics.firstContentfulPaint, {
    [`${pageName} FCP < 1.5s`]: (fcp) => fcp < 1500,
  });

  check(metrics.cumulativeLayoutShift, {
    [`${pageName} CLS < 0.1`]: (cls) => cls < 0.1,
  });

  console.log(`${pageName}: Load time ${pageLoadTime}ms, FCP ${metrics.firstContentfulPaint}ms, CLS ${metrics.cumulativeLayoutShift}`);
}

async function testUserInteractions(page) {
  console.log('Testing user interactions...');

  await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });

  // Test 1: Search functionality
  const searchStartTime = Date.now();
  await page.fill('[data-testid="search-input"]', 'gold ring');
  await page.press('[data-testid="search-input"]', 'Enter');
  await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
  const searchTime = Date.now() - searchStartTime;

  // Test 2: Filter functionality
  const filterStartTime = Date.now();
  await page.click('[data-testid="filter-button"]');
  await page.click('[data-testid="status-filter"]');
  await page.waitForLoadState('networkidle');
  const filterTime = Date.now() - filterStartTime;

  // Test 3: Product selection
  const selectionStartTime = Date.now();
  await page.click('[data-testid="product-card"]:first-child');
  await page.waitForSelector('[data-testid="product-detail"]', { timeout: 5000 });
  const selectionTime = Date.now() - selectionStartTime;

  // Test 4: Pagination
  const paginationStartTime = Date.now();
  await page.click('[data-testid="next-page"]');
  await page.waitForLoadState('networkidle');
  const paginationTime = Date.now() - paginationStartTime;

  // Validate interaction performance
  check(searchTime, {
    'search interaction < 2000ms': (time) => time < 2000,
  });

  check(filterTime, {
    'filter interaction < 1000ms': (time) => time < 1000,
  });

  check(selectionTime, {
    'product selection < 1500ms': (time) => time < 1500,
  });

  check(paginationTime, {
    'pagination < 1500ms': (time) => time < 1500,
  });

  console.log(`Interactions - Search: ${searchTime}ms, Filter: ${filterTime}ms, Selection: ${selectionTime}ms, Pagination: ${paginationTime}ms`);
}

// Component rendering performance test
export async function testComponentRendering() {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/products`);

    // Test component rendering performance
    const renderStartTime = Date.now();

    // Force re-render of multiple components
    await page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('[data-testid="product-card"]'));
      products.forEach((product, index) => {
        product.style.display = index % 2 === 0 ? 'none' : 'block';
      });
    });

    await page.waitForTimeout(100);

    await page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('[data-testid="product-card"]'));
      products.forEach(product => {
        product.style.display = 'block';
      });
    });

    await page.waitForLoadState('networkidle');
    const renderEndTime = Date.now();

    const renderTime = renderEndTime - renderStartTime;

    check(renderTime, {
      'component re-render < 1000ms': (time) => time < 1000,
    });

    console.log(`Component re-render time: ${renderTime}ms`);

  } finally {
    await context.close();
    await browser.close();
  }
}