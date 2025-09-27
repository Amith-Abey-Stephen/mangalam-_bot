import { useState } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Source } from '../types';

interface SourcePanelProps {
  sources: Source[];
  isVisible: boolean;
  onToggle: () => void;
}

const SourcePanel = ({ sources = [], isVisible, onToggle }: SourcePanelProps) => {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const toggleSourceExpansion = (index: number) => {
    setExpandedSource(expandedSource === index ? null : index);
  };

  if (!sources.length) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {isVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span>Sources ({sources.length})</span>
        </div>
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>

      {/* Sources List */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3 space-y-2"
          >
            {sources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleSourceExpansion(index)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {source.section_title || 'Unknown Section'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {source.source || 'Unknown Source'}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSource === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 flex-shrink-0"
                    >
                      ▼
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSource === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="pt-3 space-y-2">
                        {source.notion_page_id && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Page ID:</span>
                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                              {source.notion_page_id}
                            </code>
                          </div>
                        )}
                        
                        {source.preview && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Preview:</span>
                            <p className="mt-1 italic">"{source.preview}"</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SourcePanel;