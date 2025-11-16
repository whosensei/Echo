/**
 * Client-Side Encryption Service
 * Uses Web Crypto API for AES-256-GCM encryption/decryption
 *
 * Security Model:
 * - Files are encrypted client-side before upload
 * - Encryption key derived from user password using PBKDF2
 * - IV (12 bytes) and salt (16 bytes) stored in database
 * - S3 stores encrypted ciphertext only
 */

export interface EncryptedFile {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;          // 12 bytes for AES-GCM
  salt: Uint8Array;        // 16 bytes for PBKDF2
  ivBase64: string;        // For database storage
  saltBase64: string;      // For database storage
}

export interface DecryptionParams {
  iv: string;              // Base64-encoded IV from database
  salt: string;            // Base64-encoded salt from database
}

/**
 * Derive encryption key from password using PBKDF2
 * @param password - User's encryption password
 * @param salt - Salt for key derivation (16 bytes)
 * @param iterations - PBKDF2 iterations (default: 100000)
 * @returns CryptoKey for AES-GCM encryption/decryption
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  // Encode password as UTF-8
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as a key for PBKDF2
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key from password
  // Ensure salt is compatible with BufferSource (Web Crypto API requirement)
  const saltBuffer: BufferSource = new Uint8Array(salt);
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt audio file with AES-256-GCM
 * @param file - File object to encrypt
 * @param password - User's encryption password
 * @returns EncryptedFile with ciphertext, IV, and salt
 */
export async function encryptAudioFile(
  file: File,
  password: string
): Promise<EncryptedFile> {
  // Generate random salt for PBKDF2
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate random IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key from password
  const key = await deriveKeyFromPassword(password, salt);

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt file data
  // Ensure iv is compatible with BufferSource (Web Crypto API requirement)
  const ivBuffer: BufferSource = new Uint8Array(iv);
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    fileBuffer
  );

  // Convert IV and salt to Base64 for database storage
  const ivBase64 = arrayBufferToBase64(iv);
  const saltBase64 = arrayBufferToBase64(salt);

  return {
    encryptedData,
    iv,
    salt,
    ivBase64,
    saltBase64
  };
}

/**
 * Decrypt audio file with AES-256-GCM
 * @param encryptedData - Encrypted ArrayBuffer
 * @param password - User's encryption password
 * @param params - Decryption parameters (IV and salt from database)
 * @returns Decrypted ArrayBuffer
 */
export async function decryptAudioFile(
  encryptedData: ArrayBuffer,
  password: string,
  params: DecryptionParams
): Promise<ArrayBuffer> {
  // Decode IV and salt from Base64
  const iv = base64ToUint8Array(params.iv);
  const salt = base64ToUint8Array(params.salt);

  // Derive decryption key from password
  const key = await deriveKeyFromPassword(password, salt);

  // Decrypt data
  try {
    // Ensure iv is compatible with BufferSource (Web Crypto API requirement)
    const ivBuffer: BufferSource = new Uint8Array(iv);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      encryptedData
    );

    return decryptedData;
  } catch (error) {
    throw new Error('Decryption failed. Invalid password or corrupted data.');
  }
}

/**
 * Convert ArrayBuffer/Uint8Array to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const uint8Array = base64ToUint8Array(base64);
  // Create a new ArrayBuffer to ensure proper type compatibility (not SharedArrayBuffer)
  const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(arrayBuffer).set(uint8Array);
  return arrayBuffer;
}

/**
 * Generate a random password for automatic encryption
 * @param length - Password length (default: 32 characters)
 * @returns Random password string
 */
export function generateRandomPassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

/**
 * Verify if Web Crypto API is available
 */
export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined';
}
