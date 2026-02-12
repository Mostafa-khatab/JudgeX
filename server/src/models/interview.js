import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Interview Schema - LeetCode-style Technical Interview Platform
 */
const interviewSchema = new mongoose.Schema({
  // ==================== Basic Info ====================
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['assessment', 'mock', 'screening', 'technical'],
    default: 'technical'
  },
  description: {
    type: String,
    default: ''
  },
  
  // ==================== Timing ====================
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180,
    default: 60 // minutes
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  
  // ==================== Status ====================
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'finished', 'cancelled'],
    default: 'pending'
  },
  
  // ==================== Participants ====================
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    joinedAt: { type: Date, default: null },
    isConnected: { type: Boolean, default: false }
  },
  
  // ==================== Access ====================
  inviteToken: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  
  // ==================== Shared State (Source of Truth) ====================
  state: {
    code: { type: String, default: '// Start coding here...\n' },
    language: { type: String, default: 'cpp' },
    activeProblemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', default: null },
    remainingTime: { type: Number, default: null }, // seconds
    cursorPositions: {
      interviewer: { line: Number, column: Number },
      candidate: { line: Number, column: Number }
    }
  },
  
  // ==================== Languages ====================
  allowedLanguages: {
    type: [String],
    default: ['cpp', 'python', 'javascript', 'java'],
    validate: {
      validator: function(v) {
        const validLangs = ['cpp', 'c', 'python', 'javascript', 'java', 'go', 'rust', 'typescript'];
        return v.every(lang => validLangs.includes(lang));
      },
      message: 'Invalid programming language'
    }
  },
  
  // ==================== Problems ====================
  questions: [{
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
    problemName: String,
    problemDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    isVisible: { type: Boolean, default: false }, // Only interviewer sees all
    isCustom: { type: Boolean, default: false },
    customContent: {
      title: String,
      description: String,
      examples: String,
      constraints: String
    },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 }
  }],
  
  // ==================== Chat Messages ====================
  messages: [{
    role: { type: String, enum: ['interviewer', 'candidate', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // ==================== Private Feedback (Interviewer Only) ====================
  feedback: {
    problemSolving: {
      score: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' }
    },
    communication: {
      score: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' }
    },
    codingStyle: {
      score: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' }
    },
    technicalKnowledge: {
      score: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' }
    },
    overallNotes: { type: String, default: '' },
    recommendation: { 
      type: String, 
      enum: ['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire', null],
      default: null 
    }
  },
  
  // ==================== Code Snapshots ====================
  snapshots: [{
    timestamp: { type: Date, default: Date.now },
    code: { type: String, required: true },
    language: { type: String, required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
    note: { type: String, default: '' },
    isAutomatic: { type: Boolean, default: true }
  }],
  
  // ==================== Proctoring / Anti-Cheat ====================
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  events: [{
    type: { 
      type: String, 
      enum: ['focus-lost', 'focus-gained', 'paste-attempt', 'copy-attempt', 'tab-switch', 'problem-changed', 'language-changed', 'snapshot-taken']
    },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // ==================== Video/Audio Settings ====================
  mediaSettings: {
    videoEnabled: { type: Boolean, default: true },
    audioEnabled: { type: Boolean, default: true },
    screenShareEnabled: { type: Boolean, default: true }
  }

}, {
  timestamps: true
});

// ==================== Indexes ====================
interviewSchema.index({ instructor: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ createdAt: -1 });

// ==================== Virtual: Total Score ====================
interviewSchema.virtual('totalScore').get(function() {
  const f = this.feedback;
  const scores = [
    f.problemSolving?.score,
    f.communication?.score,
    f.codingStyle?.score,
    f.technicalKnowledge?.score
  ].filter(s => s !== null);
  
  if (scores.length === 0) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
});

// ==================== Virtual: Duration Used ====================
interviewSchema.virtual('durationUsed').get(function() {
  if (!this.startedAt) return 0;
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 1000); // seconds
});

// ==================== Methods ====================
interviewSchema.methods.incrementTabSwitch = async function() {
  this.tabSwitchCount += 1;
  this.events.push({
    type: 'tab-switch',
    timestamp: new Date(),
    details: { count: this.tabSwitchCount }
  });
  return this.save();
};

interviewSchema.methods.addSnapshot = async function(code, language, problemId, note = '', isAutomatic = true) {
  this.snapshots.push({
    code,
    language,
    problemId,
    note,
    isAutomatic,
    timestamp: new Date()
  });
  this.events.push({
    type: 'snapshot-taken',
    timestamp: new Date(),
    details: { isAutomatic }
  });
  return this.save();
};

// ==================== Serialize ====================
interviewSchema.set('toJSON', { virtuals: true });
interviewSchema.set('toObject', { virtuals: true });

export default mongoose.model('Interview', interviewSchema);
