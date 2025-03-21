import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    collegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: true
    },
    hodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    curriculum: {
        name: String,
        version: String,
        lastUpdated: Date
    },
    description: String,
    metrics: {
        totalTeachers: {
            type: Number,
            default: 0
        },
        totalStudents: {
            type: Number,
            default: 0
        },
        passRate: {
            type: Number,
            default: 0
        }
    },
    performance: {
        topPerformers: [{
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            score: Number
        }],
        semesterData: [{
            semester: String,
            passRate: Number,
            averageGrade: Number
        }],
        coursePerformance: [{
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject'
            },
            passRate: Number,
            averageGrade: Number
        }]
    },
    events: [{
        title: String,
        date: Date,
        time: String,
        location: String,
        description: String,
        type: {
            type: String,
            enum: ['workshop', 'seminar', 'conference', 'competition', 'cultural', 'technical', 'sports', 'other']
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming'
        }
    }],
    batches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    }],
    totalSemesters: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
branchSchema.index({ collegeId: 1, code: 1 }, { unique: true });
branchSchema.index({ hodId: 1 });

// Virtual for getting department statistics
branchSchema.virtual('statistics').get(function() {
    return {
        totalBatches: this.batches.length,
        totalTeachers: this.metrics.totalTeachers,
        totalStudents: this.metrics.totalStudents,
        passRate: this.metrics.passRate
    };
});

// Pre-save middleware to update metrics
branchSchema.pre('save', async function(next) {
    if (this.isModified('batches')) {
        // Update total students count
        const Batch = mongoose.model('Batch');
        const batches = await Batch.find({ _id: { $in: this.batches } });
        this.metrics.totalStudents = batches.reduce((total, batch) => 
            total + (batch.currentStudents || 0), 0);
    }
    next();
});

export const Branch = mongoose.model('Branch', branchSchema); 