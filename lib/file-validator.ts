const AUDIO_SIGNATURES = {
  WAV: {
    signatures: [
      { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    ],
    mimeTypes: ['audio/wav', 'audio/wave', 'audio/x-wav'],
  },

  MP3: {
    signatures: [
      { bytes: [0x49, 0x44, 0x33], offset: 0 },
      { bytes: [0xff, 0xfb], offset: 0 },
      { bytes: [0xff, 0xf3], offset: 0 },
      { bytes: [0xff, 0xf2], offset: 0 },
    ],
    mimeTypes: ['audio/mpeg', 'audio/mp3'],
  },

  M4A: {
    signatures: [
      { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
    ],
    mimeTypes: ['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'video/mp4'],
  },

  OGG: {
    signatures: [
      { bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0 },
    ],
    mimeTypes: ['audio/ogg', 'audio/vorbis', 'application/ogg'],
  },

  WEBM: {
    signatures: [
      { bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
    ],
    mimeTypes: ['audio/webm', 'video/webm'],
  },

  FLAC: {
    signatures: [
      { bytes: [0x66, 0x4c, 0x61, 0x43], offset: 0 },
    ],
    mimeTypes: ['audio/flac', 'audio/x-flac'],
  },

  AAC: {
    signatures: [
      { bytes: [0xff, 0xf1], offset: 0 },
      { bytes: [0xff, 0xf9], offset: 0 },
    ],
    mimeTypes: ['audio/aac', 'audio/x-aac'],
  },
} as const;

function matchesSignature(
  buffer: Buffer,
  signature: { bytes: readonly number[]; offset: number }
): boolean {
  const { bytes, offset } = signature;

  if (buffer.length < offset + bytes.length) {
    return false;
  }

  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) {
      return false;
    }
  }

  return true;
}

function validateWAV(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') return false;

  const wave = buffer.toString('ascii', 8, 12);
  return wave === 'WAVE';
}

export function validateAudioFile(
  buffer: Buffer,
  mimeType: string
): {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (buffer.length < 12) {
    return {
      valid: false,
      error: 'File is too small to be a valid audio file',
    };
  }

  const normalizedMimeType = mimeType.toLowerCase().trim();

  for (const [format, config] of Object.entries(AUDIO_SIGNATURES)) {
    const signatureMatches = config.signatures.some((sig) =>
      matchesSignature(buffer, sig)
    );

    if (signatureMatches) {
      if (format === 'WAV' && !validateWAV(buffer)) {
        continue;
      }

      const mimeTypeMatches = config.mimeTypes.some(
        (mime) => mime.toLowerCase() === normalizedMimeType
      );

      if (!mimeTypeMatches) {
        return {
          valid: false,
          detectedFormat: format,
          error: `File signature indicates ${format} format, but MIME type is ${mimeType}. Potential file type spoofing detected.`,
        };
      }

      return {
        valid: true,
        detectedFormat: format,
      };
    }
  }

  return {
    valid: false,
    error: `Could not verify file as a valid audio format. File signature does not match any known audio format.`,
  };
}

export function getSupportedFormats(): string[] {
  return Object.keys(AUDIO_SIGNATURES);
}

export function getSupportedMimeTypes(): string[] {
  const mimeTypes = new Set<string>();

  for (const config of Object.values(AUDIO_SIGNATURES)) {
    config.mimeTypes.forEach((mime) => mimeTypes.add(mime));
  }

  return Array.from(mimeTypes);
}

export function isSupportedMimeType(mimeType: string): boolean {
  const normalizedMimeType = mimeType.toLowerCase().trim();
  return getSupportedMimeTypes().some(
    (mime) => mime.toLowerCase() === normalizedMimeType
  );
}
