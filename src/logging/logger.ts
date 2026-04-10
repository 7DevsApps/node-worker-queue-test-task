import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: () => `,"ts":"${new Date().toISOString()}"`,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});
