'use client';

import React, { useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Sparkles } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export const ChatBubble = ({ role, content, isStreaming }: MessageProps) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      "flex w-full mb-6 animate-message",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[75%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
          isUser ? "bg-gray-100 border-gray-200" : "bg-gray-900 border-gray-800"
        )}>
          {isUser ? (
            <User className="h-4 w-4 text-gray-600" />
          ) : (
            <Sparkles className="h-4 w-4 text-emerald-400" />
          )}
        </div>

        {/* Bubble */}
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
          isUser ? "chat-bubble-user rounded-tr-none" : "chat-bubble-assistant rounded-tl-none text-gray-800 dark:text-gray-100"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div 
      ref={scrollRef} 
      className={cn("flex-1 overflow-y-auto p-6 scroll-smooth", className)}
    >
      <div className="max-w-3xl mx-auto w-full pb-12">
        {children}
      </div>
    </div>
  );
};

type ChatInputProps = React.HTMLAttributes<HTMLDivElement> & {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export const ChatInput = ({ onSend, disabled, ...props }: ChatInputProps) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      setValue('');
    }
  };

  return (
    <div className="px-6 py-4 bg-white/40 border-t border-gray-200/50" {...props}>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask Copilot..."
          disabled={disabled}
          className="flex-1 bg-white/60 border border-gray-200/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all resize-none h-[46px] min-h-[46px]"
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </button>
      </form>
    </div>
  );
};
