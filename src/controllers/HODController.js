import { Branch } from '../models/Branch.js';
import { Batch } from '../models/Batch.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';



const createBatch = async (req, res) => {
    try {
        const { 
            branchId, 
            year, 
            section, 
            capacity, 
            currentSemester,
            students,
            metrics 
        } = req.body;

        // Check user role and permissions
        const userRole = req.user.role;
        if (!['hod', 'super_admin', 'college_admin'].includes(userRole)) {
            return res.status(403).json({ message: 'Unauthorized: Insufficient permissions' });
        }

        let branch;
        // Different validation logic based on role
        if (userRole === 'hod') {
            branch = await Branch.findOne({
                _id: branchId,
                hodId: req.user.userId
            });
        } else if (userRole === 'college_admin') {
            const collegeAdmin = await User.findById(req.user.userId);
            branch = await Branch.findOne({
                _id: branchId,
                collegeId: collegeAdmin.college
            });
        } else {
            // super_admin can access any branch
            branch = await Branch.findById(branchId);
        }

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found or unauthorized' });
        }

        const batch = new Batch({
            branchId,
            year,
            section,
            capacity,
            currentSemester,
            students: students || [],
            currentStudents: students ? students.length : 0,
            metrics: metrics || {
                averageGrade: null,
                passRate: null
            }
        });

        await batch.save();

        // Add batch to branch
        branch.batches.push(batch._id);
        await branch.save();

        res.status(201).json({
            message: 'Batch created successfully',
            batchId: batch._id,  // Explicitly including batchId in response
            batch
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getBranchDetails = async (req, res) => {
    try {
        const branch = await Branch.findOne({
            _id: req.params.branchId,
            hodId: req.user._id
        })
        .populate({
            path: 'batches',
            populate: {
                path: 'students',
                select: 'name email'
            }
        })
        .populate('hodId', 'name email')
        .populate({
            path: 'performance.topPerformers.student',
            select: 'name email'
        });

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        // Get additional statistics
        const subjects = await Subject.find({ branch: branch._id });
        const teachers = await User.find({
            college: branch.collegeId,
            role: 'teacher',
            department: branch._id
        });

        const branchStats = {
            ...branch.toObject(),
            totalSubjects: subjects.length,
            totalTeachers: teachers.length
        };

        res.status(200).json(branchStats);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateBranchMetrics = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { metrics, performance, events } = req.body;

        const branch = await Branch.findOne({
            _id: branchId,
            hodId: req.user._id
        });

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        if (metrics) {
            branch.metrics = { ...branch.metrics, ...metrics };
        }

        if (performance) {
            branch.performance = { ...branch.performance, ...performance };
        }

        if (events) {
            branch.events = events;
        }

        await branch.save();

        res.status(200).json({
            message: 'Branch metrics updated successfully',
            branch
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateBatchPerformance = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { coursePerformance, topPerformers, metrics } = req.body;

        const batch = await Batch.findOne({
            _id: batchId,
            branchId: { $in: await Branch.find({ hodId: req.user._id }).select('_id') }
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found or unauthorized' });
        }

        if (coursePerformance) {
            batch.coursePerformance = coursePerformance;
        }

        if (topPerformers) {
            batch.topPerformers = topPerformers;
        }

        if (metrics) {
            batch.metrics = { ...batch.metrics, ...metrics };
        }

        await batch.save();

        res.status(200).json({
            message: 'Batch performance updated successfully',
            batch
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getBranchEvents = async (req, res) => {
    try {
        const { branchId } = req.params;

        const branch = await Branch.findOne({
            _id: branchId,
            hodId: req.user._id
        }).select('events');

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.status(200).json(branch.events);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const addBranchEvent = async (req, res) => {
    try {
        const { branchId } = req.params;
        const eventData = req.body;

        const branch = await Branch.findOne({
            _id: branchId,
            hodId: req.user._id
        });

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        branch.events.push(eventData);
        await branch.save();

        res.status(201).json({
            message: 'Event added successfully',
            event: branch.events[branch.events.length - 1]
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const createSubject = async (req, res) => {
    try {
        const {
            name,
            code,
            branch,
            semester,
            credits,
            description,
            instructor,
            topics
        } = req.body;

        // Check user role and permissions
        const userRole = req.user.role;
        if (!['hod', 'super_admin', 'college_admin'].includes(userRole)) {
            return res.status(403).json({ message: 'Unauthorized: Insufficient permissions' });
        }

        // Different validation logic based on role
        if (userRole === 'hod') {
            // HOD can only create subjects for their branches
            const branchExists = await Branch.findOne({
                _id: branch,
                hodId: req.user._id
            });

            if (!branchExists) {
                return res.status(404).json({ message: 'Branch not found or unauthorized' });
            }
        } else if (userRole === 'college_admin') {
            // CollegeAdmin can create subjects for any branch in their college
            const collegeAdmin = await User.findById(req.user.userId);
            const branchExists = await Branch.findOne({
                _id: branch,
                collegeId: collegeAdmin.college
            });

            if (!branchExists) {
                return res.status(404).json({ message: 'Branch not found or unauthorized' });
            }
        }
        // SuperAdmin can create subjects for any branch

        // Get the college ID based on user role
        let collegeId;
        if (userRole === 'super_admin') {
            // For super_admin, we need to get the college ID from the branch
            const branch = await Branch.findById(branch);
            collegeId = branch.collegeId;
        } else {
            // For college_admin and hod, get college from their user record
            // console.log(req.user,"this is user id");
            const user = await User.findById(req.user.userId);
            console.log(user,"this is user");
            collegeId = user.college;
        }
        const teacheremail=await Teacher.findOne({
            _id:instructor
        })
        console.log(teacheremail,"this is teacher email");
        // Verify instructor exists and belongs to the appropriate college
        const instructorQuery = {
            email: teacheremail.email,
            role: 'teacher',
            college: collegeId
        };
        console.log(instructorQuery,"this is instructor query");
        const instructorExists = await User.findOne(instructorQuery);
        console.log(instructorExists,"this is instructor exists");

        if (!instructorExists) {
            return res.status(404).json({ message: 'Instructor not found or does not belong to the correct college' });
        }

        const subject = new Subject({
            name,
            code,
            branch,
            semester,
            credits,
            description,
            instructor,
            topics
        });

        await subject.save();

        res.status(201).json({
            message: 'Subject created successfully',
            subject
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export {
    createSubject,
    addBranchEvent,
    getBranchEvents,
    updateBranchMetrics,
    getBranchDetails,
    createBatch,
    updateBatchPerformance
}