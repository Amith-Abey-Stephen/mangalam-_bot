import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/pinecone.log' })
  ]
});

let pineconeClient = null;
let index = null;

export const initializePinecone = async () => {
  try {
    if (!config.pinecone.apiKey) {
      throw new Error('PINECONE_API_KEY is required');
    }

    if (!config.pinecone.index) {
      throw new Error('PINECONE_INDEX is required');
    }

    pineconeClient = new Pinecone({
      apiKey: config.pinecone.apiKey
    });

    // Test connection by listing indexes
    try {
      const indexList = await pineconeClient.listIndexes();
      logger.info(`Available Pinecone indexes: ${indexList.indexes?.map(idx => idx.name).join(', ') || 'none'}`);
      
      const indexExists = indexList.indexes?.some(idx => idx.name === config.pinecone.index);
      if (!indexExists) {
        throw new Error(`Index '${config.pinecone.index}' not found. Available indexes: ${indexList.indexes?.map(idx => idx.name).join(', ') || 'none'}`);
      }
    } catch (listError) {
      logger.error('Failed to verify Pinecone connection:', listError);
      throw new Error(`Failed to connect to Pinecone. Please check your API key and network connection. Error: ${listError.message}`);
    }

    index = pineconeClient.index(config.pinecone.index);
    
    logger.info('Pinecone client initialized successfully');
    return { client: pineconeClient, index };
  } catch (error) {
    logger.error('Failed to initialize Pinecone client:', error);
    throw error;
  }
};

export const getIndex = () => {
  if (!index) {
    throw new Error('Pinecone not initialized. Call initializePinecone() first.');
  }
  return index;
};

export const queryPinecone = async (vector, topK = config.rag.topK) => {
  try {
    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true,
      includeValues: false
    });

    logger.info(`Pinecone query returned ${queryResponse.matches.length} matches`);
    
    // Log similarity scores for monitoring
    if (queryResponse.matches.length > 0) {
      const topScore = queryResponse.matches[0].score;
      logger.info(`Top similarity score: ${topScore}`);
      
      if (topScore < config.rag.similarityThreshold) {
        logger.warn(`Low similarity query detected. Top score: ${topScore}, Threshold: ${config.rag.similarityThreshold}`);
      }
    }

    return queryResponse;
  } catch (error) {
    logger.error('Error querying Pinecone:', error);
    throw error;
  }
};