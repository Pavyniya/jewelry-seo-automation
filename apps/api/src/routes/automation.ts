
import { Router } from 'express';

const router = Router();

router.get('/rules', (req, res) => {
  res.json([]);
});

router.post('/rules', (req, res) => {
  res.json(req.body);
});

router.post('/rules/:id/execute', (req, res) => {
  res.sendStatus(200);
});

router.delete('/rules/:id', (req, res) => {
  res.sendStatus(204);
});

export default router;
