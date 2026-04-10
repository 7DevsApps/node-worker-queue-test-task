import * as fs from 'fs';
import * as path from 'path';

const schema = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'db', 'schema.sql'),
  'utf-8'
);

describe('Database schema (schema.sql)', () => {
  it('creates jobs table', () => {
    expect(schema).toMatch(/CREATE TABLE.*jobs/i);
  });

  it('has UUID primary key with default', () => {
    expect(schema).toMatch(/id\s+UUID\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
  });

  it('uses "task" column (not "type")', () => {
    expect(schema).toMatch(/task\s+VARCHAR\(100\)/i);
    expect(schema).not.toMatch(/\btype\s+VARCHAR/i);
  });

  it('has payload JSONB column', () => {
    expect(schema).toMatch(/payload\s+JSONB/i);
  });

  it('has status column with CHECK constraint for all 5 statuses', () => {
    expect(schema).toMatch(/status\s+VARCHAR/i);
    for (const s of ['queued', 'processing', 'retrying', 'completed', 'failed']) {
      expect(schema).toContain(s);
    }
  });

  it('uses "attempts" (plural) column', () => {
    expect(schema).toMatch(/attempts\s+INT/i);
  });

  it('has max_attempts with default 5', () => {
    expect(schema).toMatch(/max_attempts\s+INT\s+NOT NULL\s+DEFAULT\s+5/i);
  });

  it('has error TEXT column', () => {
    expect(schema).toMatch(/error\s+TEXT/i);
  });

  it('has next_run_at TIMESTAMPTZ column', () => {
    expect(schema).toMatch(/next_run_at\s+TIMESTAMPTZ/i);
  });

  it('has created_at and updated_at with defaults', () => {
    expect(schema).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT NULL\s+DEFAULT\s+now\(\)/i);
    expect(schema).toMatch(/updated_at\s+TIMESTAMPTZ\s+NOT NULL\s+DEFAULT\s+now\(\)/i);
  });
});
