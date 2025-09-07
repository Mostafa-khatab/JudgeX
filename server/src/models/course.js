import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		url: { type: String, required: true },
		duration: { type: String, default: '' },
		description: { type: String, default: '' },
		order: { type: Number, default: 0 },
	},
	{ _id: false },
);

const linkSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		url: { type: String, required: true },
		description: { type: String, default: '' },
		type: { type: String, enum: ['documentation', 'tutorial', 'reference', 'other'], default: 'other' },
	},
	{ _id: false },
);

const ratingSchema = new mongoose.Schema(
	{
		user: { type: String, required: true },
		value: { type: Number, required: true, min: 1, max: 5 },
	},
	{ _id: false },
);

const courseSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, unique: true },
		description: { type: String, required: true },
		instructor: { type: String, required: true },
		thumbnail: { type: String, default: '' },
		videos: [videoSchema],
		links: [linkSchema],
		tags: [String],
		difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
		duration: { type: String, default: '' },
		isPublished: { type: Boolean, default: false },
		enrolledUsers: [String],
		rating: { type: Number, default: 0, min: 0, max: 5 },
		ratingCount: { type: Number, default: 0 },
		ratings: [ratingSchema],
	},
	{ timestamps: true },
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
