export type JobStatus = 'queued' | 'processing' | 'retrying' | 'completed' | 'failed';

export interface Job {
  id: string;
  task: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error: string | null;
  next_run_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobResponse {
  id: string;
  status: JobStatus;
  created_at: Date;
}
