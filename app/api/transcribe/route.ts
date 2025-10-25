/**
 * API Route: Transcribe Audio
 * Handles audio transcription using AssemblyAI API with S3 storage
 * Features enabled: Speaker Diarization, Entity Detection, Sentiment Analysis,
 * Auto Chapters (Topic Detection), and Summarization
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3-service';
import { AssemblyAIService } from '@/lib/assemblyai-service';

export async function POST(request: NextRequest) {
  try {
    const { fileKey, s3Url } = await request.json();
    
    if (!fileKey && !s3Url) {
      return NextResponse.json(
        { error: 'File key or S3 URL is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const s3Service = new S3Service();
    const assemblyAIService = new AssemblyAIService();

    // Download the audio file from S3
    console.log('Downloading audio from S3...');
    const audioBuffer = await s3Service.downloadFile(fileKey);
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });

    // Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await assemblyAIService.uploadAudio(audioBlob);
    console.log('Upload response:', JSON.stringify(uploadResponse, null, 2));
    
    // Initiate transcription with ALL features enabled in one request
    console.log('Initiating transcription with all features...');
    const transcriptionRequest = {
      audio_url: uploadResponse.upload_url,
      summarization: true,                // Summarization
      iab_categories: true,               // IAB Categories (Topic Classification)
      sentiment_analysis: true,           // Sentiment Analysis
      speaker_labels: true,               // Speaker Diarization
      format_text: true,                  // Format text (proper casing, etc.)
      punctuate: true,                    // Add punctuation
      speech_model: 'universal' as const, // Universal speech model
      language_detection: true,           // Auto-detect language
      entity_detection: true,             // Entity Detection
      // auto_chapters: true,             // Disabled: Cannot be used with summarization
      summary_model: 'informative' as const,
      summary_type: 'bullets' as const,
      speech_understanding: {
        request: {
          speaker_identification: {
            speaker_type: 'name' as const,
            known_values: [],             // Add known speaker names if available
          },
        },
      },
    };
    
    console.log('Sending transcription request:', JSON.stringify(transcriptionRequest, null, 2));
    
    const initResponse = await assemblyAIService.initiateTranscription(transcriptionRequest);

    console.log('Transcription initiated successfully');
    console.log('Full init response:', JSON.stringify(initResponse, null, 2));
    
    const transcriptionId = initResponse.id;
    
    if (!transcriptionId) {
      throw new Error('No transcription ID found in AssemblyAI response');
    }
    
    return NextResponse.json({
      success: true,
      requestId: transcriptionId,
      status: initResponse.status,
      fullResponse: initResponse, // Include full response for debugging
    });

  } catch (error) {
    console.error('Error initiating transcription:', error);
    return NextResponse.json(
      { error: `Failed to initiate transcription: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/transcribe called');
    console.log('Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    
    console.log('Extracted requestId:', requestId);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    
    if (!requestId) {
      console.log('No requestId found in search params');
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Initialize AssemblyAI service
    const assemblyAIService = new AssemblyAIService();

    // Get transcription result
    const result = await assemblyAIService.getTranscriptionResult(requestId);
    
    console.log('Get transcription successful');
    console.log('Status:', result.status);

    // Convert to standardized format
    const standardFormat = assemblyAIService.convertToStandardFormat(result);

    return NextResponse.json({
      success: true,
      result: standardFormat,
      rawResult: result, // Include raw AssemblyAI result for debugging
    });

  } catch (error) {
    console.error('Error getting transcription result:', error);
    return NextResponse.json(
      { error: `Failed to get transcription result: ${error}` },
      { status: 500 }
    );
  }
}
