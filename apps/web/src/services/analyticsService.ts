
import axios from 'axios';
import { SeoMetrics, CompetitorAnalysis, ContentQualityScore, TrendAnalysis } from 'packages/shared/src/types/analytics';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSeoMetrics = async (): Promise<SeoMetrics[]> => {
  const response = await apiClient.get('/analytics/seo');
  return response.data.data;
};

export const getCompetitorAnalysis = async (): Promise<CompetitorAnalysis[]> => {
  const response = await apiClient.get('/analytics/competitors');
  return response.data.data;
};

export const getContentQualityScores = async (): Promise<ContentQualityScore[]> => {
  const response = await apiClient.get('/analytics/quality-scores');
  return response.data.data;
};

export const getTrendAnalysis = async (): Promise<TrendAnalysis[]> => {
  const response = await apiClient.get('/analytics/trends');
  return response.data.data;
};
