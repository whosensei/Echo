import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3-service';
import { AssemblyAIService } from '@/lib/assemblyai-service';
import { ingestTranscriptionMinutes, checkTranscriptionLimit } from '@/lib/billing/usage';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { rateLimit, RATE_LIMITS, formatResetTime } from '@/lib/redis-rate-limit';
import { decryptAudioFile, type DecryptionParams } from '@/lib/server-decryption';
import { db } from '@/lib/db';
import { recording } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decryptPassword } from '@/lib/password-encryption';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user for usage checks
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rateLimitResult = await rateLimit(
      `transcribe:${session.user.id}`,
      RATE_LIMITS.TRANSCRIBE
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many transcription requests. Please try again after ${formatResetTime(rateLimitResult.resetTime)}`,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.TRANSCRIBE.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const { fileKey, s3Url, isEncrypted, encryptionPassword, recordingId } = await request.json();

    if (!fileKey && !s3Url) {
      return NextResponse.json(
        { error: 'Audio file information is required' },
        { status: 400 }
      );
    }

    //to check if the usage are in limits before sending the request
    const estimatedMinutes = 1;
    const limitCheck = await checkTranscriptionLimit(session.user.id, estimatedMinutes);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Transcription limit exceeded',
          message: `You have used ${limitCheck.used.toFixed(1)} of ${limitCheck.limit} transcription minutes. Please upgrade your plan to continue.`,
          used: limitCheck.used,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
        },
        { status: 403 }
      );
    }

    const s3Service = new S3Service();
    const assemblyAIService = new AssemblyAIService();

    console.log('Downloading audio from S3...');
    let audioBuffer = await s3Service.downloadFile(fileKey);

    //decrypt the audio file if its encrypted, step1 - get the key.
    if (isEncrypted) {
      console.log('File is encrypted, fetching decryption params from database...');

      let rec;
      
      if (recordingId) {
        const recordings = await db
          .select()
          .from(recording)
          .where(eq(recording.id, recordingId))
          .limit(1);
        
        if (recordings.length === 0) {
          return NextResponse.json(
            { error: 'Recording not found in database' },
            { status: 404 }
          );
        }
        rec = recordings[0];
      } else if (s3Url) {
        const recordings = await db
          .select()
          .from(recording)
          .where(eq(recording.audioFileUrl, s3Url))
          .limit(1);

        if (recordings.length === 0) {
          return NextResponse.json(
            { error: 'Recording not found in database' },
            { status: 404 }
          );
        }
        rec = recordings[0];
      } else {
        return NextResponse.json(
          { error: 'Recording information required for encrypted files' },
          { status: 400 }
        );
      }

      if (!rec.encryptionIV || !rec.encryptionSalt) {
        return NextResponse.json(
          { error: 'Encryption metadata not found for this recording' },
          { status: 400 }
        );
      }

      let decryptionPassword = encryptionPassword;
      
      if (!decryptionPassword && rec.encryptedPassword) {
        try {
          decryptionPassword = decryptPassword(rec.encryptedPassword);
        } catch (error) {
          console.error('Failed to decrypt password from database:', error);
          return NextResponse.json(
            { error: 'Failed to decrypt encryption password' },
            { status: 500 }
          );
        }
      }

      if (!decryptionPassword) {
        return NextResponse.json(
          { error: 'Encryption password required for encrypted files' },
          { status: 400 }
        );
      }

      //step-2 decrypting using the password found.
      try {
        console.log('Decrypting audio file...');
        const decryptionParams: DecryptionParams = {
          iv: rec.encryptionIV,
          salt: rec.encryptionSalt,
          password: encryptionPassword,
        };

        audioBuffer = decryptAudioFile(audioBuffer, decryptionParams);
        console.log('Audio file decrypted successfully');
      } catch (error) {
        console.error('Decryption failed:', error);
        return NextResponse.json(
          { error: 'Failed to decrypt audio file. Invalid password or corrupted data.' },
          { status: 400 }
        );
      }
    }

    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });

    // Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await assemblyAIService.uploadAudio(audioBlob);
    console.log('Upload response:', JSON.stringify(uploadResponse, null, 2));
    
    console.log('Initiating transcription with all features...');
    const transcriptionRequest = {
      audio_url: uploadResponse.upload_url,
      summarization: true,                
      iab_categories: true,               
      sentiment_analysis: true,           
      speaker_labels: true,               
      format_text: true,                  
      punctuate: true,                    
      speech_model: 'universal' as const, 
      language_detection: true,           
      language_detection_options: {       
        code_switching: true,
      },
      entity_detection: true,             
      summary_model: 'informative' as const,
      summary_type: 'bullets' as const,
      speech_understanding: {
        request: {
          speaker_identification: {
            speaker_type: 'name' as const,
            known_values: [],            
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
    });

  } catch (error) {
    console.error('Error initiating transcription:', error);
    return NextResponse.json(
      { error: `Failed to initiate transcription: ${error}` },
      { status: 500 }
    );
  }
}

// to check if the transcription is completed and fetch it if yes.
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

    const standardFormat = assemblyAIService.convertToStandardFormat(result);

    // Ingest usage only when transcription is completed
    try {
      if (result.status === 'completed') {
        // Fetch authenticated user to attribute usage
        const session = await auth.api.getSession({
          headers: await headers(),
        });
        const userId = (session as any)?.user?.id;

        // audio_duration is in seconds; convert to minutes (float)
        const seconds = standardFormat?.result?.metadata?.audio_duration ?? 0;
        const minutes = Math.max(0, seconds / 60);

        if (userId && minutes > 0) {
          await ingestTranscriptionMinutes({
            userId,
            minutes,
            recordingId: requestId,
            model: 'assemblyai',
            source: 'transcribe_api',
          });
        }
      }
    } catch (ingestErr) {
      console.warn('Failed to ingest transcription minutes:', ingestErr);
      // Do not fail the endpoint for billing ingestion errors
    }

    return NextResponse.json({
      success: true,
      result: standardFormat,
    });

  } catch (error) {
    console.error('Error getting transcription result:', error);
    return NextResponse.json(
      { error: `Failed to get transcription result: ${error}` },
      { status: 500 }
    );
  }
}
