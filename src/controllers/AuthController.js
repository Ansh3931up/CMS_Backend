import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import passport from 'passport';
import logger from '../utils/logger.js';
import { Invitation } from '../models/Invitation.js';
import { HOD } from '../models/HOD.js';
import { Teacher } from '../models/Teacher.js';


export const getUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId)
            .populate('college') // Populate college details
            .populate('collegeId') // Populate collegeId details
            .populate('department') // Populate department details
            .populate('metadata.createdBy') // Populate user who created this account
            .select('-password -metadata.passwordResetToken -metadata.passwordResetExpires -__v') // Exclude sensitive data
            // .lean(); // Convert to plain JavaScript object

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        logger.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If user has googleId and no password, suggest Google login
        if (user.googleId && !user.password) {
            return res.status(400).json({
                message: 'Please sign in with Google',
                useGoogle: true
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.security('Failed login attempt', { email });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id,
                 role: user.role,
                  status: user.status,
                   lastLogin: new Date(), },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        logger.info(`User logged in: ${email}`);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            collegeId,
            departmentId,
            avatar, // URL of the uploaded avatar
            profile
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                error: 'Email already in use'
            });
        }

        // Generate default avatar if none provided
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with avatar
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            college: collegeId,
            collegeId,
            department: departmentId,
            media: {
                avatar: {
                    url: avatar || defaultAvatar,
                    publicId: '', // Will be filled if using cloud storage
                    uploadedAt: new Date()
                }
            },
            profile: {
                bio: profile?.bio || '',
                phone: profile?.phone || '',
                dateOfBirth: profile?.dateOfBirth || null,
                gender: profile?.gender || 'prefer_not_to_say',
                address: {
                    street: profile?.address?.street || '',
                    city: profile?.address?.city || '',
                    state: profile?.address?.state || '',
                    country: profile?.address?.country || '',
                    pincode: profile?.address?.pincode || ''
                }
            },
            status: 'pending',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: user.getPublicProfile(),
            token
        });

    } catch (error) {
        logger.error('Error in user registration:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const registerStudent = async (req, res) => {
    try {
        // Get data from request body instead of hardcoding
        const studentData = req.body;

        // Validate required fields
        if (!studentData.name || !studentData.email || !studentData.password) {
            return res.status(400).json({
                message: 'Missing required fields',
                error: 'Name, email and password are required'
            });
        }

        // Check if student already exists
        const existingUser = await User.findOne({ email: studentData.email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                error: 'Email already in use'
            });
        }

        // Generate default avatar
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random`;

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Create new student user
        const student = new User({
            name: studentData.name,
            email: studentData.email,
            password: hashedPassword,
            role: studentData.role,
            college: studentData.collegeId,
            collegeId: studentData.collegeId,
            department: studentData.departmentId,
            media: {
                avatar: {
                    url: defaultAvatar,
                    publicId: '',
                    uploadedAt: new Date()
                }
            },
            profile: studentData.profile,
            academicDetails: studentData.academicDetails,
            status: 'active',
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        await student.save();

        // Generate token
        const token = jwt.sign(
            { userId: student._id, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Student registered successfully',
            user: student.getPublicProfile(),
            token
        });

    } catch (error) {
        logger.error('Error in student registration:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const forgotPassword = async (req, res) => {
    // Implementation
};

export const resetPassword = async (req, res) => {
    // Implementation
};

export const logout = async (req, res) => {
    try {
        // For future session handling
        logger.info(`User logged out: ${req.user?.email}`);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

export const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
            logger.error('Google auth error:', err);
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }

        if (!user) {
            logger.warn('Google auth failed:', info);
            return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        logger.info(`User logged in via Google: ${user.email}`);
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    })(req, res, next);
};

export const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.status(200).json({ user });
    } catch (error) {
        logger.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const verifyInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find invitation by token
        const invitation = await Invitation.findOne({
            'recipients.token': token,
            'recipients.status': 'sent'
        });

        if (!invitation) {
            return res.status(404).json({
                message: 'Invalid or expired invitation'
            });
        }

        // Get recipient details
        const recipient = invitation.recipients.find(r => r.token === token);

        res.status(200).json({
            message: 'Valid invitation',
            data: {
                email: recipient.email,
                role: invitation.metadata.role,
                department: invitation.metadata.department
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error verifying invitation',
            error: error.message
        });
    }
};

export const completeRegistration = async (req, res) => {
    try {
        const { token } = req.params;
        const { name, password, phone, qualification, specialization } = req.body;

        console.log('Registration data received:', {
            token,
            name,
            // Don't log password
            phone,
            qualification,
            specialization
        });

        // Validate password
        if (!password) {
            return res.status(400).json({
                message: 'Password is required'
            });
        }

        // Find and validate invitation
        const invitation = await Invitation.findOne({
            token,
            status: 'pending'
        });

        if (!invitation) {
            return res.status(404).json({
                message: 'Invalid or expired invitation'
            });
        }

        // Find the user
        const user = await User.findOne({ email: invitation.email });
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Hash password with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password and status
        user.password = hashedPassword;
        user.status = 'active';
        await user.save();

        // Update HOD or Teacher profile based on role
        if (invitation.role === 'hod') {
            await HOD.findOneAndUpdate(
                { userId: user._id },
                {
                    name,
                    status: 'active',
                    profile: {
                        qualification,
                        specialization,
                        phone,
                        department: invitation.department
                    }
                }
            );
        } else if (invitation.role === 'teacher') {
            await Teacher.findOneAndUpdate(
                { userId: user._id },
                {
                    name,
                    status: 'active',
                    profile: {
                        position: 'Assistant Professor',
                        specialization,
                        phone
                    }
                }
            );
        }

        // Update invitation status
        invitation.status = 'completed';
        await invitation.save();

        res.status(200).json({
            message: 'Registration completed successfully',
            user: {
                email: user.email,
                role: invitation.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error completing registration',
            error: error.message
        });
    }
}; 