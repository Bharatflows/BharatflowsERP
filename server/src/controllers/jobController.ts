import { Request, Response } from 'express';
import { pdfQueue, emailQueue, reportQueue } from '../services/jobQueue';

export const getJobStatus = async (req: Request, res: Response) => {
    try {
        const { queueName, jobId } = req.params;
        let queue;

        switch (queueName) {
            case 'pdf':
            case 'pdf-generation':
                queue = pdfQueue;
                break;
            case 'email':
            case 'email-sending':
                queue = emailQueue;
                break;
            case 'report':
            case 'report-generation':
                queue = reportQueue;
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid queue name' });
        }

        if (!queue) {
            return res.status(400).json({ success: false, message: 'Queue not available' });
        }

        const job = await queue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const error = job.failedReason;

        res.json({
            success: true,
            id: job.id,
            state,
            progress,
            result,
            error,
            timestamp: job.timestamp,
            finishedOn: job.finishedOn
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
