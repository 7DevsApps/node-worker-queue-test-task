import * as fs from 'fs';
import * as path from 'path';

const addJobSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'queue', 'addJob.ts'),
  'utf-8'
);

describe('addJob — BullMQ job options', () => {
  it('sets attempts option for retry', () => {
    expect(addJobSrc).toMatch(/attempts:\s*5/);
  });

  it('sets custom backoff type', () => {
    expect(addJobSrc).toMatch(/backoff:\s*\{\s*type:\s*['"]custom['"]/);
  });

  it('passes jobId as BullMQ job ID', () => {
    expect(addJobSrc).toMatch(/jobId/);
  });

  it('passes task and payload in job data', () => {
    expect(addJobSrc).toMatch(/\{\s*jobId.*task.*payload/s);
  });
});
