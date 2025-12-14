// Enhanced rate limiter for Gemini API calls with multiple time windows
class GeminiRateLimiter {
  private requests: number[] = [];
  private readonly limits: Array<{ maxRequests: number; windowMs: number }>;

  constructor(limits: Array<{ maxRequests: number; windowMs: number }>) {
    this.limits = limits;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    let waitTime = 0;

    for (const limit of this.limits) {
      // Remove old requests outside the window for this limit
      this.requests = this.requests.filter(
        (time) => now - time < limit.windowMs
      );

      // Enforce even spacing within the window (default spacing = window/maxRequests)
      const minSpacingMs = Math.floor(limit.windowMs / limit.maxRequests);
      const lastRequest =
        this.requests.length > 0 ? Math.max(...this.requests) : null;
      if (lastRequest !== null) {
        const spacingWait = minSpacingMs - (now - lastRequest);
        if (spacingWait > waitTime) {
          waitTime = spacingWait;
        }
      }

      // Enforce count limit
      if (this.requests.length >= limit.maxRequests) {
        const oldestRequest = Math.min(...this.requests);
        const windowWait = limit.windowMs - (now - oldestRequest);
        if (windowWait > waitTime) {
          waitTime = windowWait;
        }
      }
    }

    if (waitTime > 0) {
      console.log(
        `Gemini API rate limit reached. Waiting ${waitTime}ms before next request...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    // Add current request after waits
    this.requests.push(Date.now());
  }
}

// Gemini API limits (configurable via env):
// Defaults tuned to 3 requests/minute spread evenly (~20s apart), and 200 per hour
const GEMINI_RPM = parseInt(process.env.GEMINI_RPM || "3", 10);
const GEMINI_RPH = parseInt(process.env.GEMINI_RPH || "200", 10);

export const geminiRateLimiter = new GeminiRateLimiter([
  { maxRequests: GEMINI_RPM, windowMs: 60000 }, // per minute
  { maxRequests: GEMINI_RPH, windowMs: 3600000 }, // per hour
]);

// Audio fetching limits (separate knobs if needed):
// Defaults: 3 per minute, 120 per hour (more conservative than Gemini)
const AUDIO_RPM = parseInt(process.env.AUDIO_RPM || "3", 10);
const AUDIO_RPH = parseInt(process.env.AUDIO_RPH || "120", 10);

export const audioFetchRateLimiter = new GeminiRateLimiter([
  { maxRequests: AUDIO_RPM, windowMs: 60000 }, // per minute
  { maxRequests: AUDIO_RPH, windowMs: 3600000 }, // per hour
]);
