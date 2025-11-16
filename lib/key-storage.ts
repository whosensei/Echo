/**
 * Browser Key Storage Service
 * Manages encryption passwords/keys in browser storage
 *
 * Security Model:
 * - Session storage: Keys cleared when browser closes
 * - Optional: Local storage for persistent encryption (less secure)
 * - Keys are stored per recording ID
 */

const SESSION_STORAGE_PREFIX = 'enc_pwd_';
const GLOBAL_SESSION_KEY = 'enc_global_pwd';

/**
 * Store encryption password for a specific recording in session storage
 * @param recordingId - Recording ID
 * @param password - Encryption password
 */
export function storeEncryptionPassword(recordingId: string, password: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${recordingId}`, password);
  } catch (error) {
    console.error('Failed to store encryption password:', error);
  }
}

/**
 * Retrieve encryption password for a specific recording
 * @param recordingId - Recording ID
 * @returns Encryption password or null if not found
 */
export function getEncryptionPassword(recordingId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${recordingId}`);
  } catch (error) {
    console.error('Failed to retrieve encryption password:', error);
    return null;
  }
}

/**
 * Remove encryption password for a specific recording
 * @param recordingId - Recording ID
 */
export function removeEncryptionPassword(recordingId: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${recordingId}`);
  } catch (error) {
    console.error('Failed to remove encryption password:', error);
  }
}

/**
 * Store global encryption password for the session
 * @param password - Global encryption password
 */
export function storeGlobalPassword(password: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(GLOBAL_SESSION_KEY, password);
  } catch (error) {
    console.error('Failed to store global password:', error);
  }
}

/**
 * Retrieve global encryption password
 * @returns Global encryption password or null if not found
 */
export function getGlobalPassword(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(GLOBAL_SESSION_KEY);
  } catch (error) {
    console.error('Failed to retrieve global password:', error);
    return null;
  }
}

/**
 * Remove global encryption password
 */
export function removeGlobalPassword(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(GLOBAL_SESSION_KEY);
  } catch (error) {
    console.error('Failed to remove global password:', error);
  }
}

/**
 * Clear all stored encryption passwords
 */
export function clearAllPasswords(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(SESSION_STORAGE_PREFIX) || key === GLOBAL_SESSION_KEY) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear passwords:', error);
  }
}

/**
 * Check if encryption password exists for a recording
 * @param recordingId - Recording ID
 * @returns true if password exists
 */
export function hasEncryptionPassword(recordingId: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${recordingId}`) !== null;
}

/**
 * Check if global password exists
 * @returns true if global password exists
 */
export function hasGlobalPassword(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(GLOBAL_SESSION_KEY) !== null;
}
