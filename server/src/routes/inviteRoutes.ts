/**
 * Invite Routes
 * Routes for employee and party invitations
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
    createEmployeeInvite,
    createPartyInvite,
    getInvites,
    cancelInvite,
    resendInvite,
    verifyInviteToken,
    acceptEmployeeInvite,
    acceptPartyInvite,
} from '../controllers/inviteController';

const router = Router();

// Public routes (no auth required)
router.get('/verify/:token', verifyInviteToken);
router.post('/accept/employee', acceptEmployeeInvite);
router.post('/accept/party', acceptPartyInvite);

// Protected routes
router.use(protect);
router.post('/employee', createEmployeeInvite);
router.post('/party', createPartyInvite);
router.get('/', getInvites);
router.delete('/:id', cancelInvite);
router.post('/:id/resend', resendInvite);

export default router;
