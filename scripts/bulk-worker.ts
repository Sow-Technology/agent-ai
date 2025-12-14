import "dotenv/config";
import { runBulkWorkerOnce } from "@/lib/bulkWorker";

// Simple background runner with adaptive backoff. It relies on runBulkWorkerOnce
// to cap concurrency based on system resources.

const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;
const NO_WORK_BACKOFF_MULT = 2;
const WORK_FOUND_RESET_MS = MIN_DELAY_MS;

let delay = MIN_DELAY_MS;
let shuttingDown = false;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
  // eslint-disable-next-line no-constant-condition
  while (!shuttingDown) {
    try {
      const { processed } = await runBulkWorkerOnce();
      if (processed && processed > 0) {
        delay = WORK_FOUND_RESET_MS;
      } else {
        delay = Math.min(MAX_DELAY_MS, Math.max(MIN_DELAY_MS, delay * NO_WORK_BACKOFF_MULT));
      }
    } catch (err) {
      console.error("Bulk worker cycle error", err);
      delay = Math.min(MAX_DELAY_MS, delay * NO_WORK_BACKOFF_MULT);
    }
    await sleep(delay);
  }
}

process.on("SIGINT", () => {
  shuttingDown = true;
});
process.on("SIGTERM", () => {
  shuttingDown = true;
});

loop().catch((err) => {
  console.error("Bulk worker fatal error", err);
  process.exit(1);
});
