import { config } from '../config';
import { AiProvider, AiProviderName, GeneratedContent } from '@jewelry-seo/shared';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiProviderRepository } from '../repositories/aiProviderRepository';
import { aiUsageRepository } from '../repositories/aiUsageRepository';
import { v4 as uuidv4 } from 'uuid';

// Provider-agnostic interface
export interface AiService {
  generateContent(prompt: string): Promise<GeneratedContent>;
}

export class AiServiceImpl implements AiService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private googleAI?: GoogleGenerativeAI;
  private providerOrder: AiProviderName[] = [];
  private providers = new Map<AiProviderName, AiProvider>();

  constructor() {
    // Don't initialize automatically - will be initialized manually when needed
  }

  public async initialize() {
    if (config.ai.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
    if (config.ai.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.ai.anthropicApiKey });
    }
    if (config.ai.geminiApiKey) {
      this.googleAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }

    await this.reloadProviders();
  }

  public async reloadProviders() {
    const allProviders = await aiProviderRepository.findAll();
    const enabledProviders = allProviders.filter(p => p.isEnabled);

    this.providerOrder = enabledProviders.map(p => p.name as AiProviderName);
    this.providers.clear();
    for (const provider of enabledProviders) {
      this.providers.set(provider.name as AiProviderName, provider);
    }

    // Initialize providers in the database if they don't exist
    for (const providerName of ['gemini', 'claude', 'gpt'] as AiProviderName[]) {
      if (!allProviders.some(p => p.name === providerName)) {
        const newProvider = await aiProviderRepository.create({
          name: providerName,
          apiKey: this.getApiKey(providerName) || '',
          isEnabled: true,
        } as Omit<AiProvider, 'id' | 'createdAt' | 'updatedAt'>);
        if (newProvider.isEnabled) {
            this.providerOrder.push(newProvider.name as AiProviderName);
            this.providers.set(newProvider.name as AiProviderName, newProvider);
        }
      }
    }
  }

  private getApiKey(providerName: AiProviderName): string | undefined {
    switch (providerName) {
      case 'gpt': return config.ai.openaiApiKey;
      case 'claude': return config.ai.anthropicApiKey;
      case 'gemini': return config.ai.geminiApiKey;
    }
  }

  public async generateContent(prompt: string): Promise<GeneratedContent> {
    let lastError: any = null;

    for (const provider of this.providerOrder) {
      try {
        switch (provider) {
          case 'gpt':
            return await this.generateWithOpenAI(prompt);
          case 'claude':
            return await this.generateWithAnthropic(prompt);
          case 'gemini':
            return await this.generateWithGoogleAI(prompt);
        }
      } catch (error) {
        lastError = error;
        console.error(`Provider ${provider} failed:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.trackUsage(provider, 0, 0, false, errorMessage);
      }
    }

    throw new Error(`All AI providers failed to generate content. Last error: ${lastError}`);
  }

  private async trackUsage(providerName: AiProviderName, tokensUsed: number, responseTime: number, success: boolean, errorMessage?: string) {
    const provider = this.providers.get(providerName);
    if (provider) {
      await aiUsageRepository.create({
        providerId: provider.id,
        requestType: 'content-generation',
        tokensUsed,
        cost: 0, // To be implemented
        responseTime,
        success,
        errorMessage,
      } as any);
    }
  }

  private async generateWithOpenAI(prompt: string): Promise<GeneratedContent> {
    if (!this.openai) throw new Error('OpenAI API key not configured.');
    const startTime = Date.now();
    const completion = await this.openai.chat.completions.create({
      messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
      model: config.ai.openaiModel || 'gpt-4',
    });
    const responseTime = Date.now() - startTime;

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;
    await this.trackUsage('gpt', tokensUsed, responseTime, true);

    return { content, provider: 'gpt', tokensUsed, cost: 0 };
  }

  private async generateWithAnthropic(prompt: string): Promise<GeneratedContent> {
    if (!this.anthropic) throw new Error('Anthropic API key not configured.');
    const startTime = Date.now();
    const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
    });
    const responseTime = Date.now() - startTime;

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage('claude', tokensUsed, responseTime, true);

    return { content, provider: 'claude', tokensUsed, cost: 0 };
  }

  private async generateWithGoogleAI(prompt: string): Promise<GeneratedContent> {
    if (!this.googleAI) throw new Error('Google AI API key not configured.');
    const startTime = Date.now();
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro'});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    const responseTime = Date.now() - startTime;

    // Gemini API does not return token usage directly in the response
    await this.trackUsage('gemini', 0, responseTime, true);

    return { content, provider: 'gemini', tokensUsed: 0, cost: 0 };
  }
}

export const aiService = new AiServiceImpl();
// Don't initialize automatically - will be initialized manually when needed
