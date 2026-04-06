/**
 * Project Routes
 * API endpoints for Projects and Timesheets
 */

import { Router } from 'express';
import projectController from '../controllers/projectController';
import timesheetController from '../controllers/timesheetController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== Project Routes ====================
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/summary', projectController.getProjectSummary);

// ==================== Project Task Routes ====================
router.get('/:id/tasks', projectController.getProjectTasks);
router.post('/:id/tasks', projectController.createProjectTask);
router.put('/tasks/:taskId', projectController.updateProjectTask);
router.delete('/tasks/:taskId', projectController.deleteProjectTask);

// ==================== Timesheet Routes ====================
router.get('/timesheets/list', timesheetController.getTimesheets);
router.get('/timesheets/weekly', timesheetController.getWeeklyTimesheet);
router.get('/timesheets/:id', timesheetController.getTimesheet);
router.post('/timesheets', timesheetController.createTimesheet);
router.put('/timesheets/:id', timesheetController.updateTimesheet);
router.delete('/timesheets/:id', timesheetController.deleteTimesheet);

// ==================== Timesheet Workflow Routes ====================
router.post('/timesheets/submit', timesheetController.submitTimesheets);
router.post('/timesheets/approve', timesheetController.approveTimesheets);
router.post('/timesheets/reject', timesheetController.rejectTimesheets);

// ==================== Timesheet Summary Routes ====================
// router.get('/timesheets/employee/:employeeId/summary', timesheetController.getEmployeeTimesheetSummary);

export default router;
