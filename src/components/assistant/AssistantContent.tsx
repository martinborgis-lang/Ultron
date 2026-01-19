'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage as ChatMessageType, AssistantResponse, ConversationContext } from '@/types/assistant';

export function AssistantContent() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Build conversation history for context
  const getConversationHistory = useCallback((): ConversationContext[] => {
    return messages.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }, [messages]);

  // Send message to API
  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: getConversationHistory(),
        }),
      });

      const data: AssistantResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        data: data.data,
        dataType: data.dataType,
        query: data.query,
        error: !!data.error,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error
          ? error.message
          : "Une erreur s'est produite. Veuillez reessayer.",
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Erreur',
        description: 'Impossible de contacter l\'assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getConversationHistory, toast]);

  // Handle suggestion click from welcome screen
  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold">Assistant Ultron</h1>
        <p className="text-sm text-muted-foreground">
          Interrogez vos donnees en langage naturel
        </p>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 mx-4 my-4 overflow-hidden flex flex-col border-border/50">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                />
              ))}

              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
