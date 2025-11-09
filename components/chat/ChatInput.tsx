/**
 * Chat Input Component - Modern input with InputGroup components
 */

"use client";

import { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, Plus, X } from 'lucide-react';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

interface Attachment {
  id: string;
  recordingId: string;
  recording?: {
    title?: string;
  } | null;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachClick?: () => void;
  attachments?: Attachment[];
  onRemoveAttachment?: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

export function ChatInput({ 
  onSend, 
  onAttachClick, 
  attachments = [],
  onRemoveAttachment,
  disabled, 
  placeholder = 'Ask, Search or Chat...',
  selectedModel,
  onModelChange,
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSend(trimmedInput);
      setInput('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Input Group */}
      <InputGroup className={cn('[--radius:0.95rem]', 'rounded-[var(--radius)] py-2')}>
        <InputGroupTextarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-3 pt-1"
        />
        <InputGroupAddon align="block-end">
          {/* Attach Button */}
          {onAttachClick && (
            <InputGroupButton
              variant="outline"
              className="rounded-full"
              size="icon"
              onClick={onAttachClick}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </InputGroupButton>
          )}

          {/* Model Selector */}
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={disabled}
          />

          {/* Attachments - Inline with model selector */}
          {attachments && attachments.length > 0 && (
            <div className="ml-2 flex flex-wrap gap-1.5 items-center">
              {attachments.map((attachment) => (
                <Badge
                  key={attachment.id}
                  variant="secondary"
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 h-7 text-xs"
                >
                  <span className="truncate max-w-[120px]">
                    {attachment.recording?.title ?? 'Untitled recording'}
                  </span>
                  {onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(attachment.recordingId)}
                      className="hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Send Button */}
            <InputGroupButton
              variant="default"
              className="rounded-full"
              size="icon"
              disabled={disabled || !input.trim()}
              onClick={handleSend}
            >
              <ArrowUpIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
