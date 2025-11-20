/**
 * Server-Side Password Encryption Service
 * Encrypts/decrypts file encryption passwords using a master key
 * 
 * Security Model:
 * - Master key stored in .env (ENCRYPTION_MASTER_KEY)
 * - Passwords encrypted with AES-256-GCM
 * - Key derived from master key using PBKDF2
 * - Allows recovery of passwords after browser restart
 */

import crypto from 'crypto';

const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || '';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Encrypt a password using the master key
 * @param password - Plaintext password to encrypt
 * @returns Base64-encoded encrypted password
 */
export function encryptPassword(password: string): string {
  if (!MASTER_KEY) {
    throw new Error('ENCRYPTION_MASTER_KEY is not set in environment variables');
  }

  if (!password) {
    throw new Error('Password cannot be empty');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive key from master key using PBKDF2
  const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(password, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  // Combine: salt + iv + tag + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  
  return result.toString('base64');
}

/**
 * Decrypt a password using the master key
 * @param encryptedPassword - Base64-encoded encrypted password
 * @returns Plaintext password
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!MASTER_KEY) {
    throw new Error('ENCRYPTION_MASTER_KEY is not set in environment variables');
  }

  if (!encryptedPassword) {
    throw new Error('Encrypted password cannot be empty');
  }

  try {
    const data = Buffer.from(encryptedPassword, 'base64');
    
    if (data.length < ENCRYPTED_POSITION) {
      throw new Error('Invalid encrypted password format');
    }
    
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, TAG_POSITION);
    const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.slice(ENCRYPTED_POSITION);
    
    // Derive key from master key using PBKDF2
    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Password decryption error:', error);
    throw new Error('Failed to decrypt password. Invalid format or corrupted data.');
  }
}





