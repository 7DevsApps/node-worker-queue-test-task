export type JobStatus =
  | 'queued'
  | 'processing'
  | 'retrying'
  | 'completed'
  | 'failed'

export interface Job {
  id: string
  task: string
  payload: Record<string, unknown>
  status: JobStatus
  attempts: number
  max_attempts: number
  error: string | null
  next_run_at: string | null
  created_at: string
  updated_at: string
}

export const JOB_STATUSES: JobStatus[] = [
  'queued',
  'processing',
  'retrying',
  'completed',
  'failed',
]
