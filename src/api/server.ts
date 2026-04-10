import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { jobsRouter } from './routes/jobs';
import { logger } from '../logging/logger';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use('/jobs', jobsRouter);

app.listen(PORT, () => {
  logger.info({ event: 'server:started', port: PORT });
  console.log(`API server listening on http://localhost:${PORT}`);
});
