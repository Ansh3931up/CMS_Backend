import express from 'express';
// import { protect, authorize } from '../middleware/auth';
import questionnaireController from '../controllers/questionnaireController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/roleCheck.js';
const router = express.Router();

const {
  submitQuestionnaire,
  getQuestionnaires,
  exportToExcel
} = questionnaireController;

// Public route for submitting questionnaire
router.post('/', submitQuestionnaire);

// Protected routes (admin only)
router.get('/', verifyToken,  isSuperAdmin, getQuestionnaires);
router.get('/export', verifyToken, isSuperAdmin, exportToExcel);

export default router; 