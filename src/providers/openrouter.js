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

      if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].embedding) {
        throw new Error('Invalid response structure from OpenRouter embeddings API');
      }

      const embedding = response.data.data[0].embedding;
      logger.info(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      logger.error('Error generating OpenRouter embedding:', { 
        message: errorMessage, 
        status: statusCode,
        model: this.embedModel 
      });
      throw new Error(`OpenRouter Embedding Error: ${errorMessage}`);
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

      // Validate response structure
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenRouter API');
      }

      const generatedText = response.data.choices[0].message.content;
      logger.info('Generated response from OpenRouter');
      return generatedText;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      logger.error('Error generating OpenRouter response:', { 
        message: errorMessage, 
        status: statusCode,
        model: this.llmModel 
      });
      
      // Handle specific error cases
      if (statusCode === 404) {
        throw new Error(`OpenRouter model '${this.llmModel}' not found. Please check the model name.`);
      } else if (statusCode === 401) {
        throw new Error('OpenRouter API access denied. Please check your API key.');
      } else if (statusCode === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please try again later.');
      } else if (statusCode === 503) {
        throw new Error('OpenRouter service unavailable. Please try again later.');
      }
      
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }
  }
}

export default OpenRouterProvider;