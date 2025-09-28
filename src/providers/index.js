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
    return await this.getProvider().embed(text);
  }

  async generate(prompt, options = {}) {
    return await this.getProvider().generate(prompt, options);
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
}

export default new ProviderManager();