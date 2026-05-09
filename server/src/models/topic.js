import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
	{
		question: { type: String, required: true },
		options: [{ type: String, required: true }],
		answer: { type: String, required: true },
	},
	{ _id: false }
);

const topicSchema = new mongoose.Schema(
	{
		order: { type: Number, default: 0 },
		topicId: { type: String, required: true, unique: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		videoUrl: { type: String, required: true },
		quizzes: [quizSchema],
		linkedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
	},
	{ timestamps: true }
);

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;
