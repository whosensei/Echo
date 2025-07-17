export interface Chat {
  chatID: number;
  userID: string;
  title: string | null;
  createdAt: Date | null;
  versionCount?: number;
  latestVersionNum?: number;
}

export interface Version {
  versionID: number;
  chatID: number;
  versionNum: number;
  prompt: string | null;
  settings: string | null; // JSON string
  createdAt: Date | null;
}

export interface Image {
  imageID: number;
  versionID: number;
  userID: string;
  chatID: number;
  imageUrl: string;
  prompt: string | null;
  model: string | null;
  visibility: 'public' | 'private' | null;
  predictionID: number | null;
  createdAt: Date | null;
}

export interface Prediction {
  predictionID: number;
  versionID: number;
  replicateID: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string | null; // JSON string
  error: string | null;
  model: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ChatWithVersions extends Chat {
  versions: Version[];
}

export interface VersionWithImages extends Version {
  images: Image[];
}

export interface CreateChatRequest {
  title: string;
  userID: string;
  prompt: string;
  settings: string;
}

export interface CreateVersionRequest {
  prompt: string;
  settings: string;
}

export interface ImageGenerationResponse {
  status: 'generating' | 'completed' | 'error';
  images: Image[];
  message?: string;
}

export interface ChatFlowState {
  chats: Chat[];
  currentChat: Chat | null;
  currentVersion: Version | null;
  images: Image[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}