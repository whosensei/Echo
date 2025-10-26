"use client";

import * as React from "react";
import { AVAILABLE_MODELS, isModelAvailable, type ModelInfo } from '@/lib/ai-models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, Lock, Sparkles, Zap, Brain, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  showIcon?: boolean;
  showProviderBadge?: boolean;
  showDescription?: boolean;
  showCost?: boolean;
  compact?: boolean;
}

/**
 * ModelSelector - Complete implementation from scratch
 * 
 * Features:
 * - Display all available models grouped by provider
 * - Show availability status (locked if API key not configured)
 * - Display model descriptions, context windows, and pricing
 * - Visual indicators for selected model
 * - Customizable styling and layout options
 * - Responsive and accessible
 */
export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
  className,
  triggerClassName,
  showIcon = true,
  showProviderBadge = true,
  showDescription = true,
  showCost = false,
  compact = false,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  // Get all models and current selection
  const allModels = AVAILABLE_MODELS;
  const currentModel = allModels.find((m) => m.id === selectedModel);
  
  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped: Record<string, ModelInfo[]> = {
      openai: [],
      anthropic: [],
      google: [],
    };
    
    allModels.forEach((model) => {
      if (grouped[model.provider]) {
        grouped[model.provider].push(model);
      }
    });
    
    return grouped;
  }, [allModels]);
  
  // Provider metadata
  const providerInfo = {
    openai: { name: 'OpenAI', icon: Brain, color: 'text-green-500' },
    anthropic: { name: 'Anthropic', icon: Sparkles, color: 'text-orange-500' },
    google: { name: 'Google', icon: Zap, color: 'text-blue-500' },
  };
  
  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    if (isModelAvailable(modelId)) {
      onModelChange(modelId);
      setOpen(false);
    }
  };
  
  // Format cost display
  const formatCost = (cost: { input: number; output: number }) => {
    return `$${cost.input}/$${cost.output} per 1M tokens`;
  };
  
  // Format context window
  const formatContextWindow = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'h-8 gap-2',
            disabled && 'opacity-50 cursor-not-allowed',
            triggerClassName
          )}
        >
          <span className="text-sm">
            {currentModel?.name || 'Select Model'}
          </span>
          {showIcon && (
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                open && 'rotate-180'
              )} 
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        side="bottom" 
        align="start" 
        sideOffset={8}
        className={cn(
          'w-[380px] max-h-[500px] overflow-y-auto',
          compact && 'w-[280px]',
          className
        )}
      >
        {Object.entries(modelsByProvider).map(([provider, models], idx) => {
          if (models.length === 0) return null;
          
          const ProviderIcon = providerInfo[provider as keyof typeof providerInfo].icon;
          const providerName = providerInfo[provider as keyof typeof providerInfo].name;
          const providerColor = providerInfo[provider as keyof typeof providerInfo].color;
          
          return (
            <React.Fragment key={provider}>
              {idx > 0 && <DropdownMenuSeparator />}
              
              <DropdownMenuLabel className="flex items-center gap-2 py-2">
                <ProviderIcon className={cn('h-4 w-4', providerColor)} />
                <span className="font-semibold">{providerName}</span>
              </DropdownMenuLabel>
              
              {models.map((model) => {
                const available = isModelAvailable(model.id);
                const selected = model.id === selectedModel;
                
                return (
                  <DropdownMenuItem
                    key={model.id}
                    disabled={!available}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 py-3 px-3 cursor-pointer',
                      'focus:bg-accent focus:text-accent-foreground',
                      selected && 'bg-accent/50',
                      !available && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={cn(
                          'text-sm font-semibold truncate',
                          selected && 'text-primary'
                        )}>
                          {model.name}
                        </span>
                        {!available && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!compact && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                            {formatContextWindow(model.contextWindow)} ctx
                          </Badge>
                        )}
                        {selected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                    
                    {!compact && showDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                        {model.description}
                      </p>
                    )}
                    
                    {!compact && showCost && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>{formatCost(model.costPer1MTokens)}</span>
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </React.Fragment>
          );
        })}
        
        {allModels.every(m => !isModelAvailable(m.id)) && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No models available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please configure API keys in your environment
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
