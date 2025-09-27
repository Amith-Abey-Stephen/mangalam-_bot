export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  sources?: Source[];
  metadata?: any;
}

export interface Source {
  source?: string;
  section_title?: string;
  notion_page_id?: string;
  preview?: string;
}

export interface ConversationHistory {
  preview: string;
  timestamp: string;
  messages: Message[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  metadata: {
    query: string;
    matches_count: number;
    top_score: number;
    processing_time_ms: number;
    provider?: string;
    requestId?: string;
    timestamp?: string;
  };
}

export interface ApiError {
  message: string;
  details?: any;
}