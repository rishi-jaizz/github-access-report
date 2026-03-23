import { Router } from 'express';
import { getAccessReport } from '../controllers/report.controller';

export const apiRouter = Router();

apiRouter.get('/access-report', getAccessReport);
