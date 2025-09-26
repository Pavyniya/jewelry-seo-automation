import { Router } from 'express';
import { aiProviderRepository } from '../../repositories/aiProviderRepository';
import { aiService } from '../../services/aiService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const providers = await aiProviderRepository.findAll();
    return res.json(providers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch AI providers.' });
  }
});

router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { isEnabled } = req.body;

  if (typeof isEnabled !== 'boolean') {
    return res.status(400).json({ error: 'isEnabled must be a boolean.' });
  }

  try {
    await aiProviderRepository.toggle(id, isEnabled);
    await aiService.reloadProviders(); // Reload providers in the service
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle provider status.' });
  }
});

export default router;
