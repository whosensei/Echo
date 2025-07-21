import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import {
  Chat,
  Version,
  Image,
  ChatFlowState,
  CreateChatRequest,
  CreateVersionRequest,
  ImageGenerationResponse
} from '@/lib/types/chat';

export const useChatFlow = () => {
  const { data: session } = useSession();
  
  const [state, setState] = useState<ChatFlowState>({
    chats: [],
    currentChat: null,
    currentVersion: null,
    images: [],
    isLoading: false,
    isGenerating: false,
    error: null
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<ChatFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Create a new chat
  const createChat = useCallback(async (prompt: string, settings: any) => {
    if (!session?.user?.id) {
      updateState({ error: 'User not authenticated please login' });
      // redirect to login page
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const requestData: CreateChatRequest = {
        title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
        userID: session.user.id,
        prompt,
        settings: JSON.stringify(settings)
      };

      const response = await fetch('/api/chats/createchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      
      // Create the new chat object
      const newChat: Chat = {
        chatID: data.chatID,
        userID: session.user.id,
        title: requestData.title,
        createdAt: new Date()
      };

      const newVersion: Version = {
        versionID: data.versionID,
        chatID: data.chatID,
        versionNum: 1,
        prompt,
        settings: JSON.stringify(settings),
        createdAt: new Date()
      };

      // Update state with new chat and version
      updateState({
        chats: [newChat, ...state.chats],
        currentChat: newChat,
        currentVersion: newVersion,
        images: [],
        isLoading: false
      });

      return { chatID: data.chatID, versionID: data.versionID };
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to create chat',
        isLoading: false 
      });
      throw error;
    }
  }, [session, state.chats, updateState]);

  // Load chat by ID with all versions and images
  const loadChat = useCallback(async (chatID: number) => {
    if (!session?.user?.id) {
      updateState({ error: 'User not authenticated' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      // Load chat data (you'll need to create this API endpoint)
      const chatResponse = await fetch(`/api/chats/${chatID}`);
      if (!chatResponse.ok) {
        throw new Error('Failed to load chat');
      }

      const chatData = await chatResponse.json();
      
      // Find the latest version
      const latestVersion = chatData.versions.sort((a: Version, b: Version) => 
        b.versionNum - a.versionNum
      )[0];

      // Load images for the latest version
      const imagesResponse = await fetch(`/api/images/${latestVersion.versionID}`);
      const imagesData = await imagesResponse.json();

      updateState({
        currentChat: chatData.chat,
        currentVersion: latestVersion,
        images: imagesData.images || [],
        isLoading: false
      });

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to load chat',
        isLoading: false 
      });
      throw error;
    }
  }, [session, updateState]);

  // Add a new version to current chat
  const addVersion = useCallback(async (prompt: string, settings: any) => {
    if (!state.currentChat || !session?.user?.id) {
      updateState({ error: 'No active chat or user not authenticated' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const requestData: CreateVersionRequest = {
        prompt,
        settings: JSON.stringify(settings)
      };

      const response = await fetch(`/api/chats/${state.currentChat.chatID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create version');
      }

      const data = await response.json();
      
      const newVersion: Version = {
        versionID: data.versionID,
        chatID: state.currentChat.chatID,
        versionNum: state.currentVersion ? state.currentVersion.versionNum + 1 : 1,
        prompt,
        settings: JSON.stringify(settings),
        createdAt: new Date()
      };

      updateState({
        currentVersion: newVersion,
        images: [], // Clear images for new version
        isLoading: false
      });

      return { versionID: data.versionID };
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to create version',
        isLoading: false 
      });
      throw error;
    }
  }, [state.currentChat, state.currentVersion, session, updateState]);

  // Generate images for current version
  const generateImages = useCallback(async (model: string, additionalData?: any) => {
    if (!state.currentVersion || !session?.user?.id) {
      updateState({ error: 'No active version or user not authenticated' });
      return;
    }

    updateState({ isGenerating: true, error: null });

    try {
      // Parse settings from current version
      const settings = state.currentVersion.settings ? 
        JSON.parse(state.currentVersion.settings) : {};
      
      const requestData = {
        prompt: state.currentVersion.prompt,
        versionID: state.currentVersion.versionID,
        ...settings,
        ...additionalData
      };

      // Get the correct model endpoint
      const modelEndpoints: { [key: string]: string } = {
        'flux-headshot': '/api/models/flux/flux-headshot',
        'flux-portraits': '/api/models/flux/flux-portraits',
        'flux-hairstyle': '/api/models/flux/flux-hairstyle',
        'flux-kontext': '/api/models/flux/flux-kontext(edit)',
        'ideogram-v3': '/api/models/ideogram/v3-turbo',
        'imagen-4': '/api/models/google/imagen4',
        'openai-dalle': '/api/models/openai/image-1'
      };

      const endpoint = modelEndpoints[model];
      if (!endpoint) {
        throw new Error(`Unknown model: ${model}`);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to start image generation');
      }

      // Start polling for images
      startImagePolling(state.currentVersion.versionID);

    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to generate images',
        isGenerating: false 
      });
      throw error;
    }
  }, [state.currentVersion, session, updateState]);

  // Poll for image generation status
  const startImagePolling = useCallback((versionID: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/images/${versionID}`);
        const data: ImageGenerationResponse = await response.json();

        if (data.status === 'completed' && data.images.length > 0) {
          updateState({
            images: data.images,
            isGenerating: false
          });
          clearInterval(pollInterval);
        } else if (data.status === 'error') {
          updateState({
            error: data.message || 'Image generation failed',
            isGenerating: false
          });
          clearInterval(pollInterval);
        }
        // Continue polling if status is 'generating'
      } catch (error) {
        updateState({
          error: 'Failed to check image status',
          isGenerating: false
        });
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (state.isGenerating) {
        updateState({
          error: 'Image generation timed out',
          isGenerating: false
        });
      }
    }, 300000);
  }, [state.isGenerating, updateState]);

  // Load user's chats
  const loadUserChats = useCallback(async () => {
    if (!session?.user?.id) return;

    updateState({ isLoading: true, error: null });

    try {
      // You'll need to create this API endpoint
      const response = await fetch(`/api/chats/user/${session.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }

      const data = await response.json();
      updateState({
        chats: data.chats || [],
        isLoading: false
      });
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to load chats',
        isLoading: false 
      });
    }
  }, [session, updateState]);

  // Load chats on mount if user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      loadUserChats();
    }
  }, [session, loadUserChats]);

  return {
    // State
    ...state,
    
    // Actions
    createChat,
    loadChat,
    addVersion,
    generateImages,
    loadUserChats,
    
    // Utilities
    clearError,
    isAuthenticated: !!session?.user?.id,
    user: session?.user || null
  };
};