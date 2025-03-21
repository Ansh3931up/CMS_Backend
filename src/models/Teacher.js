import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    profile: {
        position: {
            type: String,
            required: true
        },
        specialization: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        qualification: String,
        experience: Number,
        department: String
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
teacherSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export const Teacher = mongoose.model('Teacher', teacherSchema);