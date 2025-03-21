import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { isCollegeAdmin } from '../middleware/roleCheck.js';
import { 
    getDashboardStats,
    getStudents,
    getTeachers,
    getClerks,
    updateUser,
    deleteUser,
    addDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment,
    updateCollegeProfile,
    addCollegeDocument,
    getCollegeDocuments,
    deleteCollegeDocument,
    getCollegeProfile,
    getUser,
    getUsers,
    getDepartmentDetails,
    addDepartmentEvent,
    createTeacher
} from '../controllers/CollegeAdminController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', verifyToken, isCollegeAdmin, getDashboardStats);

// User management routes
router.get('/users', verifyToken, isCollegeAdmin, getUsers);
router.get('/users/:userId', verifyToken, isCollegeAdmin, getUser);
router.get('/students', verifyToken, isCollegeAdmin, getStudents);
router.post('/teachers', verifyToken, isCollegeAdmin, createTeacher);
router.get('/teachers', verifyToken, isCollegeAdmin, getTeachers);
router.get('/clerks', verifyToken, isCollegeAdmin, getClerks);
router.put('/users/:userId', verifyToken, isCollegeAdmin, updateUser);
router.delete('/users/:userId', verifyToken, isCollegeAdmin, deleteUser);

// Department routes
router.post('/departments', verifyToken, isCollegeAdmin, addDepartment);
router.get('/departments', verifyToken, isCollegeAdmin, getDepartments);
router.get('/departments/:id', verifyToken, isCollegeAdmin, getDepartmentDetails);
router.put('/departments/:id', verifyToken, isCollegeAdmin, updateDepartment);
router.delete('/departments/:id', verifyToken, isCollegeAdmin, deleteDepartment);
router.post('/departments/:id/events', verifyToken, isCollegeAdmin, addDepartmentEvent);

// College profile and document routes
router.get('/profile', verifyToken, isCollegeAdmin, getCollegeProfile);
router.put('/profile', verifyToken, isCollegeAdmin, updateCollegeProfile);
router.post('/documents', verifyToken, isCollegeAdmin, addCollegeDocument);
router.get('/documents', verifyToken, isCollegeAdmin, getCollegeDocuments);
router.delete('/documents/:documentId', verifyToken, isCollegeAdmin, deleteCollegeDocument);

export default router; 