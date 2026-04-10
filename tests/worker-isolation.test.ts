import * as fs from 'fs';
import * as path from 'path';

const serverSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'api', 'server.ts'),
  'utf-8'
);

const routesSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'api', 'routes', 'jobs.ts'),
  'utf-8'
);

const addJobSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'queue', 'addJob.ts'),
  'utf-8'
);

const processorSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'worker', 'processor.ts'),
  'utf-8'
);

describe('Layer isolation', () => {
  describe('Worker is never imported from server', () => {
    it('server.ts does not import worker or processor', () => {
      expect(serverSrc).not.toMatch(/import.*worker/i);
      expect(serverSrc).not.toMatch(/import.*processor/i);
    });

    it('routes/jobs.ts does not import worker or processor', () => {
      expect(routesSrc).not.toMatch(/import.*worker/i);
      expect(routesSrc).not.toMatch(/import.*processor/i);
    });
  });

  describe('API routes contain no business logic', () => {
    it('routes do not call processJob', () => {
      expect(routesSrc).not.toMatch(/processJob/);
    });

    it('routes do not import backoff', () => {
      expect(routesSrc).not.toMatch(/backoff/i);
    });
  });

  describe('Queue layer has no DB calls', () => {
    it('addJob.ts does not import jobsRepository or pool', () => {
      expect(addJobSrc).not.toMatch(/jobsRepository/);
      expect(addJobSrc).not.toMatch(/import.*pool/);
    });
  });

  describe('Processor has no DB or queue calls', () => {
    it('processor.ts does not import DB modules', () => {
      expect(processorSrc).not.toMatch(/jobsRepository/);
      expect(processorSrc).not.toMatch(/import.*from.*['"]\.\.\/db/);
    });

    it('processor.ts does not import queue modules', () => {
      expect(processorSrc).not.toMatch(/jobQueue/);
      expect(processorSrc).not.toMatch(/import.*from.*['"]\.\.\/queue/);
    });

    it('processor.ts has no HTTP code', () => {
      expect(processorSrc).not.toMatch(/express/i);
      expect(processorSrc).not.toMatch(/req\s*,\s*res/);
    });
  });
});
