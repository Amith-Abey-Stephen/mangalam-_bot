import config from '../config.js';
import GeminiProvider from './gemini.js';
import OpenRouterProvider from './openrouter.js';

class ProviderManager {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openrouter: new OpenRouterProvider()
    };
    
    this.currentProvider = config.provider;
  }

  getProvider() {
    const provider = this.providers[this.currentProvider];
    if (!provider) {
      throw new Error(`Unknown provider: ${this.currentProvider}`);
    }
    return provider;
  }

  async embed(text) {
    return await this.retryWithFallback('embed', text);
  }

  async generate(prompt, options = {}) {
    return await this.retryWithFallback('generate', prompt, options);
  }

  async retryWithFallback(method, ...args) {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second
    const providers = Object.keys(this.providers);
    
    for (const providerName of providers) {
      let currentDelay = initialDelay;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const provider = this.providers[providerName];
          console.log(`Attempting ${method} with ${providerName} (attempt ${attempt}/${maxRetries})`);
          
          const result = await provider[method](...args);
          
          // If successful and not using the preferred provider, switch back
          if (providerName !== config.provider) {
            console.log(`Successfully used fallback provider ${providerName}, but keeping current config`);
          }
          
          return result;
        } catch (error) {
          console.log(`${providerName} ${method} attempt ${attempt} failed:`, error.message);
          
          // If this is a 503 service unavailable or similar, try next provider immediately
          if (error.message.includes('503') || error.message.includes('unavailable') || error.message.includes('SERVICE_UNAVAILABLE')) {
            console.log(`Service unavailable for ${providerName}, trying next provider...`);
            break; // Skip to next provider
          }
          
          // For other errors, wait before retrying same provider
          if (attempt < maxRetries) {
            console.log(`Waiting ${currentDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= 2; // Exponential backoff
          }
        }
      }
    }
    
    throw new Error(`All providers failed for ${method} after ${maxRetries} attempts each`);
  }

  switchProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    this.currentProvider = providerName;
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  // Validate model configuration
  validateModels() {
    const issues = [];
    
    // Check if provider is valid
    if (!this.providers[this.currentProvider]) {
      issues.push(`Invalid provider: ${this.currentProvider}`);
    }
    
    // Check API keys
    const currentProvider = this.providers[this.currentProvider];
    if (currentProvider) {
      if (this.currentProvider === 'gemini' && !currentProvider.apiKey) {
        issues.push('GEMINI_API_KEY is required');
      }
      if (this.currentProvider === 'openrouter' && !currentProvider.apiKey) {
        issues.push('OPENROUTER_API_KEY is required');
      }
    }
    
    return issues;
  }

  // Get available models info
  getModelsInfo() {
    return {
      current: this.currentProvider,
      available: Object.keys(this.providers),
      gemini: {
        embedModel: this.providers.gemini?.embedModel,
        llmModel: this.providers.gemini?.llmModel,
        hasApiKey: !!this.providers.gemini?.apiKey
      },
      openrouter: {
        embedModel: this.providers.openrouter?.embedModel,
        llmModel: this.providers.openrouter?.llmModel,
        hasApiKey: !!this.providers.openrouter?.apiKey
      }
    };
  }
}

export default new ProviderManager();