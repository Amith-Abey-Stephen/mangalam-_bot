import { motion } from 'framer-motion';
import { User, Bot, Clock, ExternalLink } from 'lucide-react';
import type { Source } from '../types';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  sources?: Source[];
  showSources?: boolean;
}

const MessageBubble = ({ message, isUser, timestamp, sources = [], showSources = false }: MessageBubbleProps) => {
  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`${
            isUser 
              ? 'chat-bubble-user' 
              : 'chat-bubble-bot'
          } break-words`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>

          {/* Timestamp */}
          {timestamp && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(timestamp)}
            </div>
          )}

          {/* Sources */}
          {!isUser && sources.length > 0 && showSources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sources:
              </p>
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {source.section_title || source.source || 'Unknown Section'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;