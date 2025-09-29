import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { securityScanner } from './security-scanner';

// Security testing utilities
export class SecurityTests {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // SQL Injection Tests
  async testSQLInjection() {
    const maliciousInputs = [
      "' OR '1'='1",
      "' OR 1=1--",
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT username, password FROM users--"
    ];

    const endpoints = ['/api/products', '/api/users', '/api/analytics'];
    const results: any[] = [];

    for (const endpoint of endpoints) {
      for (const input of maliciousInputs) {
        try {
          const response = await axios.get(`${this.baseUrl}${endpoint}?search=${encodeURIComponent(input)}`);
          results.push({
            endpoint,
            input,
            vulnerability: 'SQL Injection',
            status: response.status,
            detected: response.status === 500 || response.status === 400
          });
        } catch (error) {
          results.push({
            endpoint,
            input,
            vulnerability: 'SQL Injection',
            status: 'ERROR',
            detected: true
          });
        }
      }
    }

    return results;
  }

  // XSS Tests
  async testXSSVulnerabilities() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '" onmouseover="alert(\'XSS\')"',
      '\'><script>alert(String.fromCharCode(88,83,83))</script>'
    ];

    const testCases = [
      { method: 'POST', endpoint: '/api/products', field: 'title' },
      { method: 'POST', endpoint: '/api/products', field: 'description' },
      { method: 'POST', endpoint: '/api/users', field: 'name' },
      { method: 'POST', endpoint: '/api/users', field: 'email' }
    ];

    const results: any[] = [];

    for (const testCase of testCases) {
      for (const payload of xssPayloads) {
        try {
          const data = { [testCase.field]: payload };
          const response = await axios.post(`${this.baseUrl}${testCase.endpoint}`, data);

          results.push({
            endpoint: testCase.endpoint,
            field: testCase.field,
            payload,
            vulnerability: 'XSS',
            status: response.status,
            detected: response.data.includes(payload) || response.status === 400
          });
        } catch (error) {
          results.push({
            endpoint: testCase.endpoint,
            field: testCase.field,
            payload,
            vulnerability: 'XSS',
            status: 'ERROR',
            detected: true
          });
        }
      }
    }

    return results;
  }

  // Authentication & Authorization Tests
  async testAuthenticationSecurity() {
    const results: any[] = [];

    // Test missing authentication
    const protectedEndpoints = [
      '/api/products',
      '/api/ai-providers',
      '/api/analytics',
      '/api/content-strategies'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`);
        results.push({
          endpoint,
          test: 'Missing Authentication',
          vulnerability: 'Broken Authentication',
          status: response.status,
          detected: response.status === 401
        });
      } catch (error) {
        results.push({
          endpoint,
          test: 'Missing Authentication',
          vulnerability: 'Broken Authentication',
          status: 'ERROR',
          detected: false
        });
      }
    }

    // Test weak token validation
    const weakTokens = [
      'invalid-token',
      'bearer invalid',
      'undefined',
      'null',
      '123456'
    ];

    for (const token of weakTokens) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        results.push({
          token,
          test: 'Weak Token Validation',
          vulnerability: 'Broken Authentication',
          status: response.status,
          detected: response.status !== 401
        });
      } catch (error) {
        results.push({
          token,
          test: 'Weak Token Validation',
          vulnerability: 'Broken Authentication',
          status: 'ERROR',
          detected: false
        });
      }
    }

    return results;
  }

  // Input Validation Tests
  async testInputValidation() {
    const maliciousInputs = [
      { field: 'email', value: 'invalid-email', expected: 'Valid email required' },
      { field: 'price', value: -100, expected: 'Price must be positive' },
      { field: 'price', value: 'abc', expected: 'Price must be a number' },
      { field: 'title', value: '', expected: 'Title is required' },
      { field: 'title', value: 'a'.repeat(1001), expected: 'Title too long' }
    ];

    const results: any[] = [];

    for (const input of maliciousInputs) {
      try {
        const data = { [input.field]: input.value };
        const response = await axios.post(`${this.baseUrl}/api/products`, data);

        results.push({
          field: input.field,
          value: input.value,
          test: 'Input Validation',
          vulnerability: 'Input Validation',
          status: response.status,
          detected: response.status === 400 && response.data.message?.includes(input.expected)
        });
      } catch (error) {
        results.push({
          field: input.field,
          value: input.value,
          test: 'Input Validation',
          vulnerability: 'Input Validation',
          status: 'ERROR',
          detected: true
        });
      }
    }

    return results;
  }

  // Rate Limiting Tests
  async testRateLimiting() {
    const results: any[] = [];
    const endpoint = '/api/products';
    const requests = 50; // Send 50 rapid requests

    for (let i = 0; i < requests; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`);

        if (response.status === 429) {
          results.push({
            request: i + 1,
            test: 'Rate Limiting',
            vulnerability: 'Rate Limiting',
            status: response.status,
            detected: true,
            message: 'Rate limiting working correctly'
          });
          break;
        }

        if (i === requests - 1) {
          results.push({
            request: i + 1,
            test: 'Rate Limiting',
            vulnerability: 'Rate Limiting',
            status: 'NO_RATE_LIMIT',
            detected: false,
            message: 'No rate limiting detected'
          });
        }
      } catch (error) {
        results.push({
          request: i + 1,
          test: 'Rate Limiting',
          vulnerability: 'Rate Limiting',
          status: 'ERROR',
          detected: false,
          message: 'Error during rate limiting test'
        });
      }
    }

    return results;
  }

  // Data Exposure Tests
  async testDataExposure() {
    const results: any[] = [];

    // Test for sensitive data in responses
    const endpoints = [
      { method: 'GET', endpoint: '/api/users' },
      { method: 'GET', endpoint: '/api/products' },
      { method: 'GET', endpoint: '/api/ai-providers' }
    ];

    const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'creditCard'];

    for (const endpoint of endpoints) {
      try {
        const response = await axios[endpoint.method.toLowerCase()](`${this.baseUrl}${endpoint.endpoint}`);
        const responseData = JSON.stringify(response.data);

        const exposedFields = sensitiveFields.filter(field =>
          responseData.toLowerCase().includes(field.toLowerCase())
        );

        results.push({
          endpoint: endpoint.endpoint,
          test: 'Data Exposure',
          vulnerability: 'Sensitive Data Exposure',
          status: response.status,
          detected: exposedFields.length > 0,
          exposedFields
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.endpoint,
          test: 'Data Exposure',
          vulnerability: 'Sensitive Data Exposure',
          status: 'ERROR',
          detected: false,
          exposedFields: []
        });
      }
    }

    return results;
  }

  // Security Headers Tests
  async testSecurityHeaders() {
    const results: any[] = [];

    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      const headers = response.headers;

      const securityHeaders = [
        { header: 'x-content-type-options', expected: 'nosniff' },
        { header: 'x-frame-options', expected: 'DENY' },
        { header: 'x-xss-protection', expected: '1; mode=block' },
        { header: 'strict-transport-security', expected: 'max-age=31536000; includeSubDomains' },
        { header: 'content-security-policy', expected: undefined } // CSP is good but flexible
      ];

      for (const securityHeader of securityHeaders) {
        const headerValue = headers[securityHeader.header];
        const isPresent = headerValue !== undefined;
        const isCorrect = securityHeader.expected === undefined ||
                          headerValue === securityHeader.expected ||
                          (securityHeader.header === 'content-security-policy' && headerValue);

        results.push({
          header: securityHeader.header,
          test: 'Security Headers',
          vulnerability: 'Security Misconfiguration',
          detected: !isPresent || !isCorrect,
          status: isPresent ? 'PRESENT' : 'MISSING',
          value: headerValue,
          expected: securityHeader.expected
        });
      }
    } catch (error) {
      results.push({
        test: 'Security Headers',
        vulnerability: 'Security Misconfiguration',
        detected: true,
        status: 'ERROR',
        message: 'Failed to check security headers'
      });
    }

    return results;
  }

  // Comprehensive Security Scan
  async runComprehensiveScan() {
    console.log('🔒 Starting comprehensive security scan...');

    const scanResults = {
      timestamp: new Date().toISOString(),
      target: this.baseUrl,
      tests: {
        sqlInjection: await this.testSQLInjection(),
        xss: await this.testXSSVulnerabilities(),
        authentication: await this.testAuthenticationSecurity(),
        inputValidation: await this.testInputValidation(),
        rateLimiting: await this.testRateLimiting(),
        dataExposure: await this.testDataExposure(),
        securityHeaders: await this.testSecurityHeaders()
      }
    };

    // Calculate security score
    const allTests = Object.values(scanResults.tests).flat();
    const vulnerabilities = allTests.filter(test => test.detected);
    const totalTests = allTests.length;
    const securityScore = Math.round(((totalTests - vulnerabilities.length) / totalTests) * 100);

    scanResults['summary'] = {
      totalTests,
      vulnerabilitiesFound: vulnerabilities.length,
      securityScore,
      riskLevel: securityScore >= 80 ? 'LOW' : securityScore >= 60 ? 'MEDIUM' : 'HIGH'
    };

    console.log(`🔒 Security scan complete. Score: ${securityScore}/100 (${scanResults.summary.riskLevel} risk)`);

    return scanResults;
  }

  // Generate security report
  generateReport(scanResults: any) {
    const report = {
      executiveSummary: {
        securityScore: scanResults.summary.securityScore,
        riskLevel: scanResults.summary.riskLevel,
        vulnerabilitiesFound: scanResults.summary.vulnerabilitiesFound,
        totalTests: scanResults.summary.totalTests,
        recommendation: scanResults.summary.riskLevel === 'HIGH' ?
          'IMMEDIATE ACTION REQUIRED' :
          scanResults.summary.riskLevel === 'MEDIUM' ?
          'Address vulnerabilities soon' :
          'Maintain current security posture'
      },
      detailedFindings: scanResults.tests,
      recommendations: this.generateRecommendations(scanResults.tests),
      timestamp: scanResults.timestamp
    };

    return report;
  }

  private generateRecommendations(tests: any) {
    const recommendations: string[] = [];
    const allTests = Object.values(tests).flat();
    const vulnerabilities = allTests.filter(test => test.detected);

    if (vulnerabilities.some(v => v.vulnerability === 'SQL Injection')) {
      recommendations.push('Implement parameterized queries and input validation');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'XSS')) {
      recommendations.push('Add output encoding and Content Security Policy');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'Broken Authentication')) {
      recommendations.push('Strengthen token validation and session management');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'Input Validation')) {
      recommendations.push('Implement comprehensive input validation');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'Rate Limiting')) {
      recommendations.push('Implement API rate limiting');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'Sensitive Data Exposure')) {
      recommendations.push('Review data sanitization and response filtering');
    }

    if (vulnerabilities.some(v => v.vulnerability === 'Security Misconfiguration')) {
      recommendations.push('Configure security headers and remove server information');
    }

    return recommendations;
  }
}

// OWASP Top 10 Tests
export const owaspTests = {
  A01_BrokenAccessControl: async (baseUrl: string) => {
    // Test for broken access control
    const tests = [
      { path: '/admin', expected: 403 },
      { path: '/api/users', expected: 401 },
      { path: '/api/config', expected: 403 }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const response = await axios.get(`${baseUrl}${test.path}`);
        results.push({
          test: 'Broken Access Control',
          path: test.path,
          status: response.status,
          passed: response.status === test.expected
        });
      } catch (error) {
        results.push({
          test: 'Broken Access Control',
          path: test.path,
          status: 'ERROR',
          passed: false
        });
      }
    }
    return results;
  },

  A02_CryptographicFailures: async (baseUrl: string) => {
    // Test for cryptographic failures
    return [
      {
        test: 'Cryptographic Failures',
        check: 'Verify data encryption in transit',
        status: 'MANUAL_VERIFICATION_NEEDED',
        passed: null
      }
    ];
  },

  A03_Injection: async (baseUrl: string) => {
    const securityTests = new SecurityTests(baseUrl);
    return {
      sqlInjection: await securityTests.testSQLInjection(),
      xss: await securityTests.testXSSVulnerabilities()
    };
  }
};

export default SecurityTests;