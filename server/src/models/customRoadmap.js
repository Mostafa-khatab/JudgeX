import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true }
});

const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true }, // e.g., '1', '2', '2a'
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Progression Logic
  videoIds: [{ type: String }], 
  videoSearchUrl: { type: String }, // Fallback search URL
  linkedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  quizzes: [quizSchema],
  
  // States
  isVideoWatched: { type: Boolean, default: false },
  isQuizPassed: { type: Boolean, default: false },
  isProblemSolved: { type: Boolean, default: false },
  status: { type: String, enum: ['locked', 'unlocked', 'completed'], default: 'locked' }
});

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true }
});

const customRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  nodes: [nodeSchema],
  edges: [edgeSchema]
}, { timestamps: true });

const CustomRoadmap = mongoose.model('CustomRoadmap', customRoadmapSchema);

export default CustomRoadmap;
