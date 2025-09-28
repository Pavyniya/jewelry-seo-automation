import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderHealthComponent } from '../ProviderHealth';
import { ProviderHealth } from '@jewelry-seo/shared/types/aiProvider';

describe('ProviderHealthComponent', () => {
  const mockProviders: ProviderHealth[] = [
    {
      id: 'gemini-pro',
      provider: 'Google Gemini Pro',
      status: 'healthy',
      responseTime: 250,
      errorRate: 2.5,
      successRate: 97.5,
      lastChecked: new Date(),
      consecutiveFailures: 0,
      circuitState: 'closed'
    },
    {
      id: 'claude-3',
      provider: 'Anthropic Claude 3',
      status: 'degraded',
      responseTime: 800,
      errorRate: 8.2,
      successRate: 91.8,
      lastChecked: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      consecutiveFailures: 2,
      circuitState: 'closed'
    },
    {
      id: 'gpt-4',
      provider: 'OpenAI GPT-4',
      status: 'down',
      responseTime: 0,
      errorRate: 100,
      successRate: 0,
      lastChecked: new Date(),
      consecutiveFailures: 8,
      circuitState: 'open'
    }
  ];

  it('should render provider health status correctly', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('Provider Health Status')).toBeInTheDocument();
    expect(screen.getByText('Real-time health monitoring for all AI providers')).toBeInTheDocument();
  });

  it('should display all providers with their details', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('Google Gemini Pro')).toBeInTheDocument();
    expect(screen.getByText('Anthropic Claude 3')).toBeInTheDocument();
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
  });

  it('should show correct status indicators and colors for healthy provider', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    const healthyProvider = screen.getByText('Google Gemini Pro').closest('div');
    const statusBadge = within(healthyProvider!).getByText('✓ Healthy');

    expect(statusBadge).toHaveClass('bg-green-100');
    expect(statusBadge).toHaveClass('text-green-800');
  });

  it('should show correct status indicators and colors for degraded provider', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    const degradedProvider = screen.getByText('Anthropic Claude 3').closest('div');
    const statusBadge = within(degradedProvider!).getByText('⚠ Degraded');

    expect(statusBadge).toHaveClass('bg-yellow-100');
    expect(statusBadge).toHaveClass('text-yellow-800');
  });

  it('should show correct status indicators and colors for down provider', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    const downProvider = screen.getByText('OpenAI GPT-4').closest('div');
    const statusBadge = within(downProvider!).getByText('✗ Down');

    expect(statusBadge).toHaveClass('bg-red-100');
    expect(statusBadge).toHaveClass('text-red-800');
  });

  it('should display response time with appropriate formatting', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('250ms')).toBeInTheDocument(); // Gemini
    expect(screen.getByText('800ms')).toBeInTheDocument(); // Claude
    expect(screen.getByText('0ms')).toBeInTheDocument();   // GPT-4
  });

  it('should format response time over 1 second correctly', () => {
    const providersWithSlowResponse: ProviderHealth[] = [
      {
        ...mockProviders[0],
        responseTime: 1500
      }
    ];

    render(<ProviderHealthComponent providers={providersWithSlowResponse} />);
    expect(screen.getByText('1.5s')).toBeInTheDocument();
  });

  it('should display success and error rates correctly', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('97.5%')).toBeInTheDocument(); // Gemini success rate
    expect(screen.getByText('2.5%')).toBeInTheDocument();   // Gemini error rate
    expect(screen.getByText('91.8%')).toBeInTheDocument(); // Claude success rate
    expect(screen.getByText('8.2%')).toBeInTheDocument();   // Claude error rate
  });

  it('should show circuit breaker states with correct colors', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    // Find circuit state indicators
    const circuitStates = screen.getAllByText(/closed|open/);
    expect(circuitStates).toHaveLength(3); // One for each provider
  });

  it('should show consecutive failures when present', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Claude failures
    expect(screen.getByText('8')).toBeInTheDocument(); // GPT-4 failures
  });

  it('should not show consecutive failures when zero', () => {
    const providerWithoutFailures = mockProviders.filter(p => p.consecutiveFailures === 0);
    render(<ProviderHealthComponent providers={providerWithoutFailures} />);

    // Should not show any failure counts
    const failureCounts = screen.queryAllByText(/\d+/).filter(
      element => element.parentElement?.textContent?.includes('Failures')
    );
    expect(failureCounts).toHaveLength(0);
  });

  it('should show appropriate status messages for degraded providers', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('Performance degraded - monitoring closely')).toBeInTheDocument();
  });

  it('should show appropriate status messages for down providers', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('Service unavailable - automatic failover activated')).toBeInTheDocument();
  });

  it('should format last checked time correctly', () => {
    const recentProvider: ProviderHealth[] = [
      {
        ...mockProviders[0],
        lastChecked: new Date()
      }
    ];

    render(<ProviderHealthComponent providers={recentProvider} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should format last checked time for minutes ago', () => {
    const providerWithOldCheck: ProviderHealth[] = [
      {
        ...mockProviders[0],
        lastChecked: new Date(Date.now() - 5 * 60000) // 5 minutes ago
      }
    ];

    render(<ProviderHealthComponent providers={providerWithOldCheck} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('should format last checked time for hours ago', () => {
    const providerWithVeryOldCheck: ProviderHealth[] = [
      {
        ...mockProviders[0],
        lastChecked: new Date(Date.now() - 2 * 60 * 60000) // 2 hours ago
      }
    ];

    render(<ProviderHealthComponent providers={providerWithVeryOldCheck} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('should show appropriate response time colors', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    // Gemini: 250ms should be green
    const geminiResponse = screen.getByText('250ms');
    expect(geminiResponse).toHaveClass('text-green-600');

    // Claude: 800ms should be yellow
    const claudeResponse = screen.getByText('800ms');
    expect(claudeResponse).toHaveClass('text-yellow-600');
  });

  it('should show appropriate success rate colors', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    // Gemini: 97.5% should be green
    const geminiSuccess = screen.getByText('97.5%');
    expect(geminiSuccess).toHaveClass('text-green-600');

    // Claude: 91.8% should be yellow
    const claudeSuccess = screen.getByText('91.8%');
    expect(claudeSuccess).toHaveClass('text-yellow-600');
  });

  it('should show appropriate error rate colors', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    // Gemini: 2.5% should be green
    const geminiError = screen.getByText('2.5%');
    expect(geminiError).toHaveClass('text-green-600');

    // Claude: 8.2% should be yellow
    const claudeError = screen.getByText('8.2%');
    expect(claudeError).toHaveClass('text-yellow-600');
  });

  it('should handle empty provider list', () => {
    render(<ProviderHealthComponent providers={[]} />);

    expect(screen.getByText('No provider data available')).toBeInTheDocument();
  });

  it('should apply hover effects to provider cards', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    const providerCards = screen.getAllByRole('article').filter(
      card => card.textContent?.includes('Google Gemini Pro')
    );

    expect(providerCards[0]).toHaveClass('hover:shadow-md');
  });

  it('should apply appropriate border colors based on status', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    const healthyCard = screen.getByText('Google Gemini Pro').closest('div');
    const degradedCard = screen.getByText('Anthropic Claude 3').closest('div');
    const downCard = screen.getByText('OpenAI GPT-4').closest('div');

    expect(healthyCard).toHaveClass('border-green-200');
    expect(degradedCard).toHaveClass('border-yellow-200');
    expect(downCard).toHaveClass('border-red-200');
  });

  it('should display provider IDs correctly', () => {
    render(<ProviderHealthComponent providers={mockProviders} />);

    expect(screen.getByText('ID: gemini-pro')).toBeInTheDocument();
    expect(screen.getByText('ID: claude-3')).toBeInTheDocument();
    expect(screen.getByText('ID: gpt-4')).toBeInTheDocument();
  });
});