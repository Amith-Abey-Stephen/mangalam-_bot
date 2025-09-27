# Mangalam College Chatbot

A friendly, strict RAG (Retrieval-Augmented Generation) chatbot for Mangalam College of Engineering that provides accurate information from the college's knowledge base using Pinecone vector database and multiple LLM providers.

## 🚀 Features

- **Strict RAG Implementation**: Only returns information present in the knowledge base
- **Multi-LLM Support**: Switch between OpenRouter and Gemini providers
- **Responsive Design**: Mobile-first, accessible UI with dark/light mode
- **Real-time Chat**: Instant responses with typing indicators
- **Source Attribution**: Shows sources and metadata for transparency
- **Rate Limiting**: Built-in protection against abuse
- **Comprehensive Logging**: Structured logging for monitoring and debugging

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RAG Service**: Handles query processing and response generation
- **Provider System**: Pluggable LLM adapters (Gemini, OpenRouter)
- **Pinecone Integration**: Vector similarity search
- **Sanitization**: Two-stage answer verification
- **API Endpoints**: RESTful API with health checks and stats

### Frontend (React + TypeScript + Tailwind)
- **Chat Interface**: Real-time messaging with animations
- **Theme System**: Dark/light mode with persistence
- **Source Panel**: Expandable source attribution
- **Responsive Layout**: Mobile-first design with breakpoints
- **Error Handling**: Graceful error states and retry logic

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Pinecone account and API key
- Either Gemini API key or OpenRouter API key

### Backend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Basic Configuration
   PORT=5000
   NODE_ENV=development
   
   # Pinecone Configuration
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENV=your_pinecone_environment_here
   PINECONE_INDEX=mangalam-college-knowledge
   
   # Provider Selection (gemini or openrouter)
   PROVIDER=gemini
   
   # Gemini Configuration (if using Gemini)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_EMBED_MODEL=text-embedding-004
   GEMINI_LLM_MODEL=gemini-1.5-flash
   
   # OpenRouter Configuration (if using OpenRouter)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_EMBED_MODEL=text-embedding-3-large
   OPENROUTER_LLM_MODEL=meta-llama/llama-3.1-8b-instruct:free
   
   # RAG Configuration
   TOPK=5
   SIMILARITY_THRESHOLD=0.75
   ```

3. **Start the backend**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Running Both Services
```bash
npm run dev:all
```

### Building for Production
```bash
# Backend
npm run start

# Frontend
cd frontend && npm run build
```

## 📊 API Endpoints

### Chat API
- `POST /api/ask` - Send a chat message
- `GET /api/ask/health` - Health check
- `GET /api/ask/stats` - System statistics

### Example Request
```json
{
  "query": "What programs does Mangalam College offer?"
}
```

### Example Response
```json
{
  "answer": "Mangalam College of Engineering offers various undergraduate and postgraduate programs...",
  "sources": [
    {
      "source": "Academic Programs",
      "section_title": "Undergraduate Programs",
      "notion_page_id": "abc123"
    }
  ],
  "metadata": {
    "query": "What programs does Mangalam College offer?",
    "matches_count": 3,
    "top_score": 0.87,
    "processing_time_ms": 1245,
    "provider": "gemini",
    "requestId": "uuid-here",
    "timestamp": "2025-09-27T01:00:00.000Z"
  }
}
```

## 🎨 UI Components

### Key Components
- **ChatWindow**: Main chat interface with message history
- **MessageBubble**: Individual message display with animations
- **ChatInput**: Text input with suggestions and keyboard shortcuts
- **SourcePanel**: Expandable source attribution panel
- **Sidebar**: Navigation and conversation history
- **DarkModeToggle**: Theme switching component

### Design System
- **Colors**: Primary blue palette with gray neutrals
- **Typography**: Inter font family
- **Spacing**: Tailwind's spacing scale
- **Animations**: Framer Motion for smooth transitions

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific origins
- **Input Sanitization**: Query length limits and validation
- **Helmet.js**: Security headers and CSP
- **Environment Variables**: Secure configuration management

## 📈 Monitoring & Logging

### Structured Logging
- Request/response logging with IDs
- Performance metrics (processing time, similarity scores)
- Error tracking with stack traces
- Low similarity query alerts

### Log Files
- `logs/app.log` - General application logs
- `logs/api.log` - API endpoint logs
- `logs/rag.log` - RAG service logs
- `logs/pinecone.log` - Vector database logs
- `logs/[provider].log` - LLM provider logs

## 🚀 Deployment

### Backend Deployment
Recommended platforms: Render, Heroku, Railway

Environment variables required:
- All `.env` variables
- `NODE_ENV=production`
- Proper CORS origins for production

### Frontend Deployment
Recommended platforms: Vercel, Netlify

Build command: `npm run build`
Output directory: `dist`

## 🧪 Testing

### Backend Tests
```bash
npm test
```

### Frontend Tests
```bash
cd frontend && npm test
```

## 📝 Configuration

### RAG Configuration
- `TOPK`: Number of similar chunks to retrieve (default: 5)
- `SIMILARITY_THRESHOLD`: Minimum similarity score (default: 0.75)

### Provider Configuration
Switch between providers by changing the `PROVIDER` environment variable to either `gemini` or `openrouter`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the logs for error details
- Verify environment variables are set correctly
- Ensure Pinecone index exists and has data
- Confirm API keys are valid and have sufficient credits

## 🔄 Version History

- **v1.0.0** - Initial release with core RAG functionality
- Multi-LLM support (Gemini, OpenRouter)
- Responsive React frontend
- Complete TypeScript support