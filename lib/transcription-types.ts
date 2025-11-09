/**
 * Transcription type definitions
 */

import { TranscriptionResult } from './assemblyai-service';
import { MeetingSummary } from './gemini-service';

export interface StoredTranscription {
  id: string;
  filename: string;
  timestamp: string;
  duration?: number;
  status: 'processing' | 'completed' | 'failed';
  transcriptionData?: TranscriptionResult;
  summaryData?: MeetingSummary;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  audioPath?: string;
  audioData?: string;
  recordingId?: string;
}
