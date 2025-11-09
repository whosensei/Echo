/**
 * API Route: Upload Audio
 * Handles audio file upload and saves to AWS S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.includes('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Initialize S3 service
    const s3Service = new S3Service();

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      buffer,
      audioFile.name,
      audioFile.type
    );

    // Return file information with S3 URL
    return NextResponse.json({
      success: true,
      filename: audioFile.name,
      fileKey: uploadResult.fileKey,
      s3Url: uploadResult.publicUrl,
      size: audioFile.size,
      type: audioFile.type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error uploading audio to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file to S3' },
      { status: 500 }
    );
  }
}
