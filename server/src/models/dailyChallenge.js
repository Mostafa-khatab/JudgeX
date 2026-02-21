import mongoose from 'mongoose';

const dailyChallengeSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		username: {
			type: String,
			required: true,
		},
		problemId: {
			type: String,
			required: true,
		},
		problemName: {
			type: String,
			default: '',
		},
		difficulty: {
			type: String,
			enum: ['easy', 'medium', 'hard'],
			default: 'medium',
		},
		tags: {
			type: [String],
			default: [],
		},
		predictedScore: {
			type: Number,
			default: 0.5,
		},
		date: {
			type: Date,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		completedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

// Compound index: one challenge per user per day
dailyChallengeSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyChallengeSchema.index({ username: 1, date: 1 });

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);
export default DailyChallenge;
