import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  GITHUB_PAT: z.string().min(1, 'GitHub Personal Access Token is required'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    logger.error('Environment variables validation failed:', error);
    process.exit(1);
  }
};

export const env = parseEnv();
