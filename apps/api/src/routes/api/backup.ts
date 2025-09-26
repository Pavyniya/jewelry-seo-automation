import { Router } from 'express';
import { database } from '../../utils/database';

const router = Router();

router.get('/export', async (req, res) => {
  try {
    const tables = await database.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const backup: { [key: string]: any[] } = {};

    for (const table of tables) {
      const tableName = table.name;
      backup[tableName] = await database.all(`SELECT * FROM ${tableName}`);
    }

    res.setHeader('Content-disposition', 'attachment; filename=backup.json');
    res.setHeader('Content-type', 'application/json');
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export database.' });
  }
});

export default router;
