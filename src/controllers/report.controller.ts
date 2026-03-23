import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { generateReport } from '../services/report.service';

export const getAccessReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const orgName = req.query.org as string;
        
        if (!orgName) {
            res.status(400).json({ error: 'Missing required query parameter: org' });
            return;
        }

        logger.info(`Generating access report for organization: ${orgName}`);
        const report = await generateReport(orgName);
        
        res.status(200).json(report);
    } catch (error: any) {
        logger.error(`Error generating report: ${error.message}`);
        
        if (error.response?.status === 404) {
            res.status(404).json({ error: 'Organization or User not found' });
        } else if (error.response?.status === 401 || error.response?.status === 403) {
            res.status(401).json({ error: 'GitHub Authentication failed or Rate limit exceeded' });
        } else {
            res.status(500).json({ error: 'Internal server error while generating report' });
        }
    }
};
