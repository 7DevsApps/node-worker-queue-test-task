import { jobQueue } from './jobQueue';

export async function addJobToQueue(jobId: string, task: string, payload: Record<string, unknown>): Promise<void> {
  await jobQueue.add(task, { jobId, task, payload }, {
    jobId,
    attempts: 5,
    backoff: { type: 'custom' },
  });
}
