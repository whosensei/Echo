import { useState } from "react";
import axios from "axios";

export const useMediaGeneration = () => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async (endpoint: string, data: string) => {
    setLoading(true);
    const res = await axios.post(endpoint, data, {
      headers: {
        "Content-Type": "application/json" 
      }
    });
    // const res = await fetch(endpoint, {
    //   method: "POST",
    //   body: JSON.stringify({ data }),
    // });
    const imageUri = res.data.uri;
    setMediaUrl(imageUri);
    setLoading(false);
  };

  const generateheadshots = (data: string) =>
    callApi("/api/flux-headshot", data);

  const generateportraits = (data: string) =>
    callApi("api/flux-portraits", data);

  const generatehairstyles = (data: string) =>
    callApi("/api/flux-hairstyle", data);

  const generateimages = (data: string) =>
     callApi("api/imagen-4", data);

  const editimages = (data: string) =>
    callApi("api/flux-kontext(edit)", data);

  return {
    mediaUrl,
    loading,
    setLoading,
    generateheadshots,
    generateportraits,
    generatehairstyles,
    generateimages,
    editimages
  };
};
