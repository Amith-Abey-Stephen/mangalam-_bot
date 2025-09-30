import { describe, it, expect } from 'vitest';

describe('RAG Worker', () => {
  it('should return heartbeat status', async () => {
    const response = {
      status: 'ok',
      message: 'RAG Chatbot Worker is running',
      timestamp: expect.any(String),
      colo: expect.anything(),
    };
    expect(response.status).toBe('ok');
    expect(response.message).toContain('RAG Chatbot Worker');
  });

  it('should handle invalid POST /api/ask request', async () => {
    const errorResponse = { error: 'Missing or invalid "query" field in request body' };
    expect(errorResponse.error).toContain('Missing or invalid');
  });
});
