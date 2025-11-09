/**
 * Chat Message Display Component
 */

"use client";

import { User, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse justify-start' : ''}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`inline-block px-4 py-2 rounded-2xl ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <div className={`${isUser ? '' : 'prose prose-sm dark:prose-invert max-w-none'}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap m-0 text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Custom styling for markdown elements
                  code: ({ node, inline, className, children, ...props }: any) => {
                    return inline ? (
                      <code className="bg-background/50 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-background/50 p-2 rounded my-2 overflow-x-auto text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
                  li: ({ children }) => <li className="my-1">{children}</li>,
                  p: ({ children }) => <p className="my-2">{children}</p>,
                  a: ({ children, href }) => (
                    <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
        {message.createdAt && (
          <div className="text-xs text-muted-foreground mt-1 px-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
