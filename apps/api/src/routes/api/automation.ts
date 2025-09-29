import { Router } from 'express';
import { database } from '../../utils/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/rules', async (req, res) => {
  try {
    const rules = await database.all('SELECT * FROM optimization_rules');
    res.json({
      success: true,
      data: rules.map(rule => ({...rule, conditions: JSON.parse(rule.conditions), actions: JSON.parse(rule.actions), schedule: JSON.parse(rule.schedule), performance: JSON.parse(rule.performance)}))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch optimization rules' });
  }
});

router.post('/rules', async (req, res) => {
    const { name, description, category, conditions, actions, schedule, isActive, priority } = req.body;
    const newRule = {
        id: uuidv4(),
        name,
        description,
        category,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
        schedule: JSON.stringify(schedule),
        isActive,
        priority,
        lastRun: null,
        nextRun: null,
        performance: JSON.stringify({ executions: 0, successes: 0, failures: 0, averageImprovement: 0, roi: 0, lastMeasured: new Date() }),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
  try {
    await database.run('INSERT INTO optimization_rules (id, name, description, category, conditions, actions, schedule, isActive, priority, lastRun, nextRun, performance, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [newRule.id, newRule.name, newRule.description, newRule.category, newRule.conditions, newRule.actions, newRule.schedule, newRule.isActive, newRule.priority, newRule.lastRun, newRule.nextRun, newRule.performance, newRule.createdAt, newRule.updatedAt]);
    res.json(newRule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create optimization rule' });
  }
});

router.post('/rules/:id/execute', async (req, res) => {
    // Placeholder for rule execution logic
  res.sendStatus(200);
});

router.delete('/rules/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await database.run('DELETE FROM optimization_rules WHERE id = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete optimization rule' });
    }
});

// Add missing endpoints that frontend expects
router.get('/performance', async (req, res) => {
  try {
    const performance = await database.all('SELECT * FROM rule_performance');
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch performance data' });
  }
});

router.get('/approval-queue', async (req, res) => {
  try {
    const approvals = await database.all('SELECT * FROM approval_queue');
    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch approval queue' });
  }
});

export default router;