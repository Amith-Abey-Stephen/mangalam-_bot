import { Hono } from 'hono';
// Gemini SDK removed: use REST API via fetch
// Pinecone SDK removed: use REST API via fetch

// Heartbeat endpoint
const app = new Hono();
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'RAG Chatbot Worker is running',
    timestamp: new Date().toISOString(),
    colo: c.req.raw.cf?.colo,
  });
});

// RAG pipeline endpoint
app.post('/api/ask', async (c) => {
  let requestBody;
  try {
    requestBody = await c.req.json();
    if (!requestBody.query || typeof requestBody.query !== 'string') {
      return c.json({ error: 'Missing or invalid "query" field in request body' }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Invalid JSON in request body' }, 400);
  }

  const query = requestBody.query;

  try {
  // Step 2: Prepare Gemini REST API endpoints
  const geminiApiKey = c.env.GEMINI_API_KEY;
  const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  // Pinecone REST API endpoint
  const pineconeEndpoint = `https://api.pinecone.io/vectors/query`; // Adjust if your project uses a different endpoint

    // Step 3: Generate Query Embedding (REST API)
    const embeddingUrl = `${geminiBaseUrl}/models/embedding-001:embedContent?key=${geminiApiKey}`;
    const embeddingBody = {
      content: { parts: [{ text: query }] },
      taskType: 'RETRIEVAL_QUERY',
    };
    const embeddingResp = await fetch(embeddingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embeddingBody),
    });
    if (!embeddingResp.ok) {
      throw new Error('Gemini embedding failed');
    }
    const embeddingResult = await embeddingResp.json();
    const queryVector = embeddingResult.embedding.values;

    // Step 4: Vector Search (REST API)
    const pineconeQueryUrl = `https://api.pinecone.io/vectors/query`;
    const pineconeIndexName = c.env.PINECONE_INDEX_NAME;
    const pineconeApiKey = c.env.PINECONE_API_KEY;
    const pineconeProject = ''; // If needed, add your project name or environment

    const pineconeResponse = await fetch(pineconeQueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': pineconeApiKey,
      },
      body: JSON.stringify({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        index: pineconeIndexName,
      }),
    });
    if (!pineconeResponse.ok) {
      throw new Error('Pinecone query failed');
    }
    const queryResponse = await pineconeResponse.json();
    const matches = queryResponse.matches || [];
    const context = matches
      .map((match) => (match.metadata && match.metadata.text) ? match.metadata.text : '')
      .filter(Boolean)
      .join('\n---\n');

    // Step 5: Construct the RAG Prompt
    const ragPrompt = `
      You are an expert assistant. Your task is to answer the user's question based exclusively on the provided context.
      
      Follow these rules strictly:
      1.  Use ONLY the information from the CONTEXT below to answer the QUESTION.
      2.  Do not use any prior knowledge or information from outside the provided context.
      3.  If the CONTEXT does not contain the answer to the question, you MUST state: "I do not have enough information in the provided context to answer this question."
      4.  Extract and cite the sources used to formulate the answer.

      <CONTEXT>
      ${context}
      </CONTEXT>

      <QUESTION>
      ${query}
      </QUESTION>

      Answer:
    `;

    // Step 6: Generate Final Answer (REST API)
    const generationUrl = `${geminiBaseUrl}/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const generationBody = {
      contents: [{ parts: [{ text: ragPrompt }] }],
    };
    const generationResp = await fetch(generationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generationBody),
    });
    if (!generationResp.ok) {
      throw new Error('Gemini generation failed');
    }
    const genResult = await generationResp.json();
    const answer = genResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Step 7: Format and Return Final JSON Response
    const sources = matches.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }));

    return c.json({ answer, sources });

  } catch (error) {
    console.error('Error in RAG pipeline:', error);
    return c.json({ error: 'An internal server error occurred.' }, 500);
  }
});

export default app;
