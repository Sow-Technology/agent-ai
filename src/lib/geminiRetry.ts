// Shared utility for retrying Gemini API calls with rate limit handling
export function parseRetryDelay(error: any): number {
  try {
    // Look for RetryInfo in the error details
    if (error?.details) {
      for (const detail of error.details) {
        if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
          const delay = detail.retryDelay;
          if (typeof delay === 'string') {
            // Parse duration strings like "29s", "5.5s"
            const match = delay.match(/^(\d+(?:\.\d+)?)s$/);
            if (match) {
              return parseFloat(match[1]) * 1000; // Convert to milliseconds
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 30000; // Default 30 seconds
}

export async function retryGeminiCall<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const isRateLimit = error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('Too Many Requests') ||
        error?.message?.includes('quota');

      if (!isRateLimit || attempt === maxRetries) {
        // Not a rate limit error, or we've exhausted retries
        throw error;
      }

      // Calculate retry delay
      let retryDelay = parseRetryDelay(error);
      if (retryDelay < baseDelay) {
        retryDelay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      }

      console.log(`Gemini API rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}