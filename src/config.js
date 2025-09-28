import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    index: process.env.PINECONE_INDEX
  },
  
  provider: process.env.PROVIDER || 'gemini',
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    embedModel: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
    llmModel: process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash'
  },
  
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    embedModel: process.env.OPENROUTER_EMBED_MODEL || 'text-embedding-3-large',
    llmModel: process.env.OPENROUTER_LLM_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
  },
  
  rag: {
    topK: parseInt(process.env.TOPK) || 5,
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.75
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

export default config;