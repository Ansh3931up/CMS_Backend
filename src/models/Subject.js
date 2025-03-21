import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    credits: {
        theory: Number,
        practical: Number,
        total: Number
    },
    description: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    syllabus: String,
    topics: [String],
    resources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    metrics: {
        totalStudents: {
            type: Number,
            default: 0
        },
        averageGrade: {
            type: Number,
            default: 0
        },
        gradeDistribution: {
            A: { type: Number, default: 0 },
            B: { type: Number, default: 0 },
            C: { type: Number, default: 0 },
            D: { type: Number, default: 0 },
            F: { type: Number, default: 0 }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
subjectSchema.index({ branch: 1, code: 1 });
subjectSchema.index({ instructor: 1 });

export const Subject = mongoose.model('Subject', subjectSchema); 