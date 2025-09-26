import request from 'supertest';
import express from 'express';
import backupRouter from '../backup';
import { database } from '../../../utils/database';

const app = express();
app.use('/backup', backupRouter);

describe('Backup API', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  it('should return a JSON file on GET /backup/export', async () => {
    const response = await request(app).get('/backup/export');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['content-disposition']).toMatch(/attachment; filename=backup.json/);
    expect(response.body).toBeInstanceOf(Object);
  });
});