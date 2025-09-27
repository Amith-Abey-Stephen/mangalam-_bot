import { useState, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { chatAPI } from './services/api';
import type { Message, ConversationHistory } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: any } | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(messageText);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.answer,
        isUser: false,
        timestamp: new Date().toISOString(),
        sources: response.sources || [],
        metadata: response.metadata
      };

      setMessages(prev => [...prev, botMessage]);

      // Update conversation history
      setConversationHistory(prev => [
        {
          preview: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
          messages: [userMessage, botMessage]
        },
        ...prev
      ]);

    } catch (err: any) {
      console.error('Chat error:', err);
      setError({
        message: err.message || 'Failed to get response. Please try again.',
        details: err
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.isUser);
      if (lastUserMessage) {
        // Remove the last bot message (if any) and retry
        setMessages(prev => {
          const lastUserIndex = prev.map((msg, index) => ({ msg, index }))
            .reverse()
            .find(({ msg }) => msg.id === lastUserMessage.id)?.index ?? -1;
          return lastUserIndex >= 0 ? prev.slice(0, lastUserIndex + 1) : prev;
        });
        handleSendMessage(lastUserMessage.text);
      }
    }
  }, [messages, handleSendMessage]);

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            onNewConversation={handleNewConversation}
            conversationHistory={conversationHistory}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
          
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
