import { useState, useCallback } from "react";

export default function useEnhanceUserPrompt() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancePrompt = useCallback(async (
    message: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    if (!message.trim()) return message;
    
    setIsEnhancing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/enhanceprompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const reader = response.body?.getReader(); //allows you to read chunk by chunk
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          onChunk?.(chunk); 
        }
      }

      return fullResponse || message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt');
      return message;
    } finally {
      setIsEnhancing(false);
    }
  }, []);

  return {
    enhancePrompt,
    isEnhancing,
    error,
  };
}


