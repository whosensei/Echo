/**
 * Server-Side Decryption Service
 * Uses Node.js crypto module for AES-256-GCM decryption
 *
 * This is used on the server to decrypt files before sending to AssemblyAI
 */

import { createDecipheriv, pbkdf2Sync } from 'crypto';

export interface DecryptionParams {
  iv: string;              // Base64-encoded IV from database
  salt: string;            // Base64-encoded salt from database
  password: string;        // Encryption password
}

/**
 * Derive encryption key from password using PBKDF2
 * @param password - User's encryption password
 * @param salt - Salt buffer (16 bytes)
 * @param iterations - PBKDF2 iterations (default: 100000)
 * @returns Key buffer (32 bytes for AES-256)
 */
function deriveKeyFromPassword(
  password: string,
  salt: Buffer,
  iterations: number = 100000
): Buffer {
  // PBKDF2 with SHA-256, 32 bytes output for AES-256
  return pbkdf2Sync(password, salt, iterations, 32, 'sha256');
}

/**
 * Decrypt audio file with AES-256-GCM (server-side)
 * @param encryptedBuffer - Encrypted Buffer
 * @param params - Decryption parameters (IV, salt, password)
 * @returns Decrypted Buffer
 */
export function decryptAudioFile(
  encryptedBuffer: Buffer,
  params: DecryptionParams
): Buffer {
  try {
    // Decode IV and salt from Base64
    const iv = Buffer.from(params.iv, 'base64');
    const salt = Buffer.from(params.salt, 'base64');

    // Derive decryption key from password
    const key = deriveKeyFromPassword(params.password, salt);

    // AES-GCM stores the authentication tag at the end of ciphertext
    // For GCM mode, the tag is typically 16 bytes
    const authTagLength = 16;
    const ciphertext = encryptedBuffer.slice(0, -authTagLength);
    const authTag = encryptedBuffer.slice(-authTagLength);

    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed. Invalid password or corrupted data.');
  }
}

/**
 * Check if buffer appears to be encrypted (heuristic check)
 * This is a simple check - encrypted data should look random
 * @param buffer - Buffer to check
 * @returns true if buffer appears to be encrypted
 */
export function isBufferEncrypted(buffer: Buffer): boolean {
  if (buffer.length < 100) return false;

  // Check for common audio file signatures (magic numbers)
  const magicNumbers = [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WAV)
    [0x49, 0x44, 0x33],       // ID3 (MP3)
    [0xFF, 0xFB],             // MP3 frame sync
    [0xFF, 0xF3],             // MP3 frame sync (MPEG-1 Layer 3)
    [0xFF, 0xF2],             // MP3 frame sync (MPEG-2 Layer 3)
    [0x66, 0x74, 0x79, 0x70], // ftyp (MP4/M4A)
    [0x4F, 0x67, 0x67, 0x53], // OggS (OGG)
    [0x1A, 0x45, 0xDF, 0xA3], // EBML (WebM)
    [0x66, 0x4C, 0x61, 0x43], // fLaC (FLAC)
  ];

  // If buffer starts with any known audio signature, it's NOT encrypted
  for (const magic of magicNumbers) {
    let matches = true;
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return false;
  }

  // If we don't recognize the signature, assume it's encrypted
  return true;
}
