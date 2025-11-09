/**
 * AssemblyAI API Service
 * Handles audio transcription with advanced features:
 * - Speaker Diarization
 * - Entity Detection
 * - Sentiment Analysis
 * - Auto Chapters (Topic Detection)
 * - Summarization
 */

import axios from 'axios';
import { config } from '@/config/env';

// ============================================================================
// AssemblyAI API Interfaces
// ============================================================================

export interface AssemblyAIUploadResponse {
  upload_url: string;
}

export interface SpeakerIdentificationConfig {
  speaker_type: 'name' | 'role';
  known_values?: string[];
}

export interface SpeechUnderstandingConfig {
  request: {
    speaker_identification?: SpeakerIdentificationConfig;
  };
}

export interface AssemblyAITranscriptionRequest {
  audio_url: string;
  speaker_labels?: boolean;
  entity_detection?: boolean;
  sentiment_analysis?: boolean;
  auto_chapters?: boolean;
  summarization?: boolean;
  summary_model?: 'informative' | 'conversational' | 'catchy';
  summary_type?: 'bullets' | 'bullets_verbose' | 'gist' | 'headline' | 'paragraph';
  iab_categories?: boolean;
  format_text?: boolean;
  punctuate?: boolean;
  speech_model?: string;
  language_code?: string;
  language_detection?: boolean;
  speech_understanding?: SpeechUnderstandingConfig;
}

export interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface AssemblyAIUtterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  words: AssemblyAIWord[];
}

export interface AssemblyAIEntity {
  entity_type: string;
  text: string;
  start: number;
  end: number;
}

export interface AssemblyAISentimentResult {
  text: string;
  start: number;
  end: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  speaker?: string;
}

export interface AssemblyAIChapter {
  summary: string;
  headline: string;
  gist: string;
  start: number;
  end: number;
}

export interface IABCategory {
  label: string;
  relevance: number;
  timestamp?: {
    start: number;
    end: number;
  };
}

export interface IABCategoriesResult {
  summary: Record<string, number>;
  results: Array<{
    text: string;
    labels: Array<{
      relevance: number;
      label: string;
    }>;
    timestamp: {
      start: number;
      end: number;
    };
  }>;
}

export interface AssemblyAITranscriptionResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string;
  words?: AssemblyAIWord[];
  utterances?: AssemblyAIUtterance[];
  entities?: AssemblyAIEntity[];
  sentiment_analysis_results?: AssemblyAISentimentResult[];
  chapters?: AssemblyAIChapter[];
  summary?: string;
  iab_categories_result?: IABCategoriesResult;
  audio_duration?: number;
  language_code?: string;
  punctuate?: boolean;
  format_text?: boolean;
  error?: string;
}

// ============================================================================
// Transcription Result Interfaces
// ============================================================================

export interface Speaker {
  speaker: string;
  time_begin: number;
  time_end: number;
}

export interface TranscriptionSegment {
  language: string;
  time_begin: number;
  time_end: number;
  transcription: string;
  confidence: number;
  speaker?: string;
}

export interface NamedEntity {
  entity: string;
  type: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

export interface TranscriptionResult {
  id: string;
  request_id: string;
  status: 'done' | 'error' | 'processing' | 'queued';
  result: {
    transcription: {
      full_transcript: string;
      utterances: TranscriptionSegment[];
    };
    speakers: Speaker[];
    named_entities?: NamedEntity[];
    sentiment_analysis?: AssemblyAISentimentResult[];
    chapters?: AssemblyAIChapter[];
    summary?: string;
    iab_categories?: IABCategoriesResult;
    metadata: {
      audio_duration: number;
      number_of_distinct_speakers: number;
    };
  };
  error?: string;
}

// ============================================================================
// AssemblyAI Service Class
// ============================================================================

export class AssemblyAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.assemblyai.apiKey;
    this.baseUrl = config.assemblyai.baseUrl;
    
    if (!this.apiKey) {
      throw new Error('AssemblyAI API key is required');
    }
  }

  private getHeaders() {
    return {
      'authorization': this.apiKey,
      'content-type': 'application/json',
    };
  }

  /**
   * Upload audio file to AssemblyAI
   * https://www.assemblyai.com/docs/getting-started/transcribe-an-audio-file
   */
  async uploadAudio(audioBlob: Blob): Promise<AssemblyAIUploadResponse> {
    try {
      console.log('Uploading audio to AssemblyAI...');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const response = await axios.post(
        `${this.baseUrl}/upload`,
        buffer,
        {
          headers: {
            'authorization': this.apiKey,
            'content-type': 'application/octet-stream',
          },
        }
      );

      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading audio to AssemblyAI:', error);
      throw new Error(`Failed to upload audio: ${error}`);
    }
  }

  /**
   * Initiate transcription with all features enabled
   * https://www.assemblyai.com/docs/pre-recorded-audio
   */
  async initiateTranscription(request: AssemblyAITranscriptionRequest): Promise<AssemblyAITranscriptionResult> {
    try {
      console.log('Initiating AssemblyAI transcription with config:', request);

      const response = await axios.post(
        `${this.baseUrl}/transcript`,
        request,
        {
          headers: this.getHeaders(),
        }
      );

      console.log('Transcription initiated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initiating transcription:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
        throw new Error(`AssemblyAI API error (${axiosError.response.status}): ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Failed to initiate transcription: ${error}`);
    }
  }

  /**
   * Get transcription result by ID
   * https://www.assemblyai.com/docs/pre-recorded-audio
   */
  async getTranscriptionResult(transcriptId: string): Promise<AssemblyAITranscriptionResult> {
    try {
      console.log('Fetching transcription result for ID:', transcriptId);
      
      const response = await axios.get(
        `${this.baseUrl}/transcript/${transcriptId}`,
        {
          headers: this.getHeaders(),
        }
      );

      console.log('Transcription status:', response.data.status);
      return response.data;
    } catch (error) {
      console.error('Error getting transcription result:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
      }
      throw new Error(`Failed to get transcription result: ${error}`);
    }
  }

  /**
   * List all transcripts
   * https://www.assemblyai.com/docs/api-reference/transcripts/list
   */
  async listTranscriptions(limit: number = 10): Promise<{ transcripts: AssemblyAITranscriptionResult[] }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transcript?limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error listing transcriptions:', error);
      throw new Error(`Failed to list transcriptions: ${error}`);
    }
  }

  /**
   * Poll for transcription completion
   */
  async waitForTranscription(
    transcriptId: string, 
    maxAttempts: number = 60, 
    intervalMs: number = 5000
  ): Promise<AssemblyAITranscriptionResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const result = await this.getTranscriptionResult(transcriptId);
      
      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }
    
    throw new Error('Transcription timeout - took too long to complete');
  }

  /**
   * Convert AssemblyAI result to standardized format
   */
  convertToStandardFormat(assemblyResult: AssemblyAITranscriptionResult): TranscriptionResult {
    // Extract unique speakers from utterances
    const speakers: Speaker[] = [];
    const speakerMap = new Map<string, { first: number; last: number }>();

    if (assemblyResult.utterances) {
      assemblyResult.utterances.forEach(utterance => {
        const speaker = utterance.speaker;
        if (!speakerMap.has(speaker)) {
          speakerMap.set(speaker, { first: utterance.start, last: utterance.end });
        } else {
          const current = speakerMap.get(speaker)!;
          current.last = Math.max(current.last, utterance.end);
        }
      });

      speakerMap.forEach((times, speaker) => {
        speakers.push({
          speaker,
          time_begin: times.first,
          time_end: times.last,
        });
      });
    }

    // Convert utterances to transcription segments
    const utterances: TranscriptionSegment[] = assemblyResult.utterances?.map(utterance => ({
      language: assemblyResult.language_code || 'en',
      time_begin: utterance.start,
      time_end: utterance.end,
      transcription: utterance.text,
      confidence: utterance.confidence,
      speaker: utterance.speaker,
    })) || [];

    // Convert entities
    const named_entities: NamedEntity[] = assemblyResult.entities?.map(entity => ({
      entity: entity.text,
      type: entity.entity_type,
      confidence: 1.0, // AssemblyAI doesn't provide confidence for entities
      start_time: entity.start,
      end_time: entity.end,
    })) || [];

    // Map status
    const statusMap: Record<string, 'done' | 'error' | 'processing' | 'queued'> = {
      'completed': 'done',
      'error': 'error',
      'processing': 'processing',
      'queued': 'queued',
    };

    return {
      id: assemblyResult.id,
      request_id: assemblyResult.id,
      status: statusMap[assemblyResult.status] || 'queued',
      result: {
        transcription: {
          full_transcript: assemblyResult.text || '',
          utterances,
        },
        speakers,
        named_entities: named_entities.length > 0 ? named_entities : undefined,
        sentiment_analysis: assemblyResult.sentiment_analysis_results,
        chapters: assemblyResult.chapters,
        summary: assemblyResult.summary,
        iab_categories: assemblyResult.iab_categories_result,
        metadata: {
          audio_duration: assemblyResult.audio_duration || 0,
          number_of_distinct_speakers: speakers.length,
        },
      },
      error: assemblyResult.error,
    };
  }
}
