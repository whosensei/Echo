import { useState } from "react";

const useMediaGeneration = () => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async (endpoint: string, prompt: string) => {
    setLoading(true);
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" },
    });
    const { imageUri } = await res.json();
    setMediaUrl(imageUri);
    setLoading(false);
  };

  const generateheadshots = (prompt: string) =>
    callApi("/api/flux-headshot", prompt);

  const generateportraits = (prompt: string) =>
    callApi("api/flux-portraits", prompt);

  const generatehairstyles = (prompt: string) =>
    callApi("/api/flux-hairstyle", prompt);

  const generateimages = (prompt: string) =>
     callApi("api/imagen-4", prompt);

  const editimages = (prompt: string) =>
    callApi("api/flux-kontext(edit)", prompt);

  return {
    mediaUrl,
    loading,
    generateheadshots,
    generateportraits,
    generatehairstyles,
    generateimages,
    editimages
  };
};
