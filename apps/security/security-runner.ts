#!/usr/bin/env node

/**
 * Security Testing Runner
 *
 * Comprehensive security testing framework for the jewelry SEO automation platform
 * Implements OWASP Top 10 testing and security best practices
 */

import { SecurityTests } from './security-tests';
import axios from 'axios';

class SecurityRunner {
  private baseUrl: string;
  private securityTests: SecurityTests;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.securityTests = new SecurityTests(baseUrl);
  }

  async runSecurityScan(): Promise<void> {
    console.log('🔒 Starting comprehensive security scan...');
    console.log(`Target: ${this.baseUrl}`);
    console.log('='.repeat(60));

    try {
      // Check if server is running
      await this.checkServerHealth();

      // Run comprehensive security scan
      const results = await this.securityTests.runComprehensiveScan();

      // Display results
      this.displayResults(results);

      // Generate and save report
      const report = this.securityTests.generateReport(results);
      await this.saveReport(report);

      // Exit with appropriate code
      process.exit(results.summary.securityScore >= 80 ? 0 : 1);

    } catch (error) {
      console.error('❌ Security scan failed:', error);
      process.exit(1);
    }
  }

  private async checkServerHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Server health check failed: ${response.status}`);
      }
      console.log('✅ Server is healthy and responding');
    } catch (error) {
      throw new Error(`Unable to connect to server at ${this.baseUrl}. Please ensure the server is running.`);
    }
  }

  private displayResults(results: any): void {
    console.log('\n📊 SECURITY SCAN RESULTS');
    console.log('='.repeat(60));

    console.log(`\n🎯 Overall Security Score: ${results.summary.securityScore}/100`);
    console.log(`🚨 Risk Level: ${results.summary.riskLevel}`);
    console.log(`📋 Total Tests: ${results.summary.totalTests}`);
    console.log(`⚠️  Vulnerabilities Found: ${results.summary.vulnerabilitiesFound}`);

    // Display test category results
    console.log('\n📋 Test Category Results:');
    console.log('-'.repeat(40));

    Object.entries(results.tests).forEach(([category, tests]: [string, any]) => {
      const vulnerabilities = tests.filter((test: any) => test.detected);
      const passed = tests.length - vulnerabilities.length;
      const passRate = ((passed / tests.length) * 100).toFixed(1);

      console.log(`${category.padEnd(20)}: ${passed}/${tests.length} (${passRate}%)`);

      if (vulnerabilities.length > 0) {
        vulnerabilities.forEach((vuln: any) => {
          console.log(`  ❌ ${vuln.vulnerability}: ${vuln.test || vuln.field || vuln.endpoint}`);
        });
      }
    });

    // Display recommendations
    console.log('\n💡 Security Recommendations:');
    console.log('-'.repeat(40));
    const report = this.securityTests.generateReport(results);
    report.recommendations.forEach((rec: string, index: number) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  private async saveReport(report: any): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `security-report-${timestamp}.json`;

    try {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`\n📄 Security report saved to: ${filename}`);
    } catch (error) {
      console.warn(`⚠️  Could not save report to file: ${error}`);
    }
  }

  async runSpecificTest(testName: string): Promise<void> {
    console.log(`🔒 Running specific security test: ${testName}`);

    let results;
    switch (testName.toLowerCase()) {
      case 'sql':
        results = await this.securityTests.testSQLInjection();
        break;
      case 'xss':
        results = await this.securityTests.testXSSVulnerabilities();
        break;
      case 'auth':
        results = await this.securityTests.testAuthenticationSecurity();
        break;
      case 'input':
        results = await this.securityTests.testInputValidation();
        break;
      case 'rate':
        results = await this.securityTests.testRateLimiting();
        break;
      case 'data':
        results = await this.securityTests.testDataExposure();
        break;
      case 'headers':
        results = await this.securityTests.testSecurityHeaders();
        break;
      default:
        throw new Error(`Unknown test: ${testName}`);
    }

    console.log(`\n📊 ${testName.toUpperCase()} Test Results:`);
    console.log('-'.repeat(40));

    const vulnerabilities = results.filter((r: any) => r.detected);
    const passed = results.length - vulnerabilities.length;
    const passRate = ((passed / results.length) * 100).toFixed(1);

    console.log(`Passed: ${passed}/${results.length} (${passRate}%)`);

    if (vulnerabilities.length > 0) {
      console.log('\n❌ Vulnerabilities Found:');
      vulnerabilities.forEach((vuln: any) => {
        console.log(`  - ${vuln.vulnerability}: ${vuln.test || vuln.field || vuln.endpoint}`);
      });
    } else {
      console.log('✅ No vulnerabilities detected');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3001';
  const specificTest = args.find(arg => !arg.startsWith('--'));

  const runner = new SecurityRunner(baseUrl);

  if (specificTest) {
    runner.runSpecificTest(specificTest);
  } else {
    runner.runSecurityScan();
  }
}

export default SecurityRunner;