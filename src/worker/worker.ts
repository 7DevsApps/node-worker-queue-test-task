import { Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { processJob } from './processor';
import { jobsRepository } from '../db/jobsRepository';
import { calculateBackoff } from '../retry/backoff';
import { logger } from '../logging/logger';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

async function handleJob(bullJob: BullJob): Promise<void> {
  const { jobId, task, payload } = bullJob.data as {
    jobId: string;
    task: string;
    payload: Record<string, unknown>;
  };

  const job = await jobsRepository.getJobById(jobId);
  if (!job) throw new Error(`Job ${jobId} not found in DB`);

  const currentAttempts = job.attempts + 1;
  await jobsRepository.updateJob(jobId, { status: 'processing', attempts: currentAttempts });
  logger.info({ event: 'job:processing_started', jobId, task, attempt: currentAttempts });

  try {
    const durationMs = await processJob(payload);

    await jobsRepository.updateJob(jobId, { status: 'completed' });
    logger.info({ event: 'job:completed', jobId, task, durationMs: Math.round(durationMs) });
  } catch (err) {
    const error = (err as Error).message;

    if (currentAttempts >= job.max_attempts) {
      await jobsRepository.updateJob(jobId, { status: 'failed', error });
      logger.error({ event: 'job:failed', jobId, totalAttempts: currentAttempts, error });
      throw err;
    }

    const delayMs = calculateBackoff(currentAttempts);
    const nextRunAt = new Date(Date.now() + delayMs);
    await jobsRepository.updateJob(jobId, {
      status: 'retrying',
      error,
      next_run_at: nextRunAt,
    });
    logger.warn({
      event: 'job:retry_triggered',
      jobId,
      attempt: currentAttempts,
      error,
      delayMs,
      nextRunAt: nextRunAt.toISOString(),
    });

    throw err;
  }
}

const worker = new Worker('jobs', handleJob, {
  connection,
  settings: {
    backoffStrategy: (attemptsMade: number) => calculateBackoff(attemptsMade),
  },
});

worker.on('completed', (job) => {
  logger.info({ event: 'worker:job_done', jobId: job?.data?.jobId });
});

worker.on('failed', (job, err) => {
  logger.error({ event: 'worker:job_failed', jobId: job?.data?.jobId, error: err.message });
});

worker.on('error', (err) => {
  logger.error({ event: 'worker:error', error: err.message });
});

console.log('Worker started, waiting for jobs…');
