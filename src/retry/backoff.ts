export function calculateBackoff(attempt: number): number {
  const base = 1000 * Math.pow(3, attempt);
  const jitter = Math.floor(Math.random() * 1001) - 500; 
  return Math.max(0, base + jitter);
}
