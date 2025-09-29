
import { ContentQualityScore } from 'packages/shared/src/types/analytics';

/**
 * Calculates the overall SEO score based on various metrics.
 * This is a placeholder and can be replaced with a more complex algorithm.
 */
export const calculateOverallSeoScore = (score: ContentQualityScore): number => {
  const weights = {
    seoScore: 0.4,
    readabilityScore: 0.2,
    brandVoiceScore: 0.2,
    uniquenessScore: 0.1,
    keywordOptimization: 0.1,
  };

  const overallScore = 
    score.seoScore * weights.seoScore +
    score.readabilityScore * weights.readabilityScore +
    score.brandVoiceScore * weights.brandVoiceScore +
    score.uniquenessScore * weights.uniquenessScore +
    score.keywordOptimization * weights.keywordOptimization;

  return Math.round(overallScore);
};
