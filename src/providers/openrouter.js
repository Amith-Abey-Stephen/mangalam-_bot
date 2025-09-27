import axios from 'axios';
import config from '../config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/openrouter.log' })
  ]
});

class OpenRouterProvider {
  constructor() {
    this.apiKey = config.openrouter.apiKey;
    this.embedModel = config.openrouter.embedModel;
    this.llmModel = config.openrouter.llmModel;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async embed(text) {
    try {
      if (!this.apiKey) {
        throw new Error('OPENROUTER_API_KEY is required');
      }

      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          model: this.embedModel,
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mangalam-college-chatbot.com',
            'X-Title': 'Mangalam College Chatbot'
          }
        }
      );

      // Debug: Log the response structure
      console.log('OpenRouter embedding response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data || !response.data.data || !response.data.data[0]) {
        throw new Error(`Invalid OpenRouter embedding response structure: ${JSON.stringify(response.data)}`);
      }
      
      const embedding = response.data.data[0].embedding;
      logger.info(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      logger.error('Error generating OpenRouter embedding:', error.response?.data || error.message);
      throw error;
    }
  }

  async generate(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('OPENROUTER_API_KEY is required');
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.llmModel,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.1,
          max_tokens: options.maxTokens || 1024,
          top_p: options.topP || 0.95
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mangalam-college-chatbot.com',
            'X-Title': 'Mangalam College Chatbot'
          }
        }
      );

      const generatedText = response.data.choices[0].message.content;
      logger.info('Generated response from OpenRouter');
      return generatedText;
    } catch (error) {
      logger.error('Error generating OpenRouter response:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default OpenRouterProvider;