// Shared rate limiter for Gemini API calls
class GeminiRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        console.log(
          `Gemini API rate limit reached. Waiting ${waitTime}ms before next request...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Add current request
    this.requests.push(now);
  }
}

export const geminiRateLimiter = new GeminiRateLimiter(5, 60000); // 5 requests per minute (matches audio fetching)

// Rate limiter for audio fetching (more conservative since audio services are often more restrictive)
export const audioFetchRateLimiter = new GeminiRateLimiter(5, 60000); // 5 requests per minute
