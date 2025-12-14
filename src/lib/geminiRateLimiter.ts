// Enhanced rate limiter for Gemini API calls with multiple time windows
class GeminiRateLimiter {
  private requests: number[] = [];
  private readonly limits: Array<{ maxRequests: number; windowMs: number }>;

  constructor(limits: Array<{ maxRequests: number; windowMs: number }>) {
    this.limits = limits;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Check each limit tier
    for (const limit of this.limits) {
      // Remove old requests outside the window
      this.requests = this.requests.filter((time) => now - time < limit.windowMs);

      if (this.requests.length >= limit.maxRequests) {
        // Calculate wait time until oldest request expires
        const oldestRequest = Math.min(...this.requests);
        const waitTime = limit.windowMs - (now - oldestRequest);

        if (waitTime > 0) {
          const windowName = limit.windowMs === 60000 ? 'minute' :
                           limit.windowMs === 3600000 ? 'hour' : `${limit.windowMs/1000}s`;
          console.log(
            `Gemini API ${windowName} rate limit reached (${limit.maxRequests} requests/${windowName}). Waiting ${waitTime}ms before next request...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          // After waiting, we need to check all limits again
          return this.waitForSlot();
        }
      }
    }

    // Add current request
    this.requests.push(now);
  }
}

// Gemini API limits (configurable via env, with higher defaults):
// - GEMINI_RPM (per-minute limit) defaults to 10
// - GEMINI_RPH (per-hour limit) defaults to 500
const GEMINI_RPM = parseInt(process.env.GEMINI_RPM || "10", 10);
const GEMINI_RPH = parseInt(process.env.GEMINI_RPH || "500", 10);

export const geminiRateLimiter = new GeminiRateLimiter([
  { maxRequests: GEMINI_RPM, windowMs: 60000 },      // per minute
  { maxRequests: GEMINI_RPH, windowMs: 3600000 },    // per hour
]);

// Audio fetching limits (separate knobs if needed):
// - AUDIO_RPM defaults to 5
// - AUDIO_RPH defaults to 200
const AUDIO_RPM = parseInt(process.env.AUDIO_RPM || "5", 10);
const AUDIO_RPH = parseInt(process.env.AUDIO_RPH || "200", 10);

export const audioFetchRateLimiter = new GeminiRateLimiter([
  { maxRequests: AUDIO_RPM, windowMs: 60000 },      // per minute
  { maxRequests: AUDIO_RPH, windowMs: 3600000 },    // per hour
]);
