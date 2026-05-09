import Topic from '../models/topic.js';

const topicControllers = {
	//[GET] /topic
	async list(req, res) {
		try {
			const topics = await Topic.find().sort({ order: 1, createdAt: 1 }).populate('linkedProblems', 'id name');
			res.status(200).json({ success: true, data: topics });
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
		}
	},

	//[GET] /topic/:topicId
	async get(req, res) {
		try {
			const { topicId } = req.params;
			let query = { topicId };
			
			// If it looks like a MongoDB ObjectId, allow searching by _id as well
			if (topicId.match(/^[0-9a-fA-F]{24}$/)) {
				query = { $or: [{ topicId }, { _id: topicId }] };
			}

			const topic = await Topic.findOne(query).populate('linkedProblems', 'id name');
			if (!topic) throw new Error('Topic not found');
			res.status(200).json({ success: true, data: topic });
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
		}
	},
};

export default topicControllers;
