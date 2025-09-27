import express from 'express';
import { answerQuery } from '../services/ragService.js';
import { randomUUID } from 'crypto';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api.log' })
  ]
});

// POST /api/ask - Main chatbot endpoint
router.post('/', async (req, res) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  try {
    const { query } = req.body;
    
    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required and must be a non-empty string',
        requestId
      });
    }
    
    if (query.length > 1000) {
      return res.status(400).json({
        error: 'Query is too long. Maximum length is 1000 characters.',
        requestId
      });
    }
    
    logger.info(`Received query request`, { 
      requestId, 
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Process query
    const result = await answerQuery(query.trim(), requestId);
    
    const responseTime = Date.now() - startTime;
    
    logger.info(`Query processed successfully`, {
      requestId,
      responseTime,
      hasAnswer: !!result.answer,
      sourcesCount: result.sources.length,
      topScore: result.metadata.top_score
    });
    
    res.json({
      answer: result.answer,
      sources: result.sources,
      metadata: {
        ...result.metadata,
        requestId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error(`Error processing query request`, {
      requestId,
      error: error.message,
      stack: error.stack,
      responseTime
    });
    
    res.status(500).json({
      error: 'Internal server error. Please try again later.',
      requestId,
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime
      }
    });
  }
});

// GET /api/ask/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/ask/stats - Basic statistics endpoint
router.get('/stats', (req, res) => {
  // This would typically connect to a monitoring service
  // For now, return basic system info
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

export default router;