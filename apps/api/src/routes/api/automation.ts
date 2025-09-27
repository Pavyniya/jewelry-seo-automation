import { Router } from 'express';
import {
  OptimizationRule,
  RuleCondition,
  RuleAction,
  RuleSchedule,
  RulePerformance,
  OptimizationTemplate,
  ApprovalRequest,
  RuleExecutionResult,
  Workflow
} from '../../../../packages/shared/src/types/automation';

const router: Router = Router();

// Mock automation rules data
let mockRules: OptimizationRule[] = [
  {
    id: '1',
    name: 'Low Traffic Jewelry Optimization',
    description: 'Automatically optimize products with traffic below threshold',
    category: 'seo',
    conditions: [
      {
        id: 'c1',
        type: 'performance',
        field: 'organicTraffic',
        operator: 'less_than',
        value: 100,
        metadata: { threshold: 100 }
      }
    ],
    actions: [
      {
        id: 'a1',
        type: 'optimize_content',
        parameters: {
          fields: ['title', 'description', 'tags'],
          targetImprovement: 0.2
        },
        approvalRequired: false
      }
    ],
    schedule: {
      type: 'recurring',
      frequency: 'weekly',
      timezone: 'UTC'
    },
    isActive: true,
    priority: 1,
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    performance: {
      executions: 12,
      successes: 11,
      failures: 1,
      averageImprovement: 0.18,
      roi: 2.4,
      lastMeasured: new Date()
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Seasonal Holiday Jewelry Pricing',
    description: 'Adjust pricing for seasonal jewelry collections',
    category: 'pricing',
    conditions: [
      {
        id: 'c2',
        type: 'temporal',
        field: 'season',
        operator: 'equals',
        value: 'holiday',
        metadata: { months: [11, 12] }
      },
      {
        id: 'c3',
        type: 'product',
        field: 'category',
        operator: 'contains',
        value: 'holiday'
      }
    ],
    actions: [
      {
        id: 'a2',
        type: 'update_pricing',
        parameters: {
          adjustment: 0.15,
          strategy: 'percentage_increase'
        },
        approvalRequired: true
      }
    ],
    schedule: {
      type: 'triggered',
      triggers: [
        {
          type: 'time',
          config: { month: 11, day: 1 }
        }
      ],
      timezone: 'UTC'
    },
    isActive: true,
    priority: 2,
    performance: {
      executions: 3,
      successes: 3,
      failures: 0,
      averageImprovement: 0.22,
      roi: 3.1,
      lastMeasured: new Date()
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Competitor Price Monitoring',
    description: 'Monitor competitor pricing and adjust accordingly',
    category: 'competitive',
    conditions: [
      {
        id: 'c4',
        type: 'competitive',
        field: 'competitorPriceDifference',
        operator: 'greater_than',
        value: 0.2,
        metadata: { threshold: 0.2 }
      }
    ],
    actions: [
      {
        id: 'a3',
        type: 'send_alert',
        parameters: {
          alertType: 'pricing',
          recipients: ['admin@ohhglam.com'],
          message: 'Competitor price difference detected'
        },
        approvalRequired: false
      }
    ],
    schedule: {
      type: 'recurring',
      frequency: 'daily',
      timezone: 'UTC'
    },
    isActive: true,
    priority: 3,
    performance: {
      executions: 45,
      successes: 45,
      failures: 0,
      averageImprovement: 0.08,
      roi: 1.2,
      lastMeasured: new Date()
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

// Mock optimization templates
const mockTemplates: OptimizationTemplate[] = [
  {
    id: 't1',
    name: 'Jewelry SEO Optimization',
    description: 'Optimize jewelry product titles, descriptions, and meta tags',
    category: 'jewelry',
    targetAudience: 'All jewelry products',
    conditions: [
      {
        id: 'tc1',
        type: 'product',
        field: 'titleLength',
        operator: 'less_than',
        value: 50
      }
    ],
    actions: [
      {
        id: 'ta1',
        type: 'optimize_content',
        parameters: {
          fields: ['title', 'description', 'metaTitle', 'metaDescription'],
          keywords: ['jewelry', 'gold', 'silver', 'pendant', 'necklace']
        },
        approvalRequired: false
      }
    ],
    schedule: {
      type: 'manual',
      timezone: 'UTC'
    },
    effectiveness: 0.85,
    usageCount: 156,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    isPopular: true
  },
  {
    id: 't2',
    name: 'Holiday Season Pricing',
    description: 'Adjust pricing for holiday season collections',
    category: 'seasonal',
    targetAudience: 'Holiday jewelry collections',
    conditions: [
      {
        id: 'tc2',
        type: 'temporal',
        field: 'month',
        operator: 'in',
        value: [11, 12]
      }
    ],
    actions: [
      {
        id: 'ta2',
        type: 'update_pricing',
        parameters: {
          adjustment: 0.15,
          strategy: 'holiday_premium'
        },
        approvalRequired: true
      }
    ],
    schedule: {
      type: 'triggered',
      triggers: [
        {
          type: 'time',
          config: { month: 11, day: 1 }
        }
      ],
      timezone: 'UTC'
    },
    effectiveness: 0.92,
    usageCount: 89,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    isPopular: true
  },
  {
    id: 't3',
    name: 'Brand Voice Consistency',
    description: 'Ensure consistent brand voice across all product content',
    category: 'brand',
    targetAudience: 'All products',
    conditions: [
      {
        id: 'tc3',
        type: 'product',
        field: 'description',
        operator: 'not_contains',
        value: 'luxury'
      }
    ],
    actions: [
      {
        id: 'ta3',
        type: 'optimize_content',
        parameters: {
          fields: ['description'],
          brandVoice: 'luxury',
          tone: 'elegant'
        },
        approvalRequired: false
      }
    ],
    schedule: {
      type: 'recurring',
      frequency: 'weekly',
      timezone: 'UTC'
    },
    effectiveness: 0.78,
    usageCount: 234,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    isPopular: false
  }
];

// Mock approval requests
let mockApprovals: ApprovalRequest[] = [
  {
    id: 'apr1',
    ruleId: '2',
    ruleName: 'Seasonal Holiday Jewelry Pricing',
    actionId: 'a2',
    actionType: 'update_pricing',
    description: 'Proposed 15% price increase for holiday collection',
    riskLevel: 'medium',
    estimatedImpact: 'Expected 22% revenue increase',
    requestedBy: 'system',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'pending'
  }
];

// Mock workflows
const mockWorkflows: Workflow[] = [
  {
    id: 'w1',
    name: 'Daily SEO Optimization',
    description: 'Comprehensive daily SEO optimization workflow',
    rules: ['1', '3'],
    dependencies: [],
    schedule: {
      type: 'recurring',
      frequency: 'daily',
      timezone: 'UTC'
    },
    status: 'active',
    performance: {
      executions: 30,
      averageDuration: 1200,
      successRate: 0.95,
      totalImprovements: 45,
      lastExecution: new Date()
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

// Rules endpoints
router.get('/rules', (req, res) => {
  const { category, status, search, sortBy } = req.query;

  let filteredRules = [...mockRules];

  if (category) {
    filteredRules = filteredRules.filter(rule => rule.category === category);
  }

  if (status) {
    filteredRules = filteredRules.filter(rule =>
      status === 'active' ? rule.isActive : !rule.isActive
    );
  }

  if (search) {
    filteredRules = filteredRules.filter(rule =>
      rule.name.toLowerCase().includes((search as string).toLowerCase()) ||
      rule.description.toLowerCase().includes((search as string).toLowerCase())
    );
  }

  // Sort by specified field
  if (sortBy) {
    filteredRules.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'performance':
          return b.performance.averageImprovement - a.performance.averageImprovement;
        case 'lastRun':
          return new Date(b.lastRun || 0).getTime() - new Date(a.lastRun || 0).getTime();
        case 'priority':
          return a.priority - b.priority;
        default:
          return 0;
      }
    });
  }

  res.json({
    success: true,
    data: filteredRules,
    total: filteredRules.length
  });
});

router.post('/rules', (req, res) => {
  const { name, description, category, conditions, actions, schedule, isActive, priority } = req.body;

  if (!name || !description || !category || !conditions || !actions || !schedule) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const newRule: OptimizationRule = {
    id: (mockRules.length + 1).toString(),
    name,
    description,
    category,
    conditions,
    actions,
    schedule,
    isActive: isActive || false,
    priority: priority || 5,
    performance: {
      executions: 0,
      successes: 0,
      failures: 0,
      averageImprovement: 0,
      roi: 0,
      lastMeasured: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  mockRules.push(newRule);

  res.json({
    success: true,
    data: newRule,
    message: 'Rule created successfully'
  });
});

router.put('/rules/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, category, conditions, actions, schedule, isActive, priority } = req.body;

  const ruleIndex = mockRules.findIndex(rule => rule.id === id);
  if (ruleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  mockRules[ruleIndex] = {
    ...mockRules[ruleIndex],
    name: name || mockRules[ruleIndex].name,
    description: description || mockRules[ruleIndex].description,
    category: category || mockRules[ruleIndex].category,
    conditions: conditions || mockRules[ruleIndex].conditions,
    actions: actions || mockRules[ruleIndex].actions,
    schedule: schedule || mockRules[ruleIndex].schedule,
    isActive: isActive !== undefined ? isActive : mockRules[ruleIndex].isActive,
    priority: priority !== undefined ? priority : mockRules[ruleIndex].priority,
    updatedAt: new Date()
  };

  res.json({
    success: true,
    data: mockRules[ruleIndex],
    message: 'Rule updated successfully'
  });
});

router.delete('/rules/:id', (req, res) => {
  const { id } = req.params;

  const ruleIndex = mockRules.findIndex(rule => rule.id === id);
  if (ruleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  mockRules.splice(ruleIndex, 1);

  res.json({
    success: true,
    message: 'Rule deleted successfully'
  });
});

router.post('/rules/:id/execute', (req, res) => {
  const { id } = req.params;

  const rule = mockRules.find(r => r.id === id);
  if (!rule) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  const executionResult: RuleExecutionResult = {
    ruleId: id,
    executionId: `exec_${Date.now()}`,
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(),
    affectedProducts: ['prod1', 'prod2', 'prod3'],
    changes: [
      {
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'Optimized Title',
        productId: 'prod1',
        timestamp: new Date()
      }
    ],
    performance: {
      improvements: { traffic: 0.15, conversions: 0.08 },
      roi: 2.1
    }
  };

  // Update rule performance
  rule.performance.executions++;
  rule.performance.successes++;
  rule.performance.lastMeasured = new Date();
  rule.lastRun = new Date();

  res.json({
    success: true,
    data: executionResult,
    message: 'Rule executed successfully'
  });
});

router.get('/rules/:id/performance', (req, res) => {
  const { id } = req.params;

  const rule = mockRules.find(r => r.id === id);
  if (!rule) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  res.json({
    success: true,
    data: rule.performance
  });
});

// Templates endpoints
router.get('/templates', (req, res) => {
  const { category, search, effectiveness, sortBy } = req.query;

  let filteredTemplates = [...mockTemplates];

  if (category) {
    filteredTemplates = filteredTemplates.filter(template => template.category === category);
  }

  if (search) {
    filteredTemplates = filteredTemplates.filter(template =>
      template.name.toLowerCase().includes((search as string).toLowerCase()) ||
      template.description.toLowerCase().includes((search as string).toLowerCase())
    );
  }

  if (effectiveness) {
    const minEffectiveness = parseFloat(effectiveness as string);
    filteredTemplates = filteredTemplates.filter(template => template.effectiveness >= minEffectiveness);
  }

  if (sortBy) {
    filteredTemplates.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'effectiveness':
          return b.effectiveness - a.effectiveness;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }

  res.json({
    success: true,
    data: filteredTemplates,
    total: filteredTemplates.length
  });
});

// Approval endpoints
router.get('/approvals', (req, res) => {
  const { status } = req.query;

  let filteredApprovals = [...mockApprovals];

  if (status) {
    filteredApprovals = filteredApprovals.filter(approval => approval.status === status);
  }

  res.json({
    success: true,
    data: filteredApprovals,
    total: filteredApprovals.length
  });
});

router.post('/approvals/:id/approve', (req, res) => {
  const { id } = req.params;
  const { reviewedBy } = req.body;

  const approval = mockApprovals.find(a => a.id === id);
  if (!approval) {
    return res.status(404).json({
      success: false,
      error: 'Approval request not found'
    });
  }

  approval.status = 'approved';
  approval.reviewedBy = reviewedBy || 'admin';
  approval.reviewedAt = new Date();

  res.json({
    success: true,
    data: approval,
    message: 'Approval request approved successfully'
  });
});

router.post('/approvals/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reviewedBy, rejectionReason } = req.body;

  const approval = mockApprovals.find(a => a.id === id);
  if (!approval) {
    return res.status(404).json({
      success: false,
      error: 'Approval request not found'
    });
  }

  approval.status = 'rejected';
  approval.reviewedBy = reviewedBy || 'admin';
  approval.reviewedAt = new Date();
  approval.rejectionReason = rejectionReason || 'Rejected';

  res.json({
    success: true,
    data: approval,
    message: 'Approval request rejected successfully'
  });
});

// Workflows endpoints
router.get('/workflows', (req, res) => {
  res.json({
    success: true,
    data: mockWorkflows,
    total: mockWorkflows.length
  });
});

router.post('/workflows', (req, res) => {
  const { name, description, rules, dependencies, schedule } = req.body;

  const newWorkflow: Workflow = {
    id: (mockWorkflows.length + 1).toString(),
    name,
    description,
    rules: rules || [],
    dependencies: dependencies || [],
    schedule: schedule || { type: 'manual', timezone: 'UTC' },
    status: 'draft',
    performance: {
      executions: 0,
      averageDuration: 0,
      successRate: 0,
      totalImprovements: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  mockWorkflows.push(newWorkflow);

  res.json({
    success: true,
    data: newWorkflow,
    message: 'Workflow created successfully'
  });
});

export default router;