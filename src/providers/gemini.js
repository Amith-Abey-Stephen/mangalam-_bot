import axios from 'axios';
import config from '../config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gemini.log' })
  ]
});

class GeminiProvider {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.embedModel = config.gemini.embedModel;
    this.llmModel = config.gemini.llmModel;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async embed(text) {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is required');
      }

      const response = await axios.post(
        `${this.baseUrl}/models/${this.embedModel}:embedContent?key=${this.apiKey}`,
        {
          model: `models/${this.embedModel}`,
          content: {
            parts: [{ text }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const embedding = response.data.embedding.values;
      logger.info(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      logger.error('Error generating Gemini embedding:', { 
        message: errorMessage, 
        status: statusCode,
        model: this.embedModel 
      });
      throw new Error(`Gemini Embedding Error: ${errorMessage}`);
    }
  }

  async generate(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is required');
      }

      const response = await axios.post(
        `${this.baseUrl}/models/${this.llmModel}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.1,
            topK: options.topK || 40,
            topP: options.topP || 0.95,
            maxOutputTokens: options.maxTokens || 1024
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate response structure
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const generatedText = response.data.candidates[0].content.parts[0].text;
      logger.info('Generated response from Gemini');
      return generatedText;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      logger.error('Error generating Gemini response:', { 
        message: errorMessage, 
        status: statusCode,
        model: this.llmModel 
      });
      
      // Handle specific error cases
      if (statusCode === 404) {
        throw new Error(`Gemini model '${this.llmModel}' not found. Please check the model name.`);
      } else if (statusCode === 403) {
        throw new Error('Gemini API access denied. Please check your API key and permissions.');
      } else if (statusCode === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Gemini API Error: ${errorMessage}`);
    }
  }
}

export default GeminiProvider;