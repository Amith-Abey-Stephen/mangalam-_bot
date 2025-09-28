import { queryPinecone } from '../utils/pineconeClient.js';
import providerManager from '../providers/index.js';

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
    
    logger.info(`Built context from ${matches.filter(m => m.metadata.text).length} matches, length: ${context.length}`, { requestId });
    
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
    
    logger.info('Generating AI-parsed response from retrieved content', { requestId });
    
    // Create an intelligent parsing prompt for the LLM
    const parsingPrompt = `You are an expert at extracting and presenting relevant information from college database content.

User Question: "${userQuery}"

Database Content to Parse:
${context}

Instructions:
1. Extract ONLY the information that directly answers the user's question
2. Present it in a clear, concise, and well-formatted manner
3. Use bullet points or numbered lists when appropriate
4. Remove redundant or irrelevant information
5. Keep the response focused and easy to read
6. If dates, names, or specific details are mentioned, include them accurately
7. Do not include meta-information like page numbers or technical details

Provide a direct, helpful answer based on the retrieved content:`;

    logger.info('Using AI to parse and format the response', { requestId });
    
    let rawAnswer;
    try {
      // Use AI to intelligently parse and format the response
      rawAnswer = await providerManager.generate(parsingPrompt, {
        temperature: 0.1,
        maxTokens: 1024
      });
      
      logger.info('AI parsing completed successfully', { requestId });
    } catch (error) {
      logger.warn('AI parsing failed, using fallback formatting', { error: error.message, requestId });
      
      // Fallback: Basic extraction from primary match
      const primaryMatch = matches[0];
      const cleanText = primaryMatch.metadata.text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      rawAnswer = `**${userQuery}**

${cleanText.substring(0, 500)}${cleanText.length > 500 ? '...' : ''}

*Based on information from Mangalam College database*`;
    }
    
    const processingTime = Date.now() - startTime;
    logger.info(`Query processed successfully in ${processingTime}ms`, { requestId });
    
    // Return raw answer without sanitization
    return {
      answer: rawAnswer,
      sources: matches.map(match => ({
        text: match.metadata.text,
        score: match.score,
        source: match.metadata.source || 'document'
      })),
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