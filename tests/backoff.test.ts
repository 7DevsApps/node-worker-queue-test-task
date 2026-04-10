import { calculateBackoff } from '../src/retry/backoff';

describe('calculateBackoff', () => {
  it('returns a non-negative value for attempt 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(calculateBackoff(0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('follows formula 1000 * 3^attempt ± 500ms jitter', () => {
    const attempts = [0, 1, 2, 3, 4];
    const expectedBases = [1000, 3000, 9000, 27000, 81000];

    for (const attempt of attempts) {
      const base = expectedBases[attempt];
      const results: number[] = [];
      for (let i = 0; i < 200; i++) {
        results.push(calculateBackoff(attempt));
      }
      const min = Math.min(...results);
      const max = Math.max(...results);

      // All values should be within [base - 500, base + 500], clamped to >= 0
      expect(min).toBeGreaterThanOrEqual(Math.max(0, base - 500));
      expect(max).toBeLessThanOrEqual(base + 500);
    }
  });

  it('increases delay exponentially with attempt number', () => {
    // Use many samples to get stable averages
    const avgDelay = (attempt: number) => {
      let sum = 0;
      const n = 500;
      for (let i = 0; i < n; i++) sum += calculateBackoff(attempt);
      return sum / n;
    };

    const avg0 = avgDelay(0);
    const avg1 = avgDelay(1);
    const avg2 = avgDelay(2);

    expect(avg1).toBeGreaterThan(avg0 * 2);
    expect(avg2).toBeGreaterThan(avg1 * 2);
  });

  it('never returns a negative value', () => {
    for (let i = 0; i < 100; i++) {
      expect(calculateBackoff(0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes jitter (not all values are identical)', () => {
    const results = new Set<number>();
    for (let i = 0; i < 20; i++) {
      results.add(calculateBackoff(1));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
