import React from 'react';
import { render, screen } from '@testing-library/react';
import { CostAnalysis } from '../CostAnalysis';
import { CostOptimization } from '@jewelry-seo/shared/types/aiProvider';

describe('CostAnalysis', () => {
  const mockCostData: CostOptimization = {
    strategy: 'balanced',
    currentSavings: 0.025,
    potentialSavings: 0.15,
    providerRecommendations: [
      {
        provider: 'claude-3',
        recommendedFor: ['creative_content', 'brand_content'],
        expectedSavings: 0.08,
        confidence: 0.85,
        reasoning: 'Current efficiency is 65%, optimization could save 20%'
      },
      {
        provider: 'gpt-4',
        recommendedFor: ['technical_content'],
        expectedSavings: 0.07,
        confidence: 0.75,
        reasoning: 'High cost for technical content could be optimized'
      }
    ],
    usagePatterns: [
      {
        contentType: 'product_description',
        averageTokens: 850,
        preferredProviders: ['gemini-pro', 'claude-3'],
        costEfficiency: 0.92,
        successRate: 96.5
      },
      {
        contentType: 'seo_title',
        averageTokens: 120,
        preferredProviders: ['gemini-pro'],
        costEfficiency: 0.88,
        successRate: 98.2
      }
    ],
    lastOptimized: new Date()
  };

  it('should render cost analysis component', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText(/Cost Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimization Strategy/i)).toBeInTheDocument();
  });

  it('should display current optimization strategy', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('balanced')).toBeInTheDocument();
  });

  it('should show current and potential savings', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('$0.025')).toBeInTheDocument(); // Current savings
    expect(screen.getByText('$0.150')).toBeInTheDocument(); // Potential savings
  });

  it('should display provider recommendations', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('claude-3')).toBeInTheDocument();
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
    expect(screen.getByText('$0.080')).toBeInTheDocument(); // Claude savings
    expect(screen.getByText('$0.070')).toBeInTheDocument(); // GPT-4 savings
  });

  it('should show recommendation confidence levels', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('85%')).toBeInTheDocument(); // Claude confidence
    expect(screen.getByText('75%')).toBeInTheDocument(); // GPT-4 confidence
  });

  it('should display usage patterns', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('product_description')).toBeInTheDocument();
    expect(screen.getByText('seo_title')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument(); // Average tokens for product descriptions
    expect(screen.getByText('120')).toBeInTheDocument(); // Average tokens for SEO titles
  });

  it('should show cost efficiency percentages', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('92%')).toBeInTheDocument(); // Product description efficiency
    expect(screen.getByText('88%')).toBeInTheDocument(); // SEO title efficiency
  });

  it('should display success rates for content types', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('96.5%')).toBeInTheDocument(); // Product description success rate
    expect(screen.getByText('98.2%')).toBeInTheDocument(); // SEO title success rate
  });

  it('should show last optimization timestamp', () => {
    const mockData = {
      ...mockCostData,
      lastOptimized: new Date('2023-12-01T10:30:00Z')
    };

    render(<CostAnalysis costData={mockData} />);

    expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument();
  });

  it('should handle empty cost data', () => {
    const emptyData: CostOptimization = {
      strategy: 'balanced',
      currentSavings: 0,
      potentialSavings: 0,
      providerRecommendations: [],
      usagePatterns: [],
      lastOptimized: new Date()
    };

    render(<CostAnalysis costData={emptyData} />);

    expect(screen.getByText('balanced')).toBeInTheDocument();
    expect(screen.getByText('$0.000')).toBeInTheDocument();
    expect(screen.getByText('$0.000')).toBeInTheDocument();
  });

  it('should handle missing recommendations gracefully', () => {
    const noRecommendations: CostOptimization = {
      ...mockCostData,
      providerRecommendations: []
    };

    render(<CostAnalysis costData={noRecommendations} />);

    expect(screen.queryByText('claude-3')).not.toBeInTheDocument();
    expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
  });

  it('should handle missing usage patterns gracefully', () => {
    const noPatterns: CostOptimization = {
      ...mockCostData,
      usagePatterns: []
    };

    render(<CostAnalysis costData={noPatterns} />);

    expect(screen.queryByText('product_description')).not.toBeInTheDocument();
    expect(screen.queryByText('seo_title')).not.toBeInTheDocument();
  });

  it('should format savings values correctly', () => {
    const highSavingsData: CostOptimization = {
      ...mockCostData,
      currentSavings: 1.5,
      potentialSavings: 2.75
    };

    render(<CostAnalysis costData={highSavingsData} />);

    expect(screen.getByText('$1.500')).toBeInTheDocument();
    expect(screen.getByText('$2.750')).toBeInTheDocument();
  });

  it('should show recommended content types', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('creative_content')).toBeInTheDocument();
    expect(screen.getByText('brand_content')).toBeInTheDocument();
    expect(screen.getByText('technical_content')).toBeInTheDocument();
  });

  it('should display preferred providers for usage patterns', () => {
    render(<CostAnalysis costData={mockCostData} />);

    expect(screen.getByText('gemini-pro, claude-3')).toBeInTheDocument();
    expect(screen.getByText('gemini-pro')).toBeInTheDocument();
  });
});