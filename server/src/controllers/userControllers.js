import User from '../models/user.js';
import { getTop } from '../utils/user.js';
import cloudinary from '../config/cloudinary.js';
import Submission from '../models/submission.js';
import Problem from '../models/problem.js';
import Topic from '../models/topic.js';

const userControllers = {
	//[GET] /user
	async getList(req, res, next) {
		try {
			const { size = 20, page = 1, q, permission, sortBy, order, minimal } = req.query;

			let data = await User.filterAndSort({ q, permission, sortBy, order });

			data = await Promise.all(
				data.map(async (item) => {
					const top = await getTop(item.name);
					return { ...item._doc, top };
				}),
			);

			if (minimal) {
				data = data.map((user) => user.name);
			}

			res.status(200).json({
				success: true,
				data: data.slice(size * (page - 1), size * page),
				maxPage: Math.ceil(data.length / size),
			});

			console.log('Get user list successfull');
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in get user list: ${err.message}`);
		}
	},

	//[GET] /user/info/:name
	async get(req, res, next) {
		try {
			const { name } = req.params;

			const user = await User.findOne({ name }, '-resetPasswordToken -verificationToken -isVerified -password');

			if (!user) {
				throw new Error('User not found');
			}

			const top = await getTop(user.name);

			const submissions = await Submission.filter({ author: user.name });
			const map = new Map();
			submissions.forEach((item) => {
				if (map.has(item.forProblem)) {
					if (item.status === 'AC') {
						map.set(item.forProblem, 'Accepted');
					}
				} else {
					map.set(item.forProblem, item.status === 'AC' ? 'Accepted' : 'Attempted');
				}
			});
			const problems = await Problem.find();
			const problemDifficulty = new Map();
			const problemName = new Map();
			problems.forEach((item) => {
				problemDifficulty.set(item.id, item.difficulty);
				problemName.set(item.id, item.name);
			});

			res.status(200).json({
				success: true,
				data: { ...user._doc, top },
				problems: Array.from(map, ([key, value]) => [key, value, problemDifficulty.get(key), problemName.get(key)]).reduce(
					(acc, [key, value, difficulty, name]) => ({ ...acc, [key]: { status: value, difficulty, name } }),
					{},
				),
			});

			console.log(`Get user "${name}" successfull`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in get user: ${err.message}`);
		}
	},

	//[GET] /user/edit
	async edit(req, res, next) {
		try {
			const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true });

			res.status(200).json({
				success: true,
				msg: 'Edit user successfull',
				data: user._doc,
			});

			console.log(`Edit user successfull`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in edit user: ${err.message}`);
		}
	},

	//[PATCH] /user/roadmap/progress
	async updateRoadmapProgress(req, res, next) {
		try {
			const { topicId, patch } = req.body;
			const user = await User.findById(req.userId);
			
			if (!user) {
				throw new Error('User not found');
			}

			if (!topicId || typeof topicId !== 'string') {
				throw new Error('topicId is required');
			}
			if (!patch || typeof patch !== 'object') {
				throw new Error('patch is required');
			}

			// Initialize roadmapProgress for existing users
			if (!user.roadmapProgress) {
				user.roadmapProgress = {};
			}
			if (!Array.isArray(user.roadmapProgress.unlockedTopicIds)) {
				user.roadmapProgress.unlockedTopicIds = [];
			}
			if (!Array.isArray(user.roadmapProgress.completedTopicIds)) {
				user.roadmapProgress.completedTopicIds = [];
			}
			if (!user.roadmapProgress.topicProgress) {
				user.roadmapProgress.topicProgress = new Map();
			}

			// Ensure the first topic is unlocked for the user.
			if (user.roadmapProgress.unlockedTopicIds.length === 0) {
				const first = await Topic.findOne().sort({ order: 1 }).select('topicId');
				if (first?.topicId) user.roadmapProgress.unlockedTopicIds.push(first.topicId);
			}

			const prev = user.roadmapProgress.topicProgress.get(topicId) || {
				currentStep: 0,
				videoWatched: false,
				quizzesPassed: [],
				problemSolved: false,
				completed: false,
			};
			const next = {
				...prev,
				...patch,
			};
			user.roadmapProgress.topicProgress.set(topicId, next);

			// If topic is completed, unlock the next topic by order.
			if (next.completed) {
				if (!user.roadmapProgress.completedTopicIds.includes(topicId)) {
					user.roadmapProgress.completedTopicIds.push(topicId);
				}
				const t = await Topic.findOne({ topicId }).select('order');
				if (t) {
					const nextTopic = await Topic.findOne({ order: t.order + 1 }).select('topicId');
					if (nextTopic?.topicId && !user.roadmapProgress.unlockedTopicIds.includes(nextTopic.topicId)) {
						user.roadmapProgress.unlockedTopicIds.push(nextTopic.topicId);
					}
				}
			}

			user.markModified('roadmapProgress');
			await user.save();

			res.status(200).json({
				success: true,
				msg: 'Roadmap progress updated',
				data: user.roadmapProgress,
			});
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in update roadmap progress: ${err.message}`);
		}
	},

	//[POST] /user/roadmap/verify-problem
	async verifyRoadmapProblem(req, res, next) {
		try {
			const { topicId, problemId } = req.body;
			if (!topicId || !problemId) throw new Error('topicId and problemId are required');

			const user = await User.findById(req.userId);
			if (!user) throw new Error('User not found');

			const accepted = await Submission.exists({ author: user.name, forProblem: problemId, status: 'AC' });

			if (accepted) {
				if (!user.roadmapProgress) user.roadmapProgress = {};
				if (!Array.isArray(user.roadmapProgress.unlockedTopicIds)) user.roadmapProgress.unlockedTopicIds = [];
				if (!Array.isArray(user.roadmapProgress.completedTopicIds)) user.roadmapProgress.completedTopicIds = [];
				if (!user.roadmapProgress.topicProgress) user.roadmapProgress.topicProgress = new Map();

				const prev = user.roadmapProgress.topicProgress.get(topicId) || {};
				user.roadmapProgress.topicProgress.set(topicId, {
					...prev,
					problemSolved: true,
					completed: true,
				});
				if (!user.roadmapProgress.completedTopicIds.includes(topicId)) {
					user.roadmapProgress.completedTopicIds.push(topicId);
				}

				const t = await Topic.findOne({ topicId }).select('order');
				if (t) {
					const nextTopic = await Topic.findOne({ order: t.order + 1 }).select('topicId');
					if (nextTopic?.topicId && !user.roadmapProgress.unlockedTopicIds.includes(nextTopic.topicId)) {
						user.roadmapProgress.unlockedTopicIds.push(nextTopic.topicId);
					}
				}

				user.markModified('roadmapProgress');
				await user.save();
			}

			res.status(200).json({
				success: true,
				data: {
					accepted: Boolean(accepted),
					roadmapProgress: user.roadmapProgress,
				},
			});
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in verify roadmap problem: ${err.message}`);
		}
	},

	//[POST] /user/change-avatar
	async changeAvatar(req, res, next) {
		try {
			const url = req.file?.path || req.body.url;
			if (!url) {
				throw new Error('No file uploaded');
			}

			const user = await User.findByIdAndUpdate(req.userId, { avatar: url }, { new: true });

			res.status(200).json({
				success: true,
				msg: 'Change avatar successfull',
				data: user.avatar,
			});

			console.log(`Change user avatar successfull`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in change user avatar: ${err.message}`);
		}
	},

	//[DELETE] /user/delete/:name
	async deleteUser(req, res, next) {
		try {
			const { name } = req.params;

			await User.findOneAndDelete({ name });

			res.status(200).json({ success: true, msg: 'User deleted successfully' });

			console.log(`User ${name} deleted successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in delete user: ${err.message}`);
		}
	},
};

export default userControllers;
