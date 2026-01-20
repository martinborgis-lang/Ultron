import { DEFAULT_DEEPGRAM_CONFIG, DeepgramConfig } from '@/types/meeting';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * Get Deepgram API key from environment
 */
export function getDeepgramApiKey(): string {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
  }
  return apiKey;
}

/**
 * Generate WebSocket URL for Deepgram streaming
 */
export function getDeepgramWebSocketUrl(config: Partial<DeepgramConfig> = {}): string {
  const finalConfig = { ...DEFAULT_DEEPGRAM_CONFIG, ...config };

  const params = new URLSearchParams({
    model: finalConfig.model,
    language: finalConfig.language,
    punctuate: String(finalConfig.punctuate),
    interim_results: String(finalConfig.interim_results),
    encoding: finalConfig.encoding,
    sample_rate: String(finalConfig.sample_rate),
    channels: String(finalConfig.channels),
  });

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

/**
 * Transcribe pre-recorded audio using Deepgram
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  config: Partial<DeepgramConfig> = {}
): Promise<{ transcript: string; words: { word: string; start: number; end: number }[] }> {
  const apiKey = getDeepgramApiKey();
  const finalConfig = { ...DEFAULT_DEEPGRAM_CONFIG, ...config };

  const params = new URLSearchParams({
    model: finalConfig.model,
    language: finalConfig.language,
    punctuate: String(finalConfig.punctuate),
  });

  const response = await fetch(`${DEEPGRAM_API_URL}/listen?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${error}`);
  }

  const data = await response.json();
  const alternative = data.results?.channels?.[0]?.alternatives?.[0];

  return {
    transcript: alternative?.transcript || '',
    words: alternative?.words || [],
  };
}

/**
 * Create a temporary API key for client-side streaming (optional, for security)
 * This requires Deepgram's project API with key management enabled
 */
export async function createTemporaryApiKey(
  expirationSeconds: number = 3600
): Promise<{ key: string; expiresAt: number }> {
  const apiKey = getDeepgramApiKey();

  // Note: This requires a Deepgram project API key with key management permissions
  // For simplicity, we'll return the main key wrapped in an object
  // In production, you might want to use Deepgram's key management API

  return {
    key: apiKey,
    expiresAt: Date.now() + expirationSeconds * 1000,
  };
}

/**
 * Validate Deepgram API key
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const apiKey = getDeepgramApiKey();

    const response = await fetch(`${DEEPGRAM_API_URL}/projects`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get usage statistics (if available)
 */
export async function getUsageStats(): Promise<{
  minutes_used: number;
  minutes_limit: number;
} | null> {
  try {
    const apiKey = getDeepgramApiKey();

    const response = await fetch(`${DEEPGRAM_API_URL}/projects`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    // Note: Actual usage endpoint may vary based on Deepgram plan
    // This is a simplified version

    return {
      minutes_used: 0,
      minutes_limit: 12000, // Free tier limit
    };
  } catch {
    return null;
  }
}
