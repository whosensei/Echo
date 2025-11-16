/**
 * API Route: Upload Audio
 * Handles audio file upload and saves to AWS S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3-service';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { rateLimit, RATE_LIMITS, formatResetTime } from '@/lib/redis-rate-limit';
import { validateAudioFile, isSupportedMimeType } from '@/lib/file-validator';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting (10 uploads per hour per user)
    const rateLimitResult = await rateLimit(
      `upload:${session.user.id}`,
      RATE_LIMITS.UPLOAD
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many upload requests. Please try again after ${formatResetTime(rateLimitResult.resetTime)}`,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.UPLOAD.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check if file is encrypted
    const isEncrypted = formData.get('isEncrypted') === 'true';
    const encryptionIV = formData.get('encryptionIV') as string | null;
    const encryptionSalt = formData.get('encryptionSalt') as string | null;

    // Validate file size (max 2GB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 2GB limit' },
        { status: 413 }
      );
    }

    // For encrypted files, skip MIME type and signature validation (file is binary ciphertext)
    if (!isEncrypted) {
      // Validate MIME type is supported
      if (!isSupportedMimeType(audioFile.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only audio files are allowed (WAV, MP3, M4A, OGG, WebM, FLAC, AAC).' },
          { status: 400 }
        );
      }
    }

    // Convert file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For unencrypted files, validate file signature (magic numbers) to prevent file type spoofing
    if (!isEncrypted) {
      const validationResult = validateAudioFile(buffer, audioFile.type);
      if (!validationResult.valid) {
        console.error('File validation failed:', validationResult.error);
        return NextResponse.json(
          {
            error: 'File validation failed',
            message: validationResult.error,
          },
          { status: 400 }
        );
      }
    }
    
    // Initialize S3 service
    const s3Service = new S3Service();

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      buffer,
      audioFile.name,
      audioFile.type
    );

    // Return file information with S3 URL and encryption metadata
    return NextResponse.json({
      success: true,
      filename: audioFile.name,
      fileKey: uploadResult.fileKey,
      s3Url: uploadResult.publicUrl,
      size: audioFile.size,
      type: audioFile.type,
      timestamp: new Date().toISOString(),
      // Include encryption metadata
      isEncrypted,
      encryptionIV,
      encryptionSalt,
    });

  } catch (error) {
    console.error('Error uploading audio to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file to S3' },
      { status: 500 }
    );
  }
}
