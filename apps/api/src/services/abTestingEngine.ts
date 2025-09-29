import {
  ABTest,
  TestVariant,
  TestAudience,
  TestMetric,
  TestResult,
  PersonalizedContentVariant,
  CustomerSegment,
  JourneyStage
} from '@jewelry-seo/shared/types/contentStrategy';
import { database } from '../utils/database';
import { personalizationEngine } from './personalizationEngine';

export interface TestAssignment {
  testId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface TestImpression {
  id: string;
  testId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  type: 'view' | 'click' | 'conversion';
  value?: number;
  metadata?: Record<string, any>;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidence: number;
  pValue: number;
  marginOfError: number;
  sampleSize: number;
  power: number;
}

export class ABTestingEngine {
  private activeTests: Map<string, ABTest> = new Map();
  private testAssignments: Map<string, TestAssignment> = new Map();
  private testResults: Map<string, TestResult[]> = new Map();
  private userTestHistory: Map<string, string[]> = new Map();

  constructor() {
    this.loadActiveTests();
    this.startResultProcessing();
  }

  async createTest(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'results'>): Promise<ABTest> {
    try {
      const test: ABTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...testData,
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      };

      // Validate test configuration
      this.validateTestConfiguration(test);

      // Store test in database
      await this.storeTest(test);

      // Add to active tests
      this.activeTests.set(test.id, test);

      return test;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw new Error('Failed to create A/B test');
    }
  }

  private validateTestConfiguration(test: ABTest): void {
    // Validate variants
    if (test.variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }

    // Validate traffic allocation
    const totalAllocation = test.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (totalAllocation !== 100) {
      throw new Error('Total traffic allocation must equal 100%');
    }

    // Validate that at least one variant is active
    if (!test.variants.some(v => v.isActive)) {
      throw new Error('At least one variant must be active');
    }

    // Validate metrics
    if (test.metrics.length === 0) {
      throw new Error('Test must have at least one metric');
    }

    // Validate that there's exactly one primary metric
    const primaryMetrics = test.metrics.filter(m => m.type === 'primary');
    if (primaryMetrics.length !== 1) {
      throw new Error('Test must have exactly one primary metric');
    }

    // Validate audience criteria
    if (test.targetAudience.sampleSize < 100) {
      throw new Error('Sample size must be at least 100');
    }

    // Validate duration
    if (test.targetAudience.duration < 24) {
      throw new Error('Test duration must be at least 24 hours');
    }
  }

  private async storeTest(test: ABTest): Promise<void> {
    try {
      await database.all(
        `INSERT INTO ab_tests
         (id, name, description, variants, target_audience, metrics, status,
          significance, start_date, end_date, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          test.id,
          test.name,
          test.description,
          JSON.stringify(test.variants),
          JSON.stringify(test.targetAudience),
          JSON.stringify(test.metrics),
          test.status,
          test.significance,
          test.startDate?.toISOString(),
          test.endDate?.toISOString(),
          test.createdBy,
          test.createdAt.toISOString(),
          test.updatedAt.toISOString()
        ]
      );
    } catch (error) {
      console.error('Error storing test:', error);
      throw error;
    }
  }

  async getTest(testId: string): Promise<ABTest | null> {
    try {
      // Check active tests first
      if (this.activeTests.has(testId)) {
        return this.activeTests.get(testId)!;
      }

      // Load from database
      const testData = await database.all(
        'SELECT * FROM ab_tests WHERE id = ?',
        [testId]
      );

      if (testData.length > 0) {
        const test = this.parseTestFromDatabase(testData[0]);
        this.activeTests.set(testId, test);
        return test;
      }

      return null;
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  private parseTestFromDatabase(data: any): ABTest {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      variants: JSON.parse(data.variants || '[]'),
      targetAudience: JSON.parse(data.target_audience || '{}'),
      metrics: JSON.parse(data.metrics || '[]'),
      status: data.status,
      winner: data.winner,
      significance: data.significance,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      results: JSON.parse(data.results || '[]'),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by
    };
  }

  async getActiveTests(): Promise<ABTest[]> {
    try {
      const activeTests = await database.all(
        `SELECT * FROM ab_tests
         WHERE status = 'running'
         ORDER BY created_at DESC`
      );

      return activeTests.map(data => this.parseTestFromDatabase(data));
    } catch (error) {
      console.error('Error getting active tests:', error);
      return [];
    }
  }

  async assignVariant(
    testId: string,
    userId?: string,
    sessionId?: string
  ): Promise<TestVariant | null> {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== 'running') {
        return null;
      }

      // Check if user is already assigned
      const assignment = await this.getExistingAssignment(testId, userId, sessionId);
      if (assignment) {
        return test.variants.find(v => v.id === assignment.variantId) || null;
      }

      // Check if user meets audience criteria
      if (!(await this.userMeetsAudienceCriteria(test, userId, sessionId))) {
        return null;
      }

      // Assign variant based on traffic allocation
      const variant = this.selectVariant(test);

      // Store assignment
      await this.storeAssignment({
        testId,
        variantId: variant.id,
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        assignedAt: new Date(),
        expiresAt: this.calculateAssignmentExpiry(test)
      });

      return variant;
    } catch (error) {
      console.error('Error assigning variant:', error);
      return null;
    }
  }

  private async getExistingAssignment(
    testId: string,
    userId?: string,
    sessionId?: string
  ): Promise<TestAssignment | null> {
    try {
      const key = userId || sessionId;
      if (!key) return null;

      const assignmentData = await database.all(
        `SELECT * FROM test_assignments
         WHERE test_id = ? AND (user_id = ? OR session_id = ?)
         ORDER BY assigned_at DESC
         LIMIT 1`,
        [testId, userId, sessionId]
      );

      if (assignmentData.length > 0) {
        const assignment = assignmentData[0];

        // Check if assignment is still valid
        if (assignment.expires_at && new Date(assignment.expires_at) > new Date()) {
          return {
            testId: assignment.test_id,
            variantId: assignment.variant_id,
            userId: assignment.user_id,
            sessionId: assignment.session_id,
            assignedAt: new Date(assignment.assigned_at),
            expiresAt: assignment.expires_at ? new Date(assignment.expires_at) : undefined
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting existing assignment:', error);
      return null;
    }
  }

  private async userMeetsAudienceCriteria(
    test: ABTest,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      const audience = test.targetAudience;

      // Check if user has participated in too many similar tests
      if (userId && !(await this.checkTestHistory(userId, test))) {
        return false;
      }

      // Check segment criteria
      if (audience.segments.length > 0) {
        const userSegments = await this.getUserSegments(userId, sessionId);
        if (!audience.segments.some(segment => userSegments.includes(segment))) {
          return false;
        }
      }

      // Check custom criteria
      if (audience.criteria.length > 0) {
        if (!(await this.evaluateCriteria(audience.criteria, userId, sessionId))) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking audience criteria:', error);
      return false;
    }
  }

  private async checkTestHistory(userId: string, test: ABTest): Promise<boolean> {
    try {
      // Get user's recent test history
      const historyData = await database.all(
        `SELECT test_id FROM test_assignments
         WHERE user_id = ?
         AND assigned_at > ?
         LIMIT 10`,
        [userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()]
      );

      const recentTests = historyData.map(row => row.test_id);

      // Don't allow user to participate in too many similar tests
      const similarTests = Array.from(this.activeTests.values()).filter(t =>
        t.id !== test.id &&
        recentTests.includes(t.id) &&
        this.areTestsSimilar(test, t)
      );

      return similarTests.length < 3;
    } catch (error) {
      console.error('Error checking test history:', error);
      return false;
    }
  }

  private areTestsSimilar(test1: ABTest, test2: ABTest): boolean {
    // Simple similarity check based on metrics and audience
    const metricSimilarity = test1.metrics.some(m1 =>
      test2.metrics.some(m2 => m1.name === m2.name)
    );

    const audienceSimilarity = test1.targetAudience.segments.some(s1 =>
      test2.targetAudience.segments.includes(s1)
    );

    return metricSimilarity || audienceSimilarity;
  }

  private async getUserSegments(userId?: string, sessionId?: string): Promise<CustomerSegment[]> {
    try {
      if (!userId) {
        return ['new_visitor'];
      }

      // Get user segments from behavior analytics
      // This would integrate with the behavior analytics service
      const segmentsData = await database.all(
        'SELECT segmentation FROM customer_behavior WHERE customer_id = ?',
        [userId]
      );

      if (segmentsData.length > 0) {
        return JSON.parse(segmentsData[0].segmentation || '[]');
      }

      return ['new_visitor'];
    } catch (error) {
      console.error('Error getting user segments:', error);
      return ['new_visitor'];
    }
  }

  private async evaluateCriteria(
    criteria: any[],
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      // Evaluate custom criteria
      for (const criterion of criteria) {
        if (!(await this.evaluateCriterion(criterion, userId, sessionId))) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating criteria:', error);
      return false;
    }
  }

  private async evaluateCriterion(
    criterion: any,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    // Implement criterion evaluation logic
    // This would integrate with various data sources
    switch (criterion.field) {
      case 'total_purchases':
        return await this.checkTotalPurchases(userId, criterion.value, criterion.operator);
      case 'session_count':
        return await this.checkSessionCount(sessionId, criterion.value, criterion.operator);
      case 'last_visit':
        return await this.checkLastVisit(userId, sessionId, criterion.value, criterion.operator);
      default:
        return true;
    }
  }

  private async checkTotalPurchases(
    userId: string,
    value: number,
    operator: string
  ): Promise<boolean> {
    try {
      const purchaseData = await database.all(
        'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?',
        [userId]
      );

      const count = purchaseData[0]?.count || 0;

      switch (operator) {
        case 'greater_than':
          return count > value;
        case 'less_than':
          return count < value;
        case 'equals':
          return count === value;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking total purchases:', error);
      return false;
    }
  }

  private async checkSessionCount(
    sessionId: string,
    value: number,
    operator: string
  ): Promise<boolean> {
    // Implement session count checking
    return true; // Placeholder
  }

  private async checkLastVisit(
    userId: string,
    sessionId: string,
    value: number,
    operator: string
  ): Promise<boolean> {
    // Implement last visit checking
    return true; // Placeholder
  }

  private selectVariant(test: ABTest): TestVariant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      if (!variant.isActive) continue;

      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to first active variant
    return test.variants.find(v => v.isActive) || test.variants[0];
  }

  private calculateAssignmentExpiry(test: ABTest): Date {
    const duration = test.targetAudience.duration * 60 * 60 * 1000; // Convert hours to milliseconds
    return new Date(Date.now() + duration);
  }

  private async storeAssignment(assignment: TestAssignment): Promise<void> {
    try {
      await database.all(
        `INSERT INTO test_assignments
         (test_id, variant_id, user_id, session_id, assigned_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          assignment.testId,
          assignment.variantId,
          assignment.userId,
          assignment.sessionId,
          assignment.assignedAt.toISOString(),
          assignment.expiresAt?.toISOString()
        ]
      );
    } catch (error) {
      console.error('Error storing assignment:', error);
      throw error;
    }
  }

  async recordImpression(
    testId: string,
    variantId: string,
    type: TestImpression['type'],
    userId?: string,
    sessionId?: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const impression: TestImpression = {
        id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testId,
        variantId,
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        timestamp: new Date(),
        type,
        value,
        metadata
      };

      // Store impression
      await this.storeImpression(impression);

      // Update test results cache
      await this.updateTestResults(testId, impression);
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  }

  private async storeImpression(impression: TestImpression): Promise<void> {
    try {
      await database.all(
        `INSERT INTO test_impressions
         (id, test_id, variant_id, user_id, session_id, timestamp, type, value, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          impression.id,
          impression.testId,
          impression.variantId,
          impression.userId,
          impression.sessionId,
          impression.timestamp.toISOString(),
          impression.type,
          impression.value,
          JSON.stringify(impression.metadata)
        ]
      );
    } catch (error) {
      console.error('Error storing impression:', error);
      throw error;
    }
  }

  private async updateTestResults(testId: string, impression: TestImpression): Promise<void> {
    try {
      if (!this.testResults.has(testId)) {
        this.testResults.set(testId, []);
      }

      // Update cached results
      const results = this.testResults.get(testId)!;
      const existingResult = results.find(r => r.variantId === impression.variantId && r.metricName === impression.type);

      if (existingResult) {
        // Update existing result
        existingResult.sampleSize++;
        if (impression.value !== undefined) {
          existingResult.value = (existingResult.value * (existingResult.sampleSize - 1) + impression.value) / existingResult.sampleSize;
        }
      } else {
        // Create new result
        results.push({
          variantId: impression.variantId,
          metricName: impression.type,
          value: impression.value || 1,
          confidence: 0.5,
          isSignificant: false,
          pValue: 1,
          sampleSize: 1
        });
      }

      // Check for statistical significance
      await this.calculateStatisticalSignificance(testId);
    } catch (error) {
      console.error('Error updating test results:', error);
    }
  }

  private async calculateStatisticalSignificance(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) return;

      const results = this.testResults.get(testId) || [];
      const primaryMetric = test.metrics.find(m => m.type === 'primary');
      if (!primaryMetric) return;

      // Group results by variant
      const variantResults = new Map<string, TestResult[]>();
      results.forEach(result => {
        if (!variantResults.has(result.variantId)) {
          variantResults.set(result.variantId, []);
        }
        variantResults.get(result.variantId)!.push(result);
      });

      // Calculate significance for each variant vs control
      const variants = Array.from(variantResults.keys());
      if (variants.length < 2) return;

      const controlVariant = variants[0]; // Assume first variant is control
      const treatmentVariants = variants.slice(1);

      for (const treatmentVariant of treatmentVariants) {
        const controlData = variantResults.get(controlVariant)!.find(r => r.metricName === primaryMetric.name);
        const treatmentData = variantResults.get(treatmentVariant)!.find(r => r.metricName === primaryMetric.name);

        if (controlData && treatmentData) {
          const significance = this.calculateZTest(controlData, treatmentData);

          // Update results with significance data
          const treatmentResult = results.find(r =>
            r.variantId === treatmentVariant && r.metricName === primaryMetric.name
          );

          if (treatmentResult) {
            treatmentResult.confidence = significance.confidence;
            treatmentResult.isSignificant = significance.isSignificant;
            treatmentResult.pValue = significance.pValue;
          }
        }
      }

      // Check if test should be ended
      await this.checkTestCompletion(test);
    } catch (error) {
      console.error('Error calculating statistical significance:', error);
    }
  }

  private calculateZTest(control: TestResult, treatment: TestResult): StatisticalSignificance {
    // Implement Z-test for statistical significance
    const controlRate = control.value;
    const treatmentRate = treatment.value;
    const controlSize = control.sampleSize;
    const treatmentSize = treatment.sampleSize;

    const pooledRate = (controlSize * controlRate + treatmentSize * treatmentRate) / (controlSize + treatmentSize);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlSize + 1 / treatmentSize));
    const zScore = (treatmentRate - controlRate) / standardError;

    // Calculate p-value from z-score (simplified)
    const pValue = 2 * (1 - this.cumulativeNormalDistribution(Math.abs(zScore)));

    return {
      isSignificant: pValue < 0.05, // 95% confidence
      confidence: 1 - pValue,
      pValue,
      marginOfError: 1.96 * standardError,
      sampleSize: controlSize + treatmentSize,
      power: this.calculateStatisticalPower(controlRate, treatmentRate, controlSize, treatmentSize)
    };
  }

  private cumulativeNormalDistribution(z: number): number {
    // Approximation of cumulative normal distribution
    return 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  }

  private calculateStatisticalPower(
    controlRate: number,
    treatmentRate: number,
    controlSize: number,
    treatmentSize: number
  ): number {
    // Simplified power calculation
    const effectSize = Math.abs(treatmentRate - controlRate);
    const n = Math.min(controlSize, treatmentSize);
    return Math.min(effectSize * Math.sqrt(n) / 2, 1);
  }

  private async checkTestCompletion(test: ABTest): Promise<void> {
    try {
      const results = this.testResults.get(test.id) || [];
      const primaryMetric = test.metrics.find(m => m.type === 'primary');
      if (!primaryMetric) return;

      // Check if we have enough data
      const totalSampleSize = results.reduce((sum, r) => sum + r.sampleSize, 0);
      if (totalSampleSize < test.targetAudience.sampleSize) {
        return;
      }

      // Check if test has run long enough
      if (test.startDate) {
        const duration = Date.now() - test.startDate.getTime();
        const minDuration = test.targetAudience.duration * 60 * 60 * 1000;
        if (duration < minDuration) {
          return;
        }
      }

      // Check if we have a statistically significant winner
      const significantResults = results.filter(r => r.isSignificant && r.metricName === primaryMetric.name);
      if (significantResults.length > 0) {
        // Find the winning variant
        const winner = this.findWinningVariant(test, significantResults);

        // End the test
        await this.endTest(test.id, winner);
      }
    } catch (error) {
      console.error('Error checking test completion:', error);
    }
  }

  private findWinningVariant(test: ABTest, significantResults: TestResult[]): string {
    // Find variant with best performance
    const variantPerformance = new Map<string, number>();

    significantResults.forEach(result => {
      const currentPerf = variantPerformance.get(result.variantId) || 0;
      variantPerformance.set(result.variantId, Math.max(currentPerf, result.value));
    });

    let bestVariant = '';
    let bestPerformance = -1;

    for (const [variantId, performance] of variantPerformance.entries()) {
      if (performance > bestPerformance) {
        bestPerformance = performance;
        bestVariant = variantId;
      }
    }

    return bestVariant;
  }

  private async endTest(testId: string, winner?: string): Promise<void> {
    try {
      await database.all(
        `UPDATE ab_tests
         SET status = 'completed', winner = ?, end_date = ?
         WHERE id = ?`,
        [winner, new Date().toISOString(), testId]
      );

      // Remove from active tests
      this.activeTests.delete(testId);

      console.log(`Test ${testId} ended. Winner: ${winner || 'No winner determined'}`);
    } catch (error) {
      console.error('Error ending test:', error);
    }
  }

  async getTestResults(testId: string): Promise<TestResult[]> {
    try {
      const results = await database.all(
        `SELECT variant_id, metric_name, COUNT(*) as sample_size,
                AVG(value) as value, AVG(confidence) as confidence,
                AVG(CASE WHEN is_significant = 1 THEN 1 ELSE 0 END) as is_significant,
                AVG(p_value) as p_value
         FROM test_impressions
         WHERE test_id = ?
         GROUP BY variant_id, metric_name`,
        [testId]
      );

      return results.map(row => ({
        variantId: row.variant_id,
        metricName: row.metric_name,
        value: row.value,
        confidence: row.confidence,
        isSignificant: row.is_significant > 0.5,
        pValue: row.p_value,
        sampleSize: row.sample_size
      }));
    } catch (error) {
      console.error('Error getting test results:', error);
      return [];
    }
  }

  async getTestSummary(testId: string): Promise<any> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const results = await this.getTestResults(testId);
      const impressions = await this.getTestImpressions(testId);

      return {
        test,
        results,
        summary: {
          totalImpressions: impressions.length,
          totalConversions: impressions.filter(i => i.type === 'conversion').length,
          totalClicks: impressions.filter(i => i.type === 'click').length,
          uniqueUsers: new Set(impressions.map(i => i.userId).filter(Boolean)).size,
          conversionRate: this.calculateConversionRate(impressions),
          clickThroughRate: this.calculateCTR(impressions),
          variantPerformance: this.calculateVariantPerformance(results)
        }
      };
    } catch (error) {
      console.error('Error getting test summary:', error);
      throw new Error('Failed to get test summary');
    }
  }

  private async getTestImpressions(testId: string): Promise<TestImpression[]> {
    try {
      const impressionsData = await database.all(
        'SELECT * FROM test_impressions WHERE test_id = ? ORDER BY timestamp DESC',
        [testId]
      );

      return impressionsData.map(row => ({
        id: row.id,
        testId: row.test_id,
        variantId: row.variant_id,
        userId: row.user_id,
        sessionId: row.session_id,
        timestamp: new Date(row.timestamp),
        type: row.type,
        value: row.value,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error getting test impressions:', error);
      return [];
    }
  }

  private calculateConversionRate(impressions: TestImpression[]): number {
    const views = impressions.filter(i => i.type === 'view').length;
    const conversions = impressions.filter(i => i.type === 'conversion').length;

    return views > 0 ? conversions / views : 0;
  }

  private calculateCTR(impressions: TestImpression[]): number {
    const views = impressions.filter(i => i.type === 'view').length;
    const clicks = impressions.filter(i => i.type === 'click').length;

    return views > 0 ? clicks / views : 0;
  }

  private calculateVariantPerformance(results: TestResult[]): Record<string, any> {
    const performance: Record<string, any> = {};

    const variants = [...new Set(results.map(r => r.variantId))];

    variants.forEach(variantId => {
      const variantResults = results.filter(r => r.variantId === variantId);
      performance[variantId] = {
        conversionRate: this.getMetricValue(variantResults, 'conversion'),
        clickThroughRate: this.getMetricValue(variantResults, 'click'),
        averageValue: this.getMetricValue(variantResults, 'value'),
        totalSampleSize: variantResults.reduce((sum, r) => sum + r.sampleSize, 0)
      };
    });

    return performance;
  }

  private getMetricValue(results: TestResult[], metricName: string): number {
    const result = results.find(r => r.metricName === metricName);
    return result ? result.value : 0;
  }

  async createPersonalizedTest(
    productId: string,
    userId?: string,
    sessionId?: string
  ): Promise<ABTest> {
    try {
      // Get personalized content variants
      const personalizationResponse = await personalizationEngine.getPersonalizedContent(
        productId,
        userId,
        sessionId
      );

      // Create A/B test with personalized variants
      const testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'results'> = {
        name: `Personalized Content Test - ${productId}`,
        description: `A/B test for personalized content variants on product ${productId}`,
        variants: this.createVariantsFromPersonalization(personalizationResponse),
        targetAudience: {
          segments: personalizationResponse.personalizedContent.targetAudience,
          criteria: [],
          sampleSize: 1000,
          duration: 168 // 1 week
        },
        metrics: [
          {
            name: 'conversion',
            type: 'primary',
            calculation: 'conversions / views',
            target: 0.05
          },
          {
            name: 'click_through_rate',
            type: 'secondary',
            calculation: 'clicks / views',
            target: 0.1
          }
        ],
        status: 'draft',
        significance: 0.95
      };

      return await this.createTest(testData);
    } catch (error) {
      console.error('Error creating personalized test:', error);
      throw new Error('Failed to create personalized test');
    }
  }

  private createVariantsFromPersonalization(response: any): TestVariant[] {
    const variants: TestVariant[] = [];

    // Add main personalized variant
    variants.push({
      id: `variant_${Date.now()}_1`,
      name: 'Personalized Content',
      content: response.personalizedContent,
      trafficAllocation: 50,
      isActive: true
    });

    // Add alternatives
    response.alternatives.slice(0, 2).forEach((alt: any, index: number) => {
      variants.push({
        id: `variant_${Date.now()}_${index + 2}`,
        name: `Alternative ${index + 1}`,
        content: alt,
        trafficAllocation: 25,
        isActive: true
      });
    });

    // Ensure total allocation is 100%
    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (totalAllocation < 100) {
      variants[0].trafficAllocation += 100 - totalAllocation;
    }

    return variants;
  }

  private async loadActiveTests(): Promise<void> {
    try {
      const activeTests = await this.getActiveTests();
      activeTests.forEach(test => {
        this.activeTests.set(test.id, test);
      });
    } catch (error) {
      console.error('Error loading active tests:', error);
    }
  }

  private startResultProcessing(): void {
    // Process results every 5 minutes
    setInterval(() => {
      this.processAllTestResults();
    }, 300000);
  }

  private async processAllTestResults(): Promise<void> {
    try {
      for (const testId of this.activeTests.keys()) {
        await this.processTestResults(testId);
      }
    } catch (error) {
      console.error('Error processing test results:', error);
    }
  }

  private async processTestResults(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== 'running') return;

      // Load recent impressions
      const impressions = await this.getTestImpressions(testId);
      const recentImpressions = impressions.filter(i =>
        new Date(i.timestamp).getTime() > Date.now() - 5 * 60 * 1000
      );

      // Update results with recent impressions
      for (const impression of recentImpressions) {
        await this.updateTestResults(testId, impression);
      }

      // Check for statistical significance
      await this.calculateStatisticalSignificance(testId);

      // Check if test should be completed
      await this.checkTestCompletion(test);
    } catch (error) {
      console.error('Error processing test results:', error);
    }
  }

  // Public API methods
  async pauseTest(testId: string): Promise<void> {
    try {
      await database.all(
        'UPDATE ab_tests SET status = ? WHERE id = ?',
        ['paused', testId]
      );

      const test = this.activeTests.get(testId);
      if (test) {
        test.status = 'paused';
        test.updatedAt = new Date();
      }
    } catch (error) {
      console.error('Error pausing test:', error);
      throw new Error('Failed to pause test');
    }
  }

  async resumeTest(testId: string): Promise<void> {
    try {
      await database.all(
        'UPDATE ab_tests SET status = ? WHERE id = ?',
        ['running', testId]
      );

      const test = this.activeTests.get(testId);
      if (test) {
        test.status = 'running';
        test.updatedAt = new Date();
      }
    } catch (error) {
      console.error('Error resuming test:', error);
      throw new Error('Failed to resume test');
    }
  }

  async deleteTest(testId: string): Promise<void> {
    try {
      await database.all('DELETE FROM ab_tests WHERE id = ?', [testId]);
      this.activeTests.delete(testId);
      this.testResults.delete(testId);
    } catch (error) {
      console.error('Error deleting test:', error);
      throw new Error('Failed to delete test');
    }
  }

  async getTestHistory(userId?: string, limit: number = 10): Promise<ABTest[]> {
    try {
      if (!userId) return [];

      const userTests = await database.all(
        `SELECT DISTINCT t.* FROM ab_tests t
         JOIN test_assignments ta ON t.id = ta.test_id
         WHERE ta.user_id = ?
         ORDER BY ta.assigned_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return userTests.map(data => this.parseTestFromDatabase(data));
    } catch (error) {
      console.error('Error getting test history:', error);
      return [];
    }
  }

  async getTestStats(): Promise<any> {
    try {
      const allTests = await database.all(
        'SELECT status, COUNT(*) as count FROM ab_tests GROUP BY status'
      );

      const totalImpressions = await database.all(
        'SELECT COUNT(*) as count FROM test_impressions'
      );

      const totalAssignments = await database.all(
        'SELECT COUNT(*) as count FROM test_assignments'
      );

      return {
        testStatus: allTests.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {} as Record<string, number>),
        totalImpressions: totalImpressions[0]?.count || 0,
        totalAssignments: totalAssignments[0]?.count || 0,
        activeTests: this.activeTests.size
      };
    } catch (error) {
      console.error('Error getting test stats:', error);
      throw new Error('Failed to get test stats');
    }
  }
}

export const abTestingEngine = new ABTestingEngine();