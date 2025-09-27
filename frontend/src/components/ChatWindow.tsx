import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SourcePanel from './SourcePanel';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import type { Message, Source } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: { message: string; details?: any } | null;
  onRetry?: () => void;
}

const ChatWindow = ({ messages, isLoading, error, onRetry }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSources, setShowSources] = useState(false);
  const [currentSources, setCurrentSources] = useState<Source[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Update sources from the last bot message
    const lastBotMessage = [...messages].reverse().find(msg => !msg.isUser);
    if (lastBotMessage?.sources && lastBotMessage.sources.length > 0) {
      setCurrentSources(lastBotMessage.sources);
    }
  }, [messages]);

  const handleToggleSources = () => {
    setShowSources(prev => !prev);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Mangalam College Chatbot
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              I'm here to help you learn about Mangalam College of Engineering. 
              Ask me about our programs, facilities, admissions, or anything else you'd like to know!
            </p>
          </motion.div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
            sources={message.sources}
            showSources={showSources}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    {error.message || 'Something went wrong. Please try again.'}
                  </p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Source Panel */}
      <SourcePanel
        sources={currentSources}
        isVisible={showSources}
        onToggle={handleToggleSources}
      />
    </div>
  );
};

export default ChatWindow;