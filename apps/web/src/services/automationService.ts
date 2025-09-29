
import axios from 'axios';
import { OptimizationRule } from 'packages/shared/src/types/automation';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRules = async (): Promise<OptimizationRule[]> => {
  const response = await apiClient.get('/automation/rules');
  return response.data.data;
};

export const createRule = async (rule: OptimizationRule): Promise<OptimizationRule> => {
  const response = await apiClient.post('/automation/rules', rule);
  return response.data.data;
};

export const executeRule = async (ruleId: string): Promise<void> => {
  await apiClient.post(`/automation/rules/${ruleId}/execute`, {});
};

export const deleteRule = async (ruleId: string): Promise<void> => {
  await apiClient.delete(`/automation/rules/${ruleId}`);
};

export const getPerformance = async () => {
  const response = await apiClient.get('/automation/performance');
  return response.data.data;
};

export const getApprovalQueue = async () => {
  const response = await apiClient.get('/automation/approval-queue');
  return response.data.data;
};
