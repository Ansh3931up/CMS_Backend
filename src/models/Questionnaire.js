import mongoose from 'mongoose';

const questionnaireSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  whatsappNumber: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    trim: true
  },
  linkedInProfile: {
    type: String,
    required: [true, 'LinkedIn profile is required'],
    trim: true
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  organizationType: {
    type: String,
    required: [true, 'Organization type is required'],
    enum: ['educational', 'corporate', 'other']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true
  },
  expectedUsage: {
    type: String,
    required: [true, 'Expected usage is required'],
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Questionnaire', questionnaireSchema); 