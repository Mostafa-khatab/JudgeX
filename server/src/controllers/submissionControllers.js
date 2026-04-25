import axios from 'axios';

import User from '../models/user.js';
import Submission from '../models/submission.js';
import Problem from '../models/problem.js';
import Contest from '../models/contest.js';
import DailyChallenge from '../models/dailyChallenge.js';

const submissionControllers = {
	//[GET] /submission
	async getList(req, res, next) {
		try {
			const { size = 20, page = 1, status, author, language, problem, contest: contestId, minimal } = req.query;
			let data = await Submission.filter({ status, author, language, problem, contest: contestId });
			data = data.map((d) => d.toObject());

			const user = await User.findById(req.userId);

			if (user) {
				data = data.map((item) => {
					if (item.author === user.name || user.permission == 'Admin') {
						item.view = true;
					}
					return item;
				});
			}

			const statusStat = [0, 0, 0, 0, 0, 0, 0];
			const languageStat = [0, 0, 0, 0, 0, 0, 0, 0];

			const getStatusIndex = (status) => {
				//enum: ['AC', 'WA', 'TLE', 'MLE', 'RTE', 'CE', 'IE'],
				switch (status) {
					case 'AC':
						return 0;
					case 'WA':
						return 1;
					case 'TLE':
						return 2;
					case 'MLE':
						return 3;
					case 'RTE':
						return 4;
					case 'CE':
						return 5;
					case 'IE':
						return 6;
				}
			};
			const getLanguageIndex = (language) => {
				//enum: ['c', 'c11', 'c++11', 'c++14', 'c++17', 'c++20', 'python2', 'python3'],
				switch (language) {
					case 'c':
						return 0;
					case 'c11':
						return 1;
					case 'c++11':
						return 2;
					case 'c++14':
						return 3;
					case 'c++17':
						return 4;
					case 'c++20':
						return 5;
					case 'python2':
						return 6;
					case 'python3':
						return 7;
				}
			};

			data.forEach((submission) => {
				statusStat[getStatusIndex(submission.status)]++;
				languageStat[getLanguageIndex(submission.language)]++;
			});

			if (minimal) {
				data = data.map((item) => {
					return item._id;
				});
			}

			res.status(200).json({
				success: true,
				data: data.slice(size * (page - 1), size * page),
				stat: {
					status: statusStat,
					language: languageStat,
				},
				maxPage: Math.ceil(data.length / size),
			});

			console.log('Get submission list successfull');
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in get submission list: ${err.message}`);
		}
	},

	//[GET] /submission/info/:id
	async get(req, res, next) {
		try {
			const { id } = req.params;

			const user = await User.findById(req.userId);

			const submission = await Submission.findById(id).lean();

			if (!submission) {
				throw new Error('Submission not found');
			}

			if (user.permission != 'Admin' && user.name != submission.author) {
				return res.status(401).json({ success: false, message: 'Unauthorized - not allowed access' });
			}

			res.status(200).json({
				success: true,
				data: submission,
			});

			console.log(`Get submission "${id}" successfull`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error in get _id submission: ${err.message}`);
		}
	},

	//[POST] /submission/submit
	async submit(req, res, next) {
		try {
			const { src, problem: id, language, contest: contestId } = req.body;

			const problem = await Problem.findOne({ id });

			if (!problem) {
				throw new Error('Problem not found');
			}

			const user = await User.findById(req.userId);

			let contest = null;

			if (contestId) {
				contest = await Contest.findOne({ id: contestId });
				if (!contest) {
					throw new Error('Contest not found');
				}
				if (!contest.problems.includes(problem.id)) {
					throw new Error('This contest does not have this problem');
				}
				if (user.joiningContest != contest.id) {
					throw new Error('You are not participating in this contest');
				}
			}

			// Create submission with JUDGING status
			const submission = new Submission({
				author: user.name,
				src,
				forProblem: id,
				forContest: contestId,
				language,
				status: 'JUDGING',
				startedAt: new Date(),
			});

			await submission.save();

			// Respond immediately so the client can poll for results
			res.status(201).json({
				success: true,
				data: {
					_id: submission._id,
					status: submission.status,
				},
				message: 'Submission is being judged',
			});

			// Send directly to Piston API for judging (No local judger needed)
			try {
				const pistonLanguages = {
					'python3': 'python',
					'python2': 'python',
					'c': 'c',
					'c11': 'c',
					'c++11': 'cpp',
					'c++14': 'cpp',
					'c++17': 'cpp',
					'c++20': 'cpp',
					'java': 'java',
					'javascript': 'node',
					'node': 'node'
				};

				const lang = pistonLanguages[language] || language;
				const testcases = problem.testcase || [];
				
				// Run all testcases in parallel to speed up judging
				const judgingPromises = testcases.map(async (tc, index) => {
					try {
						const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
							language: lang,
							version: '*',
							files: [{ content: src }],
							stdin: tc.input || ''
						}, { timeout: 10000 });

						const run = response.data.run;
						const actualOutput = (run.stdout || '').trim();
						const expectedOutput = (tc.output || '').trim();

						let status = 'AC';
						if (run.stderr || run.code !== 0) {
							status = 'RTE';
						} else if (actualOutput !== expectedOutput) {
							status = 'WA';
						}

						return {
							id: index + 1,
							status,
							time: run.time || 0,
							memory: 0, // Piston doesn't easily provide memory usage
							input: tc.input,
							expectedOutput: tc.output,
							actualOutput: actualOutput
						};
					} catch (err) {
						return {
							id: index + 1,
							status: 'IE',
							msg: err.message
						};
					}
				});

				const testcaseResults = await Promise.all(judgingPromises);

				// Determine overall status
				let finalStatus = 'AC';
				const priority = ['IE', 'RTE', 'MLE', 'TLE', 'WA', 'AC'];
				
				// Get the "worst" status among all testcases
				testcaseResults.forEach(res => {
					if (priority.indexOf(res.status) < priority.indexOf(finalStatus)) {
						finalStatus = res.status;
					}
				});

				const totalTime = testcaseResults.reduce((acc, curr) => Math.max(acc, curr.time), 0);
				const point = finalStatus === 'AC' ? (problem.point || 100) : 0;

				// Update submission with results
				await submission.updateOne({
					status: finalStatus,
					time: totalTime,
					memory: 0,
					msg: finalStatus !== 'AC' ? 'Judging completed' : null,
					testcase: testcaseResults,
					point,
					completedAt: new Date(),
				});

				// Update problem stats
				problem.noOfSubm = (problem.noOfSubm || 0) + 1;
				if (finalStatus === 'AC') {
					problem.noOfSuccess = (problem.noOfSuccess || 0) + 1;
				}
				await problem.save();

				// Update user stats
				user.totalAttempt = (user.totalAttempt || 0) + 1;
				if (finalStatus === 'AC') {
					const prevAC = await Submission.findOne({ author: user.name, forProblem: id, status: 'AC', _id: { $ne: submission._id } });
					if (!prevAC) {
						user.totalAC = (user.totalAC || 0) + 1;
						user.totalScore = (user.totalScore || 0) + point;
					}
				}
				await user.save();

				// Update contest standing if applicable
				if (contest) {
					const userStanding = contest.standing.find((s) => s.user === user.name);
					if (userStanding) {
						const idx = contest.problems.indexOf(problem.id);
						if (idx !== -1 && finalStatus === 'AC') {
							userStanding.score[idx] = point;
							userStanding.status[idx] = 'AC';
						}
					}
					await contest.save();
				}

				console.log(`✅ Submission ${submission._id} judged remotely: ${finalStatus} (${point} pts)`);

				// Auto-complete daily challenge if this problem matches today's challenge
				if (finalStatus === 'AC') {
					try {
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const dailyChallenge = await DailyChallenge.findOne({
							userId: user._id,
							problemId: problem.id,
							date: today,
							completed: false,
						});
						if (dailyChallenge) {
							dailyChallenge.completed = true;
							dailyChallenge.completedAt = new Date();
							await dailyChallenge.save();

							// Update streak
							const yesterday = new Date(today);
							yesterday.setDate(yesterday.getDate() - 1);
							const lastDate = user.lastChallengeDate
								? new Date(user.lastChallengeDate).setHours(0, 0, 0, 0)
								: null;
							if (lastDate && lastDate === yesterday.getTime()) {
								user.streak = (user.streak || 0) + 1;
							} else if (!lastDate || lastDate < yesterday.getTime()) {
								user.streak = 1;
							}
							if ((user.streak || 0) > (user.longestStreak || 0)) {
								user.longestStreak = user.streak;
							}
							user.lastChallengeDate = today;
							await user.save();
							console.log(`🎯 Daily challenge auto-completed for user ${user.name}`);
						}
					} catch (dailyErr) {
						console.warn('Could not auto-complete daily challenge:', dailyErr.message);
					}
				}
			} catch (judgeError) {
				console.error('Remote Judger error:', judgeError.message);
				await submission.updateOne({ status: 'IE', msg: { server: 'Remote Judger unavailable: ' + judgeError.message }, completedAt: new Date() });
			}

			console.log('Submit code successful');
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in submit: ${err.message}`);
		}
	},


	//[DELETE] /submission/delete/:id
	async deleteSubm(req, res, next) {
		try {
			const { id } = req.params;

			const submission = await Submission.findById(id);
			if (!submission) throw new Error('Submission not found');

			const problem = await Problem.findOne({ id: submission.forProblem });
			if (problem) {
				problem.noOfSubm = Math.max(0, problem.noOfSubm - 1);

				if (submission.status === 'AC') {
					const otherAC = await Submission.filter({ status: 'AC', author: submission.author, problem: submission.forProblem, _id: { $ne: id } });
					if (otherAC.length === 0) {
						problem.noOfSuccess = Math.max(0, problem.noOfSuccess - 1);
					}
				}
				await problem.save();
			}

			await Submission.deleteOne({ _id: id });

			const userOfSubm = await User.findOne({ name: submission.author });
			if (userOfSubm) {
				// Kiểm tra các submission còn lại của user cho problem này
				const lastSubmissions = await Submission.filter({ author: userOfSubm.name, problem: submission.forProblem });
				// Tính điểm tốt nhất hiện tại
				const bestLastSubmit = lastSubmissions.reduce((acc, val) => Math.max(acc, val.point), 0);

				// Giảm điểm cũ
				userOfSubm.totalScore -= submission.point;
				// Cộng điểm tốt nhất còn lại (hoặc 0 nếu không còn)
				userOfSubm.totalScore += bestLastSubmit;

				// Nếu không còn submission nào nữa, giảm totalAttempt
				if (lastSubmissions.length === 0) {
					userOfSubm.totalAttempt = Math.max(0, userOfSubm.totalAttempt - 1);
				}

				// Nếu submission AC và user không còn AC nào cho problem này thì giảm totalAC
				if (submission.status === 'AC') {
					const otherAC = lastSubmissions.filter((s) => s.status === 'AC');
					if (otherAC.length === 0) {
						userOfSubm.totalAC = Math.max(0, userOfSubm.totalAC - 1);
					}
				}

				await userOfSubm.save();
			}

			if (submission.forContest) {
				const contest = await Contest.findOne({ id: submission.forContest });
				if (contest) {
					contest.standing = contest.standing.map((usr) => {
						if (usr.user === submission.author) {
							const idx = contest.problems.indexOf(submission.forProblem);
							if (idx !== -1) {
								if (usr.score[idx] === submission.point) {
									usr.score[idx] = 0;
									usr.time[idx] = 0;
									usr.status[idx] = '';
								}
							}
						}
						return usr;
					});
					await contest.save();
				}
			}

			res.status(200).json({ success: true, msg: 'Submission deleted successfully' });
			console.log(`Deleted submission "${id}" successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });

			console.error(`Error delete submission: ${err.message}`);
		}
	},
};

export default submissionControllers;
