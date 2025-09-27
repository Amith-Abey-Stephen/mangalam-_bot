import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/sanitize.log' })
  ]
});

/**
 * Two-stage verification to ensure answers only contain information from the context
 * Stage 1: Quick substring check
 * Stage 2: Semantic verification fallback if needed
 */
export const sanitizeAnswer = async (answer, context, matches, providerManager) => {
  try {
    // DEBUG: Log sanitization inputs
    console.log('=== SANITIZE DEBUG ===');
    console.log('Answer to sanitize:', answer);
    console.log('Context length:', context?.length || 0);
    console.log('Context preview:', context?.substring(0, 200) + '...');
    console.log('Matches count:', matches?.length || 0);
    console.log('=== END SANITIZE DEBUG ===');
    
    // Stage 1: Quick substring check
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const contextLower = context.toLowerCase();
    
    let validSentences = [];
    let suspiciousSentences = [];
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.trim().toLowerCase();
      if (sentenceLower.length === 0) continue;
      
      // Check if sentence has substantial overlap with context
      const words = sentenceLower.split(/\s+/).filter(w => w.length > 3);
      const overlapCount = words.filter(word => contextLower.includes(word)).length;
      const overlapRatio = overlapCount / words.length;
      
      if (overlapRatio >= 0.3) { // At least 30% word overlap
        validSentences.push(sentence.trim());
      } else {
        suspiciousSentences.push(sentence.trim());
        logger.warn(`Suspicious sentence detected: ${sentence.trim()}`);
      }
    }
    
    // If most sentences pass substring check, return cleaned answer
    if (suspiciousSentences.length === 0) {
      logger.info('Answer passed substring verification');
      return {
        answer: validSentences.join('. ') + '.',
        sources: matches.map(m => ({
          source: m.metadata.source || 'Unknown Source',
          section_title: m.metadata.section_title || `Lines ${m.metadata['loc.lines.from'] || ''}-${m.metadata['loc.lines.to'] || ''}`,
          notion_page_id: m.metadata.pageId || m.metadata.notion_page_id
        }))
      };
    }
    
    // Stage 2: Semantic verification for suspicious sentences
    if (suspiciousSentences.length > 0 && suspiciousSentences.length < sentences.length / 2) {
      logger.info('Running semantic verification on suspicious sentences');
      
      const verifyPrompt = `You are a verification assistant. Given CONTEXT and ANSWER below, check whether every factual statement in ANSWER appears in CONTEXT. If something is not supported, return "UNSUPPORTED: <the unsupported sentence(s)>". If everything is supported, return "OK".

CONTEXT:
${context}

ANSWER:
${suspiciousSentences.join('. ')}

Response:`;
      
      try {
        const verificationResult = await providerManager.generate(verifyPrompt, { temperature: 0.1 });
        
        if (verificationResult.trim().startsWith('OK')) {
          // Verification passed, include all sentences
          return {
            answer: [...validSentences, ...suspiciousSentences].join('. ') + '.',
            sources: matches.map(m => ({
              source: m.metadata.source || 'Unknown Source',
              section_title: m.metadata.section_title || `Lines ${m.metadata['loc.lines.from'] || ''}-${m.metadata['loc.lines.to'] || ''}`,
              notion_page_id: m.metadata.pageId || m.metadata.notion_page_id
            }))
          };
        } else {
          logger.warn(`Semantic verification failed: ${verificationResult}`);
          // Return only validated sentences
          return {
            answer: validSentences.length > 0 ? validSentences.join('. ') + '.' : null,
            sources: matches.map(m => ({
              source: m.metadata.source || 'Unknown Source',
              section_title: m.metadata.section_title || `Lines ${m.metadata['loc.lines.from'] || ''}-${m.metadata['loc.lines.to'] || ''}`,
              notion_page_id: m.metadata.pageId || m.metadata.notion_page_id
            }))
          };
        }
      } catch (verifyError) {
        logger.error('Error in semantic verification:', verifyError);
        // Fallback to conservative approach
        return {
          answer: validSentences.length > 0 ? validSentences.join('. ') + '.' : null,
          sources: matches.map(m => ({
            source: m.metadata.source || 'Unknown source',
            section_title: m.metadata.section_title || `Lines ${m.metadata.loc?.lines?.from || 'unknown'}-${m.metadata.loc?.lines?.to || 'unknown'}`,
            notion_page_id: m.metadata.pageId || m.metadata.notion_page_id || 'unknown'
          }))
        };
      }
    }
    
    // If too many suspicious sentences, return fallback
    logger.warn('Too many suspicious sentences, returning fallback');
    return null;
    
  } catch (error) {
    logger.error('Error in sanitization:', error);
    return null;
  }
};