import { pool } from './pool';
import { Job, JobStatus } from '../types/job';

async function createJob(task: string, payload: Record<string, unknown>): Promise<Job> {
  const { rows } = await pool.query(
    `INSERT INTO jobs (task, payload) VALUES ($1, $2) RETURNING *`,
    [task, JSON.stringify(payload)]
  );
  return rows[0];
}

async function getJobById(id: string): Promise<Job | null> {
  const { rows } = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

async function listJobs(status?: JobStatus): Promise<Job[]> {
  if (status) {
    const { rows } = await pool.query(
      `SELECT * FROM jobs WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows;
  }
  const { rows } = await pool.query(`SELECT * FROM jobs ORDER BY created_at DESC`);
  return rows;
}

async function updateJob(
  id: string,
  fields: Partial<Pick<Job, 'status' | 'attempts' | 'error' | 'next_run_at'>>
): Promise<Job> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      sets.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
  }
  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE jobs SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0];
}

export const jobsRepository = { createJob, getJobById, listJobs, updateJob };
