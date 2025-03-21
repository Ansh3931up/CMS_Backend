import {User} from '../models/User.js';

export const isSuperAdmin = async (req, res, next) => {
    // console.log("req.user", req.user);
    try {
        const user = await User.findById(req.user.userId);
        console.log("user", user);
        const allowedRoles = ['super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isCollegeAdmin = async (req, res, next) => {
    try {
        // console.log("req.user", req.user);
        const user = await User.findById(req?.user?.userId);
        // console.log("user", user);
        const allowedRoles = ['college_admin', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. College Admin only.' });
        }
        // console.log("user1111");
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isTeacher = async (req, res, next) => {
    try {
        const user = await User.findById(req?.user?.userId);
        const allowedRoles = ['teacher', 'college_admin', 'hod', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Teacher, College Admin, HOD or Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isClerk = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        const allowedRoles = ['clerk', 'teacher', 'college_admin', 'hod', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Clerk, Teacher, College Admin, HOD or Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isStudent = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        const allowedRoles = ['student', 'teacher', 'college_admin', 'hod', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Student, Teacher, College Admin, HOD or Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isHOD = async (req, res, next) => {
    try {
        const user = await User.findById(req?.user?.userId);
        console.log("user",user);
        const allowedRoles = ['hod', 'college_admin', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. HOD, College Admin or Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const isRecruiter = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        const allowedRoles = ['recruiter', 'super_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Recruiter or Super Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
};

export const canManageBatchTransition = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const allowedRoles = ['superadmin', 'college_admin', 'hod', 'clerk'];
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Only Super Admin, College Admin, HOD, or Clerk can manage batch transitions.' 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking role', error: error.message });
    }
}; 