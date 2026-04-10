import { processJob } from '../src/worker/processor';

describe('processJob', () => {
  it('returns a number (durationMs) on success', async () => {
    // Run multiple times — at least one should succeed given 60% success rate
    let succeeded = false;
    for (let i = 0; i < 20; i++) {
      try {
        const duration = await processJob({});
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(500);
        expect(duration).toBeLessThanOrEqual(2500);
        succeeded = true;
        break;
      } catch {
        // expected ~40% of the time
      }
    }
    expect(succeeded).toBe(true);
  }, 60000);

  it('throws an Error on failure (never returns error object)', async () => {
    let threw = false;
    for (let i = 0; i < 30; i++) {
      try {
        await processJob({});
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('Simulated processing failure');
        threw = true;
        break;
      }
    }
    expect(threw).toBe(true);
  }, 90000);

  it('does not import db or queue modules', () => {
    // Read the source at runtime to verify isolation
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'worker', 'processor.ts'),
      'utf-8'
    );
    expect(src).not.toMatch(/jobsRepository/);
    expect(src).not.toMatch(/jobQueue/);
    expect(src).not.toMatch(/addJob/);
    expect(src).not.toMatch(/bullmq/i);
    expect(src).not.toMatch(/import.*from.*['"]\.\.\/db/);
    expect(src).not.toMatch(/import.*from.*['"]\.\.\/queue/);
  });
});
