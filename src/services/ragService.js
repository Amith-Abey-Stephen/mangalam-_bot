import { queryPinecone } from '../utils/pineconeClient.js';
import providerManager from '../providers/index.js';
import { sanitizeAnswer } from './sanitize.js';
import config from '../config.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/rag.log' })
  ]
});

const FALLBACK_MESSAGE = "Sorry, I don't have information about that in the Mangalam College database.";

const STRICT_RAG_PROMPT = `You are a friendly guide for Mangalam College of Engineering.
Answer the question strictly using ONLY the following context. Do NOT invent or add any information not in the context.

Context:
{context}

Question:
{user_question}

Respond in a friendly, concise paragraph(s). At the end, list the source sections used (comma-separated).
If the context does not contain the answer, reply: "${FALLBACK_MESSAGE}"`;

export const answerQuery = async (userQuery, requestId = null) => {
  const startTime = Date.now();
  
  try {
    logger.info(`Processing query: ${userQuery}`, { requestId });
    
    // Step 1: Generate embedding for user query
    const queryVector = await providerManager.embed(userQuery);
    logger.info('Generated query embedding', { requestId });
    
    // Step 2: Query Pinecone for similar chunks
    const queryResponse = await queryPinecone(queryVector, config.rag.topK);
    const matches = queryResponse.matches || [];
    
    // DEBUG: Log the raw response from Pinecone
    console.log('=== PINECONE RAW RESPONSE ===');
    console.log('Query:', userQuery);
    console.log('Full queryResponse:', JSON.stringify(queryResponse, null, 2));
    console.log('Matches count:', matches.length);
    if (matches.length > 0) {
      console.log('First match metadata:', JSON.stringify(matches[0].metadata, null, 2));
      console.log('First match score:', matches[0].score);
      console.log('First match text preview:', matches[0].metadata?.text?.substring(0, 200) + '...');
    }
    console.log('=== END DEBUG ===');
    
    if (matches.length === 0) {
      logger.warn('No matches found in Pinecone', { requestId });
      return {
        answer: FALLBACK_MESSAGE,
        sources: [],
        metadata: {
          query: userQuery,
          matches_count: 0,
          top_score: 0,
          processing_time_ms: Date.now() - startTime
        }
      };
    }
    
    // Step 3: Check similarity threshold
    const topScore = matches[0].score;
    logger.info(`Top similarity score: ${topScore}`, { requestId });
    
    if (topScore < config.rag.similarityThreshold) {
      logger.warn(`Low similarity score: ${topScore} < ${config.rag.similarityThreshold}`, { requestId });
      return {
        answer: FALLBACK_MESSAGE,
        sources: [],
        metadata: {
          query: userQuery,
          matches_count: matches.length,
          top_score: topScore,
          processing_time_ms: Date.now() - startTime,
          reason: 'low_similarity'
        }
      };
    }
    
    console.log('=== SIMILARITY THRESHOLD PASSED ===');
    console.log(`Top score: ${topScore}, Threshold: ${config.rag.similarityThreshold}`);
    console.log('Proceeding with context generation...');
    
    // Step 4: Build context from matches
    const context = matches
      .map(match => match.metadata.text || '')
      .filter(text => text.length > 0)
      .join('\n\n');
    
    // DEBUG: Log context building
    console.log('=== CONTEXT BUILDING DEBUG ===');
    console.log('Matches with text:', matches.filter(m => m.metadata.text).length);
    console.log('Context length:', context.length);
    console.log('Context preview:', context.substring(0, 300) + '...');
    console.log('=== END CONTEXT DEBUG ===');
    
    if (!context.trim()) {
      logger.warn('No valid context found in matches', { requestId });
      return {
        answer: FALLBACK_MESSAGE,
        sources: [],
        metadata: {
          query: userQuery,
          matches_count: matches.length,
          top_score: topScore,
          processing_time_ms: Date.now() - startTime,
          reason: 'no_context'
        }
      };
    }
    
    // Step 5: Generate RAG prompt
    const ragPrompt = STRICT_RAG_PROMPT
      .replace('{context}', context)
      .replace('{user_question}', userQuery);
    
    logger.info('Generating response with LLM', { requestId });
    
    // TEMPORARY DEBUG: Skip LLM and return direct context
    console.log('=== BYPASSING LLM FOR DEBUGGING ===');
    console.log('Returning first match content directly...');
    
    const rawAnswer = `Based on the Mangalam College database:

${matches[0].metadata.text}

Additional information from other matches:
${matches.slice(1, 3).map((match, idx) => `${idx + 2}. ${match.metadata.text.substring(0, 200)}...`).join('\n')}

Source: Page ${matches[0].metadata.pageId || 'unknown'}, Lines ${matches[0].metadata['loc.lines.from'] || 'unknown'}-${matches[0].metadata['loc.lines.to'] || 'unknown'}`;
    
    /*
    // Step 6: Generate answer
    const rawAnswer = await providerManager.generate(ragPrompt, {
      temperature: 0.1,
      maxTokens: 1024
    });
    */
    
    // DEBUG: Log LLM response
    console.log('=== LLM RESPONSE DEBUG ===');
    console.log('RAG Prompt length:', ragPrompt.length);
    console.log('RAG Prompt preview:', ragPrompt.substring(0, 500) + '...');
    console.log('Raw LLM Answer (bypassed):', rawAnswer.substring(0, 300) + '...');
    console.log('=== END LLM DEBUG ===');
    
    // Step 7: Sanitize answer
    const sanitizedResult = await sanitizeAnswer(rawAnswer, context, matches, providerManager);
    
    if (!sanitizedResult || !sanitizedResult.answer) {
      logger.warn('Answer failed sanitization', { requestId });
      return {
        answer: FALLBACK_MESSAGE,
        sources: [],
        metadata: {
          query: userQuery,
          matches_count: matches.length,
          top_score: topScore,
          processing_time_ms: Date.now() - startTime,
          reason: 'failed_sanitization'
        }
      };
    }
    
    const processingTime = Date.now() - startTime;
    logger.info(`Query processed successfully in ${processingTime}ms`, { requestId });
    
    return {
      answer: sanitizedResult.answer,
      sources: sanitizedResult.sources,
      metadata: {
        query: userQuery,
        matches_count: matches.length,
        top_score: topScore,
        processing_time_ms: processingTime,
        provider: providerManager.getCurrentProvider()
      }
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Error processing query:', { error: error.message, requestId, processingTime });
    
    return {
      answer: "I'm experiencing technical difficulties. Please try again later.",
      sources: [],
      metadata: {
        query: userQuery,
        matches_count: 0,
        top_score: 0,
        processing_time_ms: processingTime,
        error: error.message
      }
    };
  }
};