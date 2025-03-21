import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    currentSemester: {
        type: Number,
        required: true,
        min: 1
    },
    currentStudents: {
        type: Number,
        default: 0
    },
    metrics: {
        averageGrade: {
            type: Number,
            default: 0
        },
        passRate: {
            type: Number,
            default: 0
        }
    },
    coursePerformance: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        grade: Number,
        semester: Number
    }],
    topPerformers: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grade: Number
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
batchSchema.index({ branchId: 1, year: 1, section: 1 }, { unique: true });

// Pre-save middleware to update metrics
batchSchema.pre('save', function(next) {
    if (this.isModified('students')) {
        this.currentStudents = this.students.length;
    }
    next();
});

export const Batch = mongoose.model('Batch', batchSchema); 