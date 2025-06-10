import { useState } from "react";

const useMediaGeneration = () => {
    const [mediaUrl, setMediaUrl] = useState(null);
    const [loading, setLoading] = useState(false);
  
    const generate = async (prompt:string) => {
      setLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      const { imageUrl } = await res.json();
      setMediaUrl(imageUrl);
      setLoading(false);
    };
  
    return { mediaUrl, generate, loading };
  };