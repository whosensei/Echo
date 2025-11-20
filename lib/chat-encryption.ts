import { encryptPassword, decryptPassword } from './password-encryption';

export function encryptChatContent(content: string | null | undefined): string | null {
  if (!content) {
    return null;
  }

  try {
    return encryptPassword(content);
  } catch (error) {
    console.error('Error encrypting chat content:', error);
  
    return null;
  }
}

/**
 * Check if content appears to be encrypted
 * Encrypted content is base64-encoded and has a minimum length
 * Format: salt (64 bytes) + iv (16 bytes) + tag (16 bytes) + encrypted data
 * Minimum base64 length: ~128 characters
 */
function isEncryptedContent(content: string): boolean {
  if (!content || content.length < 128) {
    return false;
  }

  // Check if it's valid base64 (encrypted content is always base64)
  // Base64 regex: only contains A-Z, a-z, 0-9, +, /, and = for padding
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(content)) {
    return false;
  }

  // Try to decode base64 and check minimum binary length
  // Encrypted format requires: salt (64) + iv (16) + tag (16) = 96 bytes minimum
  try {
    const decoded = Buffer.from(content, 'base64');
    return decoded.length >= 96; // Minimum encrypted data size
  } catch {
    return false;
  }
}

/**
 * Decrypt chat content (message, title, or system prompt)
 * @param encryptedContent - Base64-encoded encrypted content or plaintext legacy content
 * @returns Plaintext content, or original if decryption fails (backward compatibility)
 */
export function decryptChatContent(encryptedContent: string | null | undefined): string {
  if (!encryptedContent) {
    return '';
  }

  // Check if content appears to be encrypted before attempting decryption
  // This prevents errors when trying to decrypt unencrypted legacy data
  if (!isEncryptedContent(encryptedContent)) {
    // Content doesn't look encrypted, return as-is (legacy unencrypted data)
    return encryptedContent;
  }

  try {
    return decryptPassword(encryptedContent);
  } catch (error) {
    // If decryption fails despite looking encrypted, log and return original
    // This handles corrupted encrypted data gracefully
    console.warn('Failed to decrypt chat content, returning original:', error instanceof Error ? error.message : 'Unknown error');
    return encryptedContent;
  }
}

/**
 * Safely encrypt content - returns original if encryption fails
 * Useful for write operations where we want to preserve data even if encryption fails
 * @param content - Plaintext content to encrypt
 * @returns Encrypted content or original if encryption fails
 */
export function safeEncryptChatContent(content: string | null | undefined): string | null {
  if (!content) {
    return null;
  }

  const encrypted = encryptChatContent(content);
  // If encryption failed, return original content as fallback
  // This ensures data is never lost, though it won't be encrypted
  return encrypted ?? content;
}

