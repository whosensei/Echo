/**
 * React Hook: useAudioDecryption
 * Handles client-side decryption of encrypted audio files for playback
 */

import { useState, useCallback } from 'react';
import {
  decryptAudioFile,
  isWebCryptoAvailable,
  type DecryptionParams
} from '@/lib/encryption-service';
import { getGlobalPassword, getEncryptionPassword } from '@/lib/key-storage';

export interface EncryptedAudioData {
  audioUrl: string;
  isEncrypted: boolean;
  encryptionIV?: string | null;
  encryptionSalt?: string | null;
}

export interface DecryptedAudioResult {
  blobUrl: string | null;
  isDecrypting: boolean;
  error: string | null;
  needsPassword: boolean;
}

/**
 * Hook to decrypt and play encrypted audio files
 * @param recordingId - Recording ID (optional, for per-recording password lookup)
 */
export function useAudioDecryption(recordingId?: string) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);

  /**
   * Decrypt audio file and create blob URL for playback
   * @param audioData - Audio data with encryption metadata
   * @param password - Optional password (if not in session storage)
   * @returns Blob URL or null
   */
  const decryptAudio = useCallback(async (
    audioData: EncryptedAudioData,
    password?: string
  ): Promise<string | null> => {
    // If not encrypted, return original URL
    if (!audioData.isEncrypted) {
      return audioData.audioUrl;
    }

    // Check if Web Crypto API is available
    if (!isWebCryptoAvailable()) {
      setError('Your browser does not support encryption. Please use a modern browser.');
      return null;
    }

    // Validate encryption metadata
    if (!audioData.encryptionIV || !audioData.encryptionSalt) {
      setError('Encryption metadata is missing for this recording.');
      return null;
    }

    setIsDecrypting(true);
    setError(null);
    setNeedsPassword(false);

    try {
      // Get password from session storage or parameter
      let decryptionPassword = password;

      if (!decryptionPassword && recordingId) {
        decryptionPassword = getEncryptionPassword(recordingId) || undefined;
      }

      if (!decryptionPassword) {
        decryptionPassword = getGlobalPassword() || undefined;
      }

      if (!decryptionPassword) {
        setNeedsPassword(true);
        setError('Encryption password required. Please enter your password.');
        setIsDecrypting(false);
        return null;
      }

      // Download encrypted file from presigned URL
      console.log('Downloading encrypted audio...');
      const response = await fetch(audioData.audioUrl);

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const encryptedData = await response.arrayBuffer();
      console.log('Downloaded encrypted data:', encryptedData.byteLength, 'bytes');

      // Decrypt the audio file
      console.log('Decrypting audio...');
      const decryptionParams: DecryptionParams = {
        iv: audioData.encryptionIV,
        salt: audioData.encryptionSalt,
      };

      const decryptedData = await decryptAudioFile(
        encryptedData,
        decryptionPassword,
        decryptionParams
      );
      console.log('Audio decrypted successfully:', decryptedData.byteLength, 'bytes');

      // Create blob from decrypted data
      // Assuming original was audio (could be wav, mp3, etc.)
      const audioBlob = new Blob([decryptedData], { type: 'audio/mpeg' });
      const blobObjectUrl = URL.createObjectURL(audioBlob);

      setBlobUrl(blobObjectUrl);
      setIsDecrypting(false);

      return blobObjectUrl;
    } catch (err) {
      console.error('Decryption error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt audio';

      if (errorMessage.includes('Invalid password') || errorMessage.includes('Decryption failed')) {
        setError('Invalid password. Please check your password and try again.');
        setNeedsPassword(true);
      } else {
        setError(errorMessage);
      }

      setIsDecrypting(false);
      return null;
    }
  }, [recordingId]);

  /**
   * Clean up blob URL to prevent memory leaks
   */
  const cleanup = useCallback(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setError(null);
    setNeedsPassword(false);
  }, [blobUrl]);

  return {
    decryptAudio,
    cleanup,
    blobUrl,
    isDecrypting,
    error,
    needsPassword,
  };
}
