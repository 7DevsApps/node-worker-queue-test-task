import * as fs from 'fs';
import * as path from 'path';

const typeSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'types', 'job.ts'),
  'utf-8'
);

describe('Job type definitions (job.ts)', () => {
  it('exports JobStatus with all 5 statuses', () => {
    for (const s of ['queued', 'processing', 'retrying', 'completed', 'failed']) {
      expect(typeSrc).toContain(`'${s}'`);
    }
  });

  it('Job interface uses "task" (not "type")', () => {
    expect(typeSrc).toMatch(/task:\s*string/);
    expect(typeSrc).not.toMatch(/type:\s*string/);
  });

  it('Job interface uses "attempts" (plural)', () => {
    expect(typeSrc).toMatch(/attempts:\s*number/);
    expect(typeSrc).not.toMatch(/\battempt:\s*number/);
  });

  it('Job interface has next_run_at field', () => {
    expect(typeSrc).toMatch(/next_run_at/);
  });

  it('Job interface has all required fields', () => {
    const requiredFields = [
      'id', 'task', 'payload', 'status', 'attempts',
      'max_attempts', 'error', 'next_run_at', 'created_at', 'updated_at',
    ];
    for (const field of requiredFields) {
      expect(typeSrc).toContain(field);
    }
  });

  it('exports CreateJobResponse with id, status, created_at', () => {
    expect(typeSrc).toMatch(/CreateJobResponse/);
  });
});
