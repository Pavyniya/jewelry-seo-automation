import React from 'react';
import { render, screen } from '@testing-library/react';
import { RateLimitStatus } from '../RateLimitStatus';
import { RateLimitState } from '@jewelry-seo/shared/types/aiProvider';

describe('RateLimitStatus', () => {
  const mockRateLimits: RateLimitState[] = [
    {
      providerId: 'gemini-pro',
      currentUsage: 45,
      limit: 60,
      resetTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
      windowStart: new Date(Date.now() - 45 * 60000), // 45 minutes ago
      requestsInWindow: 45,
      burstCapacity: 12
    },
    {
      providerId: 'claude-3',
      currentUsage: 8,
      limit: 50,
      resetTime: new Date(Date.now() + 52 * 60000), // 52 minutes from now
      windowStart: new Date(Date.now() - 8 * 60000), // 8 minutes ago
      requestsInWindow: 8,
      burstCapacity: 10
    },
    {
      providerId: 'gpt-4',
      currentUsage: 195,
      limit: 200,
      resetTime: new Date(Date.now() + 5 * 60000), // 5 minutes from now
      windowStart: new Date(Date.now() - 55 * 60000), // 55 minutes ago
      requestsInWindow: 195,
      burstCapacity: 40
    }
  ];

  it('should render rate limit status component', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText(/Rate Limit Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider Quotas and Usage/i)).toBeInTheDocument();
  });

  it('should display all providers with rate limit information', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('gemini-pro')).toBeInTheDocument();
    expect(screen.getByText('claude-3')).toBeInTheDocument();
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  it('should show current usage and limits correctly', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('45 / 60')).toBeInTheDocument(); // Gemini
    expect(screen.getByText('8 / 50')).toBeInTheDocument();   // Claude
    expect(screen.getByText('195 / 200')).toBeInTheDocument(); // GPT-4
  });

  it('should calculate and display usage percentages', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('75%')).toBeInTheDocument();  // Gemini: 45/60 = 75%
    expect(screen.getByText('16%')).toBeInTheDocument();  // Claude: 8/50 = 16%
    expect(screen.getByText('98%')).toBeInTheDocument();  // GPT-4: 195/200 = 97.5% ≈ 98%
  });

  it('should show remaining requests', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('15')).toBeInTheDocument(); // Gemini: 60-45=15
    expect(screen.getByText('42')).toBeInTheDocument(); // Claude: 50-8=42
    expect(screen.getByText('5')).toBeInTheDocument();  // GPT-4: 200-195=5
  });

  it('should display time until reset', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText(/15m/)).toBeInTheDocument(); // Gemini reset time
    expect(screen.getByText(/52m/)).toBeInTheDocument(); // Claude reset time
    expect(screen.getByText(/5m/)).toBeInTheDocument();  // GPT-4 reset time
  });

  it('should show burst capacity', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('12')).toBeInTheDocument(); // Gemini burst
    expect(screen.getByText('10')).toBeInTheDocument(); // Claude burst
    expect(screen.getByText('40')).toBeInTheDocument(); // GPT-4 burst
  });

  it('should apply appropriate color coding for usage levels', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    // Low usage (16%) should be green
    const claudeUsage = screen.getByText('16%');
    expect(claudeUsage).toHaveClass('text-green-600');

    // Medium usage (75%) should be yellow
    const geminiUsage = screen.getByText('75%');
    expect(geminiUsage).toHaveClass('text-yellow-600');

    // High usage (98%) should be red
    const gptUsage = screen.getByText('98%');
    expect(gptUsage).toHaveClass('text-red-600');
  });

  it('should handle empty rate limit data', () => {
    render(<RateLimitStatus rateLimits={[]} />);

    expect(screen.getByText('No rate limit data available')).toBeInTheDocument();
  });

  it('should handle single provider', () => {
    const singleProvider: RateLimitState[] = [mockRateLimits[0]];
    render(<RateLimitStatus rateLimits={singleProvider} />);

    expect(screen.getByText('gemini-pro')).toBeInTheDocument();
    expect(screen.queryByText('claude-3')).not.toBeInTheDocument();
    expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
  });

  it('should format reset time correctly for different time ranges', () => {
    const customRateLimits: RateLimitState[] = [
      {
        ...mockRateLimits[0],
        resetTime: new Date(Date.now() + 30 * 1000) // 30 seconds
      },
      {
        ...mockRateLimits[1],
        resetTime: new Date(Date.now() + 90 * 60 * 1000) // 90 minutes
      },
      {
        ...mockRateLimits[2],
        resetTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
      }
    ];

    render(<RateLimitStatus rateLimits={customRateLimits} />);

    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('90m')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('should show warning for high usage', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    // GPT-4 at 98% should show warning
    expect(screen.getByText('Near limit')).toBeInTheDocument();
  });

  it('should show warning for very high usage', () => {
    const criticalUsage: RateLimitState[] = [
      {
        ...mockRateLimits[2],
        currentUsage: 198,
        limit: 200
      }
    ];

    render(<RateLimitStatus rateLimits={criticalUsage} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should show healthy status for low usage', () => {
    const lowUsage: RateLimitState[] = [
      {
        ...mockRateLimits[1],
        currentUsage: 5,
        limit: 50
      }
    ];

    render(<RateLimitStatus rateLimits={lowUsage} />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('should calculate usage percentage correctly', () => {
    const edgeCaseLimits: RateLimitState[] = [
      {
        ...mockRateLimits[0],
        currentUsage: 0,
        limit: 100
      },
      {
        ...mockRateLimits[1],
        currentUsage: 100,
        limit: 100
      },
      {
        ...mockRateLimits[2],
        currentUsage: 50,
        limit: 100
      }
    ];

    render(<RateLimitStatus rateLimits={edgeCaseLimits} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display provider IDs in a readable format', () => {
    render(<RateLimitStatus rateLimits={mockRateLimits} />);

    expect(screen.getByText('Google Gemini Pro')).toBeInTheDocument();
    expect(screen.getByText('Anthropic Claude 3')).toBeInTheDocument();
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
  });
});