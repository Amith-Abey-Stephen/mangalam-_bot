# Gemini-Pinecone RAG Worker

Production-ready Cloudflare Worker backend for a RAG chatbot using Hono, Gemini, and Pinecone.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure secrets:**
   - Add your API keys to `.dev.vars` (never commit this file).
   - Upload secrets to Cloudflare:
     ```bash
     npx wrangler secret put GEMINI_API_KEY
     npx wrangler secret put PINECONE_API_KEY
     ```
3. **Configure Pinecone index name in `wrangler.toml`.**

## Development

- Run locally:
  ```bash
  npm run dev
  ```
- Deploy:
  ```bash
  npm run deploy
  ```

## Endpoints

- `GET /` — Heartbeat
- `POST /api/ask` — RAG pipeline

## Testing

Use `curl` or your preferred tool to test endpoints after deployment.

## Security

- Never commit `.dev.vars`.
- Use Wrangler CLI for production secrets.

## Next Steps

- Add integration tests
- Monitor logs with `wrangler tail`
- Consider caching for frequent queries
