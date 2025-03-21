import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { isHOD } from '../middleware/roleCheck.js';
import {createSubject,
    addBranchEvent,
    getBranchEvents,
    updateBranchMetrics,
    getBranchDetails,
    createBatch,
    updateBatchPerformance
} from '../controllers/HODController.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(isHOD);

// Branch management


router.get('/branches/:branchId', getBranchDetails);
router.put('/branches/:branchId/metrics', updateBranchMetrics);
router.get('/branches/:branchId/events', getBranchEvents);
router.post('/branches/:branchId/events', addBranchEvent);

// Subject management
router.post('/subjects', createSubject);

// Batch management
router.post('/batches', createBatch);
router.put('/batches/:batchId/performance', updateBatchPerformance);

export default router; 