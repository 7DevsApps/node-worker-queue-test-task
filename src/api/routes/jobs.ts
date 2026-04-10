import { Router, Request, Response } from 'express';
import { jobsRepository } from '../../db/jobsRepository';
import { addJobToQueue } from '../../queue/addJob';
import { logger } from '../../logging/logger';
import { JobStatus } from '../../types/job';

export const jobsRouter = Router();

const VALID_STATUSES: JobStatus[] = ['queued', 'processing', 'retrying', 'completed', 'failed'];

jobsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { task, payload } = req.body;

    if (!task || typeof task !== 'string') {
      res.status(400).json({ error: 'Field "task" is required and must be a string' });
      return;
    }

    const job = await jobsRepository.createJob(task, payload ?? {});
    await addJobToQueue(job.id, job.task, job.payload);

    logger.info({ event: 'job:received', jobId: job.id, task: job.task, payload: job.payload });

    res.status(201).json({
      id: job.id,
      status: job.status,
      created_at: job.created_at,
    });
  } catch (err) {
    logger.error({ event: 'job:create_error', error: (err as Error).message });
    res.status(500).json({ error: 'Failed to create job' });
  }
});

jobsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await jobsRepository.getJobById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (err) {
    logger.error({ event: 'job:get_error', error: (err as Error).message });
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

jobsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;

    if (status && !VALID_STATUSES.includes(status as JobStatus)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const jobs = await jobsRepository.listJobs(status as JobStatus | undefined);
    res.json(jobs);
  } catch (err) {
    logger.error({ event: 'job:list_error', error: (err as Error).message });
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});
