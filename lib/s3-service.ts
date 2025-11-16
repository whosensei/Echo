/**
 * AWS S3 Service
 * Handles file uploads, downloads, and presigned URL generation for S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/config/env';

export interface PresignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export interface S3UploadResponse {
  success: boolean;
  fileKey: string;
  publicUrl: string;
  size?: number;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.aws.s3.bucketName;
    
    this.s3Client = new S3Client({
      region: config.aws.s3.region,
      credentials: {
        accessKeyId: config.aws.s3.accessKeyId,
        secretAccessKey: config.aws.s3.secretAccessKey,
      },
    });
  }

  /**
   * Generate a presigned URL for uploading a file to S3
   * @param filename - The name of the file to upload
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
   */
  async generatePresignedUploadUrl(
    filename: string,
    contentType: string = 'audio/wav',
    expiresIn: number = 300
  ): Promise<PresignedUploadUrl> {
    try {
      // Create a unique file key with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileKey = `audio-recordings/${timestamp}_${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: contentType,
        ServerSideEncryption: 'AES256', // Enable server-side encryption at rest
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      // Construct the public URL (will be accessible after upload)
      const publicUrl = `https://${this.bucketName}.s3.${config.aws.s3.region}.amazonaws.com/${fileKey}`;

      return {
        uploadUrl,
        fileKey,
        publicUrl,
      };
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new Error(`Failed to generate presigned upload URL: ${error}`);
    }
  }

  /**
   * Generate a presigned URL for downloading a file from S3
   * @param fileKey - The S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async generatePresignedDownloadUrl(
    fileKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return downloadUrl;
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new Error(`Failed to generate presigned download URL: ${error}`);
    }
  }

  /**
   * Upload a file directly to S3 (server-side upload)
   * @param buffer - File buffer
   * @param filename - Original filename
   * @param contentType - MIME type
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string = 'audio/wav'
  ): Promise<S3UploadResponse> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileKey = `audio-recordings/${timestamp}_${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256', // Enable server-side encryption at rest
      });

      await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.s3.${config.aws.s3.region}.amazonaws.com/${fileKey}`;

      return {
        success: true,
        fileKey,
        publicUrl,
        size: buffer.length,
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Download a file from S3
   * @param fileKey - The S3 object key
   */
  async downloadFile(fileKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file content received from S3');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading file from S3:', error);
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  }

  /**
   * Delete a file from S3
   * @param fileKey - The S3 object key
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      console.log(`Successfully deleted file: ${fileKey}`);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  }

  /**
   * Check if a file exists in S3
   * @param fileKey - The S3 object key
   */
  async fileExists(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get the public URL for a file (assumes public read access or presigned URL needed)
   * @param fileKey - The S3 object key
   */
  getPublicUrl(fileKey: string): string {
    return `https://${this.bucketName}.s3.${config.aws.s3.region}.amazonaws.com/${fileKey}`;
  }

  /**
   * Extract file key from S3 URL
   * @param url - S3 URL
   */
  static extractFileKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Handle both path-style and virtual-hosted-style URLs
      const path = urlObj.pathname;
      return path.startsWith('/') ? path.substring(1) : path;
    } catch (error) {
      console.error('Error extracting file key from URL:', error);
      return null;
    }
  }
}
