import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Subject } from '../models/Subject.js';
import { Batch } from '../models/Batch.js';
import bcrypt from 'bcrypt';
import { sendVerificationStatusEmail } from '../utils/emailService.js';
import logger from '../utils/logger.js';
import CollegeDocument from '../models/CollegeDocument.js';
import { Invitation } from '../models/Invitation.js';
import { sendInvitationEmail } from '../utils/emailService.js';
import { Teacher } from '../models/Teacher.js';
import { HOD } from '../models/HOD.js';
import crypto from 'crypto';

export const createTeacher = async (req, res) => {
    try {
        console.log('Creating teacher with data:', req.body);
        
        const { name, email, branchId, profile } = req.body;

        // Validate required fields
        if (!name || !email || !branchId || !profile) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }
        const collegeAdmin = await User.findById(req.user.userId);
        console.log(collegeAdmin,"this");
        
        // Check if branch exists
        const branch = await Branch.findOne({
            _id: branchId,
            collegeId: collegeAdmin.college
        });

        if (!branch) {
            return res.status(404).json({
                message: 'Branch not found or not authorized'
            });
        }

        // Check if email already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({
                message: 'Teacher with this email already exists'
            });
        }

        // Create user account first
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'teacher',
            college: collegeAdmin.college
        });

        await user.save();

        // Create teacher profile
        const teacher = new Teacher({
            userId: user._id,
            name,
            email,
            branchId,
            profile,
            status: 'pending'
        });

        await teacher.save();

        // Generate invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');

        // Store this token in your database
        const invitation = new Invitation({
            token: invitationToken,
            email: email,
            role: 'teacher',
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
        await invitation.save();

        // Send invitation email
        try {
            await sendInvitationEmail({
                email,
                name,
                department: branch.name,
                college: req.user.collegeName,
                invitationToken,
                role: 'Teacher'
            });
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Continue even if email fails
        }

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: {
                id: teacher._id,
                userId: user._id,
                name: teacher.name,
                email: teacher.email,
                profile: teacher.profile,
                status: teacher.status
            }
        });

    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({
            message: 'Error creating teacher',
            error: error.message
        });
    }
};

export const getCollegeStats = async (req, res) => {
    try {
        const collegeId = req.user.college;

        const stats = await College.aggregate([
            { $match: { _id: collegeId } },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: 'collegeId',
                    as: 'branches'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'college',
                    as: 'users'
                }
            },
            {
                $project: {
                    totalBranches: { $size: '$branches' },
                    totalStudents: {
                        $size: {
                            $filter: {
                                input: '$users',
                                as: 'user',
                                cond: { $eq: ['$$user.role', 'student'] }
                            }
                        }
                    },
                    totalTeachers: {
                        $size: {
                            $filter: {
                                input: '$users',
                                as: 'user',
                                cond: { $eq: ['$$user.role', 'teacher'] }
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json(stats[0]);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const updateEmailSettings = async (req, res) => {
    try {
        const {
            emailDomain,
            alumniEmailDomains,
            verificationSettings
        } = req.body;
        const collegeId = req.user.college;

        const college = await College.findByIdAndUpdate(
            collegeId,
            {
                emailDomain,
                alumniEmailDomains,
                verificationSettings
            },
            { new: true }
        );

        res.status(200).json({
            message: 'Email settings updated successfully',
            college
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const verifyAlumni = async (req, res) => {
    try {
        const { userId, verificationStatus, remarks } = req.body;
        const collegeId = req.user.college;

        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                college: collegeId,
                userType: 'alumni'
            },
            {
                verificationStatus,
                'verification.remarks': remarks,
                'verification.verifiedBy': req.user._id,
                'verification.verifiedAt': new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found or unauthorized'
            });
        }

        // Send email notification to alumni about verification status
        await sendVerificationStatusEmail(user, verificationStatus);

        res.status(200).json({
            message: 'Alumni verification status updated',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const addDepartment = async (req, res) => {
    try {
        const { 
            name, 
            code, 
            totalSemesters, 
            hodEmail,
            curriculum,
            description 
        } = req.body;

        console.log("Creating department with data:", req.body);

        // Validate required fields
        if (!name || !code || !totalSemesters) {
            return res.status(400).json({
                message: 'Missing required fields. Name, code, and totalSemesters are required.'
            });
        }

        const collegeAdmin = await User.findById(req.user.userId);
        
        // Check if department code already exists
        const existingBranch = await Branch.findOne({ 
            collegeId: collegeAdmin.college,
            code: code 
        });

        if (existingBranch) {
            return res.status(400).json({
                message: 'Department with this code already exists in your college'
            });
        }

        // Create HOD if email provided
        let hodId = null;
        let hodUserId = null;
        if (hodEmail) {
            // Check if HOD already exists
            const existingHOD = await HOD.findOne({ email: hodEmail });
            if (existingHOD) {
                return res.status(400).json({
                    message: 'HOD with this email already exists'
                });
            }

            // Create user account for HOD
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            const hodUser = new User({
                email: hodEmail,
                password: hashedPassword,
                role: 'hod',
                college: collegeAdmin.college,
                status: 'pending',
                name: `HOD of ${name}`
            });
            await hodUser.save();
            hodUserId = hodUser._id;

            // Create HOD profile
            const hod = new HOD({
                userId: hodUser._id,
                name: `HOD of ${name}`, // Temporary name until registration
                email: hodEmail,
                branchId: null, // Will be updated after branch creation
                profile: {
                    qualification: "To be updated",
                    specialization: "To be updated",
                    experience: 0,
                    phone: "To be updated",
                    department: name
                },
                status: 'pending'
            });
            await hod.save();
            hodId = hod._id;

            // Generate invitation token
            const invitationToken = Math.random().toString(36).substring(7);

            // Create invitation record
            const invitation = new Invitation({
                token: invitationToken,
                email: hodEmail,
                role: 'hod',
                status: 'pending',
                collegeId: collegeAdmin.college._id,
                createdBy: req.user.userId,
                department: name,
                message: `You have been invited to join ${name} department as HOD.`,
                subject: `Invitation to join as HOD of ${name}`,
                recipientType: 'individual',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            await invitation.save();

            // Send invitation email
            try {
                await sendInvitationEmail({
                    email: hodEmail,
                    name: `HOD of ${name}`,
                    department: name,
                    college: collegeAdmin.college.name,
                    invitationToken,
                    role: 'HOD'
                });
            } catch (emailError) {
                console.error('Failed to send invitation email:', emailError);
                // Continue even if email fails
            }
        }

        const newBranch = new Branch({
            name,
            code,
            totalSemesters,
            collegeId: collegeAdmin.college,
            hodId,
            curriculum: curriculum || {
                name: `${code} Curriculum`,
                version: '1.0',
                lastUpdated: new Date()
            },
            description,
            metrics: {
                totalTeachers: 0,
                totalStudents: 0,
                passRate: 0
            }
        });

        await newBranch.save();

        // Update HOD's branchId if HOD was created
        if (hodId) {
            await HOD.findByIdAndUpdate(hodId, { branchId: newBranch._id });
        }

        res.status(201).json({
            message: 'Department created successfully',
            branch: newBranch,
            hod: hodId ? {
                id: hodId,
                userId: hodUserId,
                email: hodEmail,
                status: 'pending'
            } : null
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({
            message: 'Error creating department',
            error: error.message
        });
    }
};

export const getDepartments = async (req, res) => {
    try {
        const collegeAdmin = await User.findById(req.user.userId);

        const branches = await Branch.find({ collegeId: collegeAdmin.college })
            .populate('hodId', 'name email media.avatar')
            .populate({
                path: 'batches',
                select: 'year section currentStudents metrics',
                populate: {
                    path: 'topPerformers.student',
                    select: 'name email media.avatar'
                }
            });

        // Enhance branch data with additional metrics
        const enhancedBranches = await Promise.all(branches.map(async (branch) => {
            const teachers = await User.countDocuments({
                college: collegeAdmin.college,
                department: branch._id,
                role: 'teacher'
            });

            const subjects = await Subject.countDocuments({
                branch: branch._id
            });

            return {
                ...branch.toObject(),
                metrics: {
                    ...branch.metrics,
                    totalTeachers: teachers,
                    totalSubjects: subjects
                }
            };
        }));

        res.status(200).json(enhancedBranches);
    } catch (error) {
        logger.error('Error fetching departments:', error);
        res.status(500).json({
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            code,
            description,
            totalSemesters,
            hodEmail, // New field for HOD email
            curriculum,
            metrics,
            performance,
            events
        } = req.body;

        const collegeAdmin = await User.findById(req.user.userId);

        const branch = await Branch.findOne({
            _id: id,
            collegeId: collegeAdmin.college
        });

        if (!branch) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if department code is unique if being updated
        if (code && code !== branch.code) {
            const existingBranch = await Branch.findOne({
                collegeId: collegeAdmin.college,
                code: code,
                _id: { $ne: id }
            });

            if (existingBranch) {
                return res.status(400).json({
                    message: 'Department with this code already exists in your college'
                });
            }
            branch.code = code;
        }

        // Update HOD if new email provided
        if (hodEmail && (!branch.hodId || hodEmail !== branch.hodId.email)) {
            // Check if HOD already exists
            const existingHOD = await HOD.findOne({ 
                email: hodEmail,
                _id: { $ne: branch.hodId }
            });

            if (existingHOD) {
                return res.status(400).json({
                    message: 'HOD with this email already exists'
                });
            }

            // Create user account for new HOD
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            const hodUser = new User({
                email: hodEmail,
                password: hashedPassword,
                role: 'hod',
                college: collegeAdmin.college,
                status: 'pending',
                name: `HOD of ${name || branch.name}`
            });
            await hodUser.save();

            // Create HOD profile
            const hod = new HOD({
                userId: hodUser._id,
                name: `HOD of ${name || branch.name}`,
                email: hodEmail,
                branchId: branch._id,
                profile: {
                    qualification: "To be updated",
                    specialization: "To be updated",
                    experience: 0,
                    phone: "To be updated",
                    department: name || branch.name
                },
                status: 'pending'
            });
            await hod.save();

            // Update branch with new HOD
            branch.hodId = hod._id;

            // Send invitation email to new HOD
            const invitationToken = Math.random().toString(36).slice(-8);
            try {
                await sendInvitationEmail({
                    email: hodEmail,
                    name: `HOD of ${name || branch.name}`,
                    department: name || branch.name,
                    college: collegeAdmin.college.name,
                    invitationToken,
                    role: 'HOD'
                });
            } catch (emailError) {
                console.error('Failed to send invitation email:', emailError);
            }
        }

        // Update basic info
        if (name) branch.name = name;
        if (description) branch.description = description;
        if (totalSemesters) branch.totalSemesters = totalSemesters;

        // Update curriculum with detailed structure
        if (curriculum) {
            branch.curriculum = {
                name: curriculum.name || `${branch.code} Curriculum`,
                version: curriculum.version || '1.0',
                lastUpdated: new Date(),
                description: curriculum.description,
                semesters: curriculum.semesters || [],
                electives: curriculum.electives || [],
                specializations: curriculum.specializations || [],
                totalCredits: curriculum.totalCredits,
                requirements: curriculum.requirements || {},
                outcomes: curriculum.outcomes || []
            };
        }

        // Update metrics and performance data
        if (metrics) {
            branch.metrics = {
                ...branch.metrics,
                ...metrics,
                lastUpdated: new Date()
            };
        }

        if (performance) {
            branch.performance = {
                ...branch.performance,
                ...performance,
                lastUpdated: new Date()
            };
        }

        if (events) {
            branch.events = events;
        }

        await branch.save();

        // Fetch updated branch with populated fields
        const updatedBranch = await Branch.findById(id)
            .populate('hodId', 'name email media.avatar profile status')
            .populate({
                path: 'batches',
                select: 'year section currentStudents metrics',
                populate: {
                    path: 'topPerformers.student',
                    select: 'name email media.avatar'
                }
            });

        res.status(200).json({
            message: 'Department updated successfully',
            branch: updatedBranch
        });
    } catch (error) {
        logger.error('Error updating department:', error);
        res.status(500).json({
            message: 'Error updating department',
            error: error.message
        });
    }
};

export const getDepartmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const collegeAdmin = await User.findById(req.user.userId);

        const branch = await Branch.findOne({
            _id: id,
            collegeId: collegeAdmin.college
        })
        .populate('hodId', 'name email media.avatar')
        .populate({
            path: 'batches',
            populate: [
                {
                    path: 'students',
                    select: 'name email media.avatar'
                },
                {
                    path: 'topPerformers.student',
                    select: 'name email media.avatar'
                }
            ]
        });

        if (!branch) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Get additional statistics
        const teachers = await User.find({
            college: collegeAdmin.college,
            department: branch._id,
            role: 'teacher'
        }).select('name email media.avatar');

        const subjects = await Subject.find({ branch: branch._id })
            .populate('instructor', 'name email media.avatar');

        const departmentStats = {
            ...branch.toObject(),
            teachers,
            subjects,
            metrics: {
                ...branch.metrics,
                totalTeachers: teachers.length,
                totalSubjects: subjects.length
            }
        };

        res.status(200).json(departmentStats);
    } catch (error) {
        logger.error('Error fetching department details:', error);
        res.status(500).json({
            message: 'Error fetching department details',
            error: error.message
        });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const collegeAdmin = await User.findById(req.user.id);

        const branch = await Branch.findOneAndDelete({
            _id: id,
            collegeId: collegeAdmin.college
        });

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.status(200).json({
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting branch',
            error: error.message
        });
    }
};

export const getStudents = async (req, res) => {
    try {
        const students = await User.find({
            college: req.user.college,
            role: 'student'
        }).select('-password');

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

export const getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({
            college: req.user.college,
            role: 'teacher'
        }).select('-password');

        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
};

export const getClerks = async (req, res) => {
    try {
        const clerks = await User.find({
            college: req.user.college,
            role: 'clerk'
        }).select('-password');

        res.status(200).json(clerks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clerks', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Remove sensitive fields from update data
        delete updateData.password;
        delete updateData.role;
        delete updateData.college;

        const user = await User.findOneAndUpdate(
            { _id: userId, college: req.user.college },
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findOneAndDelete({
            _id: userId,
            college: req.user.college
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const collegeId = req.user.college;

        // Get total counts
        const totalStudents = await User.countDocuments({ 
            college: collegeId, 
            role: 'student' 
        });

        const totalTeachers = await User.countDocuments({ 
            college: collegeId, 
            role: 'teacher' 
        });

        const totalBranches = await Branch.countDocuments({ 
            collegeId: collegeId 
        });

        // Get recent users
        const recentUsers = await User.find({ 
            college: collegeId,
            role: { $in: ['student', 'teacher'] }
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt');

        // Get branches with student count
        const branchStats = await Branch.aggregate([
            { $match: { collegeId: collegeId } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'branch',
                    as: 'students'
                }
            },
            {
                $project: {
                    name: 1,
                    studentCount: {
                        $size: {
                            $filter: {
                                input: '$students',
                                as: 'student',
                                cond: { $eq: ['$$student.role', 'student'] }
                            }
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            stats: {
                totalStudents,
                totalTeachers,
                totalBranches
            },
            recentUsers,
            branchStats
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching dashboard stats', 
            error: error.message 
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const collegeId = req.user.college; // Get college ID from authenticated admin

        const user = await User.findOne({ 
            _id: userId,
            college: collegeId // Ensure user belongs to admin's college
        })
            .populate('department', 'name code')
            .populate('college', 'name code emailDomain logo')
            .select('-password -__v')
            .lean();

        if (!user) {
            return res.status(404).json({
                message: 'User not found or not authorized to view this user'
            });
        }

        res.status(200).json({
            message: 'User retrieved successfully',
            user
        });

    } catch (error) {
        logger.error('Error fetching user:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { 
            role,
            departmentId,
            page = 1, 
            limit = 20,
            search,
            sortBy = 'name',
            order = 'asc'
        } = req.query;

        // Build query with college restriction
        const query = {
            college: req.user.college // Only get users from admin's college
        };

        if (role) {
            query.role = role;
        }

        if (departmentId) {
            query.department = departmentId;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Count total matching documents
        const totalUsers = await User.countDocuments(query);

        // Get paginated results
        const users = await User.find(query)
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('department', 'name code')
            .select('-password -__v')
            .lean();

        res.status(200).json({
            users,
            pagination: {
                total: totalUsers,
                page: parseInt(page),
                pages: Math.ceil(totalUsers / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

export const updateCollegeProfile = async (req, res) => {
    try {
        const collegeId = req.user.college; // Get college ID from authenticated admin
        const {
            basicInfo,
            about,
            socialMedia,
            verificationSettings,
            coverImage,
            accreditations,
            rankings,
            academics
        } = req.body;

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                message: 'College not found'
            });
        }

        // Update only allowed fields
        if (basicInfo) {
            college.basicInfo = {
                ...college.basicInfo,
                ...basicInfo
            };
        }

        if (about) {
            college.about = {
                ...college.about,
                ...about
            };
        }

        if (socialMedia) {
            college.socialMedia = {
                ...college.socialMedia,
                ...socialMedia
            };
        }

        if (verificationSettings) {
            college.verificationSettings = {
                ...college.verificationSettings,
                ...verificationSettings
            };
        }

        if (coverImage) {
            college.media.coverImage = coverImage;
        }

        if (accreditations) {
            college.accreditations = accreditations;
        }

        if (rankings) {
            college.rankings = rankings;
        }

        if (academics) {
            college.academics = {
                ...college.academics,
                ...academics
            };
        }

        college.metadata.updatedAt = new Date();
        await college.save();

        res.status(200).json({
            message: 'College profile updated successfully',
            college
        });
    } catch (error) {
        logger.error('Error updating college profile:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Add document management
export const addCollegeDocument = async (req, res) => {
    try {
        const newDocument = new CollegeDocument({
            collegeId: req.user.collegeId,
            title: req.body.title,
            documentUrl: req.body.documentUrl,
            documentType: req.body.documentType,
            description: req.body.description
        });
        
        const savedDocument = await newDocument.save();
        res.status(201).json(savedDocument);
    } catch (error) {
        res.status(500).json({ message: 'Error adding document', error: error.message });
    }
};

// Get all college documents
export const getCollegeDocuments = async (req, res) => {
    try {
        const documents = await CollegeDocument.find({ collegeId: req.user.collegeId });
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};

// Delete college document
export const deleteCollegeDocument = async (req, res) => {
    try {
        const document = await CollegeDocument.findOneAndDelete({
            _id: req.params.documentId,
            collegeId: req.user.collegeId
        });
        
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
};

// Get college profile
export const getCollegeProfile = async (req, res) => {
    try {
        const college = await College.findById(req.user.collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.status(200).json(college);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching college profile', error: error.message });
    }
};

export const addDepartmentEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const eventData = req.body;
        const collegeAdmin = await User.findById(req.user.userId);

        const branch = await Branch.findOne({
            _id: id,
            collegeId: collegeAdmin.college
        });

        if (!branch) {
            return res.status(404).json({ message: 'Department not found' });
        }

        branch.events.push(eventData);
        await branch.save();

        res.status(201).json({
            message: 'Event added successfully',
            event: branch.events[branch.events.length - 1]
        });
    } catch (error) {
        logger.error('Error adding department event:', error);
        res.status(500).json({
            message: 'Error adding department event',
            error: error.message
        });
    }
};


