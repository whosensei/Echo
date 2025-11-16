/**
 * API Route: Generate S3 Presigned URL
 * Generates presigned URLs for direct client-to-S3 uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3-service';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

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

    const { filename, contentType, isEncrypted } = await request.json();
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Validate content type (allow audio files and encrypted files)
    const validContentTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/flac',
      'audio/aac',
      'application/octet-stream', // For encrypted files
    ];
    const finalContentType = contentType || (isEncrypted ? 'application/octet-stream' : 'audio/wav');
    
    if (!validContentTypes.includes(finalContentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Initialize S3 service
    const s3Service = new S3Service();

    // Generate presigned URL for upload (5 minutes expiration)
    const presignedData = await s3Service.generatePresignedUploadUrl(
      filename,
      finalContentType,
      300 // 5 minutes
    );

    return NextResponse.json({
      success: true,
      uploadUrl: presignedData.uploadUrl,
      fileKey: presignedData.fileKey,
      publicUrl: presignedData.publicUrl,
      expiresIn: 300,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to prepare upload. Please try again.' },
      { status: 500 }
    );
  }
}
