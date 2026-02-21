import DailyChallenge from '../models/dailyChallenge.js';
import User from '../models/user.js';
import Problem from '../models/problem.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Get today's start (midnight) as a Date object
 */
const getTodayStart = () => {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	return now;
};

const dailyChallengeController = {
	/**
	 * GET /daily-challenge
	 * Get today's challenge for the logged-in user.
	 * If no challenge exists yet, request one from the AI service.
	 */
	async getChallenge(req, res) {
		try {
			const user = await User.findById(req.userId);
			if (!user) {
				return res.status(404).json({ success: false, msg: 'User not found' });
			}

			const today = getTodayStart();

			// Check if challenge already exists for today
			let challenge = await DailyChallenge.findOne({
				userId: req.userId,
				date: today,
			});

			if (challenge) {
				return res.json({ success: true, data: challenge });
			}

			// Request recommendation from AI service
			let recommendation;
			try {
				const aiRes = await axios.post(`${AI_SERVICE_URL}/recommend`, {
					username: user.name,
				});
				recommendation = aiRes.data;
			} catch (aiErr) {
				// Fallback: pick a random unsolved problem
				console.warn('AI service unavailable, using fallback:', aiErr.message);
				recommendation = null;
			}

			let problemId, problemName, difficulty, tags, predictedScore;

			if (recommendation) {
				problemId = recommendation.problem_id;
				problemName = recommendation.problem_name;
				difficulty = recommendation.difficulty;
				tags = recommendation.tags || [];
				predictedScore = recommendation.predicted_score;
			} else {
				// Smart fallback: pick unsolved problem closest to 60-75% ac_rate sweet spot
				const SWEET_SPOT = 0.675;

				// Get problems the user has already solved
				const Submission = (await import('../models/submission.js')).default;
				const solvedProblems = await Submission.distinct('forProblem', { author: user.name, status: 'AC' });

				// Unsolved public problems with submission history (ac_rate is meaningful)
				const candidates = await Problem.find({
					public: true,
					id: { $nin: solvedProblems },
					noOfSubm: { $gt: 0 },
				}).select('id name difficulty tags noOfSubm noOfSuccess');

				let problem;

				if (candidates.length > 0) {
					// Pick closest to sweet spot
					problem = candidates.reduce((best, p) => {
						const acRate = p.noOfSubm > 0 ? p.noOfSuccess / p.noOfSubm : 0.5;
						const bestRate = best.noOfSubm > 0 ? best.noOfSuccess / best.noOfSubm : 0.5;
						return Math.abs(acRate - SWEET_SPOT) < Math.abs(bestRate - SWEET_SPOT) ? p : best;
					});
				} else {
					// Fallback: any unsolved public problem
					const anyUnsolved = await Problem.find({
						public: true,
						id: { $nin: solvedProblems },
					}).select('id name difficulty tags noOfSubm noOfSuccess').limit(20);

					if (anyUnsolved.length > 0) {
						problem = anyUnsolved[Math.floor(Math.random() * anyUnsolved.length)];
					} else {
						// Last resort: any public problem
						const count = await Problem.countDocuments({ public: true });
						problem = await Problem.findOne({ public: true }).skip(Math.floor(Math.random() * count)).select('id name difficulty tags noOfSubm noOfSuccess');
					}
				}

				if (!problem) {
					return res.status(404).json({ success: false, msg: 'No problems available' });
				}

				problemId = problem.id;
				problemName = problem.name;
				difficulty = problem.difficulty;
				tags = problem.tags || [];
				predictedScore = problem.noOfSubm > 0
					? Math.round((problem.noOfSuccess / problem.noOfSubm) * 100) / 100
					: 0.5;
			}


			// Save challenge
			challenge = new DailyChallenge({
				userId: req.userId,
				username: user.name,
				problemId,
				problemName,
				difficulty,
				tags,
				predictedScore,
				date: today,
			});

			await challenge.save();

			return res.json({ success: true, data: challenge });
		} catch (err) {
			console.error('Get daily challenge error:', err);
			return res.status(500).json({ success: false, msg: 'Failed to get daily challenge' });
		}
	},

	/**
	 * POST /daily-challenge/complete
	 * Mark today's challenge as completed and update streak.
	 */
	async completeChallenge(req, res) {
		try {
			const today = getTodayStart();

			const challenge = await DailyChallenge.findOne({
				userId: req.userId,
				date: today,
			});

			if (!challenge) {
				return res.status(404).json({ success: false, msg: 'No challenge found for today' });
			}

			if (challenge.completed) {
				return res.json({ success: true, data: challenge, msg: 'Already completed' });
			}

			challenge.completed = true;
			challenge.completedAt = new Date();
			await challenge.save();

			// Update user streak
			const user = await User.findById(req.userId);
			if (user) {
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);

				const lastDate = user.lastChallengeDate
					? new Date(user.lastChallengeDate).setHours(0, 0, 0, 0)
					: null;

				if (lastDate && lastDate === yesterday.getTime()) {
					// Consecutive day
					user.streak = (user.streak || 0) + 1;
				} else if (!lastDate || lastDate < yesterday.getTime()) {
					// Streak broken, start new
					user.streak = 1;
				}
				// else: same day, no change

				if ((user.streak || 0) > (user.longestStreak || 0)) {
					user.longestStreak = user.streak;
				}

				user.lastChallengeDate = today;
				await user.save();
			}

			return res.json({ success: true, data: challenge });
		} catch (err) {
			console.error('Complete challenge error:', err);
			return res.status(500).json({ success: false, msg: 'Failed to complete challenge' });
		}
	},

	/**
	 * GET /daily-challenge/streak
	 * Get the user's current streak info.
	 */
	async getStreak(req, res) {
		try {
			const user = await User.findById(req.userId).select('streak longestStreak lastChallengeDate');
			if (!user) {
				return res.status(404).json({ success: false, msg: 'User not found' });
			}

			// Check if streak is still valid
			const today = getTodayStart();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);

			let currentStreak = user.streak || 0;

			if (user.lastChallengeDate) {
				const lastDate = new Date(user.lastChallengeDate);
				lastDate.setHours(0, 0, 0, 0);

				if (lastDate.getTime() < yesterday.getTime()) {
					// Streak is broken
					currentStreak = 0;
				}
			} else {
				currentStreak = 0;
			}

			return res.json({
				success: true,
				data: {
					currentStreak,
					longestStreak: user.longestStreak || 0,
					lastChallengeDate: user.lastChallengeDate,
				},
			});
		} catch (err) {
			console.error('Get streak error:', err);
			return res.status(500).json({ success: false, msg: 'Failed to get streak' });
		}
	},

	/**
	 * GET /daily-challenge/history
	 * Get the user's past daily challenges.
	 */
	async getHistory(req, res) {
		try {
			const { page = 1, limit = 10 } = req.query;

			const challenges = await DailyChallenge.find({ userId: req.userId })
				.sort({ date: -1 })
				.skip((page - 1) * limit)
				.limit(Number(limit));

			const total = await DailyChallenge.countDocuments({ userId: req.userId });

			return res.json({
				success: true,
				data: challenges,
				total,
				maxPage: Math.ceil(total / limit),
			});
		} catch (err) {
			console.error('Get history error:', err);
			return res.status(500).json({ success: false, msg: 'Failed to get history' });
		}
	},

	/**
	 * POST /daily-challenge/train
	 * Trigger model retraining (admin only).
	 */
	async trainModel(req, res) {
		try {
			const aiRes = await axios.post(`${AI_SERVICE_URL}/train`);
			return res.json({ success: true, data: aiRes.data });
		} catch (err) {
			console.error('Train model error:', err.message);
			return res.status(500).json({ success: false, msg: 'Failed to train model' });
		}
	},
};

export default dailyChallengeController;
