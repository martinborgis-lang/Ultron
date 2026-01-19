'use client';

import { motion } from 'framer-motion';
import { Bot, User, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/assistant';
import { QueryResultTable } from './QueryResultTable';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function ChatMessage({ message, index }: ChatMessageProps) {
  const [showQuery, setShowQuery] = useState(false);
  const isUser = message.role === 'user';

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[80%] space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Text Bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
            message.error && 'border-red-500/50 border'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Data Table (if present) */}
        {message.data && message.data.length > 0 && (
          <QueryResultTable
            data={message.data}
            dataType={message.dataType || 'table'}
          />
        )}

        {/* SQL Query (collapsible) */}
        {message.query && !isUser && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuery(!showQuery)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Code className="w-3 h-3 mr-1" />
              {showQuery ? 'Masquer' : 'Voir'} la requete SQL
              {showQuery ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>

            {showQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">
                  <code>{message.query}</code>
                </pre>
              </motion.div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'text-[10px] text-muted-foreground',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
