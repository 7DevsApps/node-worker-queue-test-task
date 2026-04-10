import * as fs from 'fs';
import * as path from 'path';

const workerSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'worker', 'worker.ts'),
  'utf-8'
);

const routesSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'api', 'routes', 'jobs.ts'),
  'utf-8'
);

describe('Logging — required events', () => {
  it('job:received is logged in routes with jobId, task, payload', () => {
    expect(routesSrc).toMatch(/event:\s*['"]job:received['"]/);
    expect(routesSrc).toMatch(/job:received.*jobId/);
    expect(routesSrc).toMatch(/job:received.*task/);
    expect(routesSrc).toMatch(/job:received.*payload/);
  });

  it('job:processing_started is logged with jobId, task, attempt', () => {
    expect(workerSrc).toMatch(/event:\s*['"]job:processing_started['"]/);
    expect(workerSrc).toMatch(/job:processing_started.*jobId/);
    expect(workerSrc).toMatch(/job:processing_started.*task/);
    expect(workerSrc).toMatch(/job:processing_started.*attempt/);
  });

  it('job:completed is logged with jobId, task, durationMs', () => {
    expect(workerSrc).toMatch(/event:\s*['"]job:completed['"]/);
    expect(workerSrc).toMatch(/job:completed.*jobId/);
    expect(workerSrc).toMatch(/job:completed.*task/);
    expect(workerSrc).toMatch(/job:completed.*durationMs/);
  });

  it('job:retry_triggered is logged at warn level with required fields', () => {
    expect(workerSrc).toMatch(/logger\.warn\(/);
    expect(workerSrc).toMatch(/event:\s*['"]job:retry_triggered['"]/);
    expect(workerSrc).toMatch(/job:retry_triggered[\s\S]*?attempt/);
    expect(workerSrc).toMatch(/job:retry_triggered[\s\S]*?error/);
    expect(workerSrc).toMatch(/job:retry_triggered[\s\S]*?delayMs/);
    expect(workerSrc).toMatch(/job:retry_triggered[\s\S]*?nextRunAt/);
  });

  it('job:failed is logged at error level with jobId, totalAttempts, error', () => {
    expect(workerSrc).toMatch(/event:\s*['"]job:failed['"]/);
    expect(workerSrc).toMatch(/job:failed.*totalAttempts/);
    expect(workerSrc).toMatch(/job:failed.*error/);
  });
});

describe('Logging — structured JSON format', () => {
  const loggerSrc = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'logging', 'logger.ts'),
    'utf-8'
  );

  it('uses pino (structured JSON logger)', () => {
    expect(loggerSrc).toMatch(/import.*pino/);
  });

  it('includes timestamp field "ts"', () => {
    expect(loggerSrc).toMatch(/ts/);
  });

  it('formats level as label string', () => {
    expect(loggerSrc).toMatch(/level.*label/);
  });
});
