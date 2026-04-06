import { Router } from 'express';
import {
    getCalendarActivities,
    createTask,
    updateTask,
    deleteTask
} from '../controllers/calendarController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes are protected by auth
router.use(protect);

router.get('/activities', getCalendarActivities);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

export default router;
