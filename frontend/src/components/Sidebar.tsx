import { useState } from 'react';
import { MessageSquare, Settings, HelpCircle, BookOpen, GraduationCap, MapPin } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { motion } from 'framer-motion';
import type { ConversationHistory } from '../types';

interface SidebarProps {
  onNewConversation: () => void;
  conversationHistory: ConversationHistory[];
}

const Sidebar = ({ onNewConversation, conversationHistory = [] }: SidebarProps) => {
  const [activeSection, setActiveSection] = useState('chat');

  const quickFAQs = [
    {
      icon: GraduationCap,
      question: "What programs does the college offer?",
      category: "Academics"
    },
    {
      icon: MapPin,
      question: "Where is Mangalam College located?",
      category: "General"
    },
    {
      icon: BookOpen,
      question: "What are the admission requirements?",
      category: "Admissions"
    },
    {
      icon: Settings,
      question: "What facilities are available on campus?",
      category: "Campus Life"
    }
  ];

  const handleFAQClick = (_question: string) => {
    // This would trigger sending the question
    // For now, we'll just create a new conversation
    onNewConversation();
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                Mangalam College
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI Assistant
              </p>
            </div>
          </div>
          <DarkModeToggle />
        </div>

        <button
          onClick={onNewConversation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Conversation
        </button>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'faqs', label: 'Quick Help', icon: HelpCircle }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 p-3 text-sm font-medium transition-colors duration-200 ${
              activeSection === id
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'chat' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Recent Conversations
            </h3>
            {conversationHistory.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No conversations yet. Start chatting to see your history here.
              </p>
            ) : (
              <div className="space-y-2">
                {conversationHistory.slice(0, 10).map((conversation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                  >
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {conversation.preview}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(conversation.timestamp).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'faqs' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {quickFAQs.map((faq, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleFAQClick(faq.question)}
                  className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors duration-200">
                      <faq.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {faq.question}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {faq.category}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Powered by Mangalam College AI
        </p>
      </div>
    </div>
  );
};

export default Sidebar;