import Course from '../models/course.js';

const courseControllers = {
	//[GET] /course
	async getList(req, res, next) {
		try {
			const { size = 20, page = 1, q, tags, difficulty, isPublished, sortBy, order } = req.query;

			// Ensure page is at least 1
			const pageNum = Math.max(1, parseInt(page) || 1);
			const pageSize = Math.max(1, parseInt(size) || 20);

			// Build Mongo query (must not pass view params like sort/order to countDocuments)
			const regex = new RegExp(q || '', 'i');
			const query = {
				$or: [{ title: { $regex: regex } }, { description: { $regex: regex } }, { instructor: { $regex: regex } }],
			};
			if (tags) {
				const tagArr = tags.split(',').filter(Boolean);
				if (tagArr.length) query.tags = { $in: tagArr };
			}
			if (difficulty) query.difficulty = difficulty;
			if (typeof isPublished !== 'undefined' && isPublished !== '') {
				query.isPublished = isPublished === 'true' ? true : isPublished === 'false' ? false : undefined;
				if (query.isPublished === undefined) delete query.isPublished;
			}

			const sortField = sortBy || 'createdAt';
			const sortOrder = order === 'asc' ? 1 : -1;

			let courses;
			if (sortField === 'enrolledUsers') {
				courses = await Course.aggregate([
					{ $match: query },
					{ $addFields: { enrolledUsersCount: { $size: { $ifNull: ['$enrolledUsers', []] } } } },
					{ $sort: { enrolledUsersCount: sortOrder } },
					{ $skip: (pageNum - 1) * pageSize },
					{ $limit: pageSize },
				]);
			} else {
				courses = await Course.find(query)
					.sort({ [sortField]: sortOrder })
					.skip((pageNum - 1) * pageSize)
					.limit(pageSize);
			}

			const total = await Course.countDocuments(query);

			res.status(200).json({
				success: true,
				data: courses,
				maxPage: Math.ceil(total / pageSize),
				totalCourses: total,
			});

			console.log('Get course list successful');
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in get course list: ${err.message}`);
		}
	},

	//[GET] /course/:id
	async get(req, res, next) {
		try {
			const { id } = req.params;

			const course = await Course.findById(id);
			if (!course) {
				throw new Error('Course not found');
			}

			res.status(200).json({
				success: true,
				data: course,
			});

			console.log(`Get course "${id}" successful`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in get course: ${err.message}`);
		}
	},

	//[POST] /course
	async create(req, res, next) {
		try {
			const {
				title,
				description,
				instructor,
				thumbnail,
				videos,
				links,
				tags,
				difficulty,
				duration,
				isPublished,
			} = req.body;

			const course = await Course.create({
				title,
				description,
				instructor,
				thumbnail,
				videos: videos || [],
				links: links || [],
				tags: tags || [],
				difficulty,
				duration,
				isPublished: isPublished || false,
			});

			res.status(201).json({
				success: true,
				msg: 'Course created successfully',
				data: course,
			});

			console.log('Course created successfully');
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in create course: ${err.message}`);
		}
	},

	//[PUT] /course/:id
	async update(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body || {};

			// Only set fields that are provided (avoid wiping fields when user doesn't edit them)
			const allowed = ['title', 'description', 'instructor', 'thumbnail', 'videos', 'links', 'tags', 'difficulty', 'duration', 'isPublished'];
			const setData = {};
			allowed.forEach((key) => {
				if (Object.prototype.hasOwnProperty.call(updateData, key) && updateData[key] !== undefined) {
					setData[key] = updateData[key];
				}
			});

			const course = await Course.findByIdAndUpdate(id, { $set: setData }, {
				new: true,
				runValidators: true,
			});

			if (!course) {
				throw new Error('Course not found');
			}

			res.status(200).json({
				success: true,
				msg: 'Course updated successfully',
				data: course,
			});

			console.log(`Course "${id}" updated successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in update course: ${err.message}`);
		}
	},

	//[DELETE] /course/:id
	async delete(req, res, next) {
		try {
			const { id } = req.params;

			const course = await Course.findByIdAndDelete(id);
			if (!course) {
				throw new Error('Course not found');
			}

			res.status(200).json({
				success: true,
				msg: 'Course deleted successfully',
			});

			console.log(`Course "${id}" deleted successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in delete course: ${err.message}`);
		}
	},

	//[POST] /course/:id/enroll
	async enroll(req, res, next) {
		try {
			const { id } = req.params;
			const { userId } = req.body;

			const course = await Course.findById(id);
			if (!course) {
				throw new Error('Course not found');
			}

			if (course.enrolledUsers.includes(userId)) {
				throw new Error('User already enrolled in this course');
			}

			course.enrolledUsers.push(userId);
			await course.save();

			res.status(200).json({
				success: true,
				msg: 'Successfully enrolled in course',
				data: course,
			});

			console.log(`User enrolled in course "${id}" successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in enroll course: ${err.message}`);
		}
	},

	//[POST] /course/:id/rate
	async rate(req, res, next) {
		try {
			const { id } = req.params;
			const { rating } = req.body;

			if (rating < 1 || rating > 5) {
				throw new Error('Rating must be between 1 and 5');
			}

			const course = await Course.findById(id);
			if (!course) {
				throw new Error('Course not found');
			}

			// Identify user (from auth or body)
			const rater = req.userId || req.body.userId;
			if (!rater) throw new Error('Unauthorized - no rater specified');

			// Upsert rating
			const existing = (course.ratings || []).find((r) => r.user === rater);
			if (existing) {
				existing.value = rating;
			} else {
				course.ratings = course.ratings || [];
				course.ratings.push({ user: rater, value: rating });
			}

			// Recompute aggregate
			const sum = (course.ratings || []).reduce((acc, r) => acc + r.value, 0);
			course.ratingCount = (course.ratings || []).length;
			course.rating = Math.round(((sum / (course.ratingCount || 1)) || 0) * 10) / 10;

			await course.save();

			res.status(200).json({
				success: true,
				msg: 'Course rated successfully',
				data: course,
			});

			console.log(`Course "${id}" rated successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in rate course: ${err.message}`);
		}
	},

	//[POST] /course/:id/video
	async uploadVideo(req, res, next) {
		try {
			const { id } = req.params;
			const videoUrl = req.file?.path;

			if (!videoUrl) {
				throw new Error('No video file uploaded');
			}

			const course = await Course.findById(id);
			if (!course) {
				throw new Error('Course not found');
			}

			// Add the uploaded video to the course
			course.videos.push({
				title: req.body.title || 'Uploaded Video',
				url: videoUrl,
				duration: req.body.duration || '',
				description: req.body.description || '',
				order: course.videos.length,
			});

			await course.save();

			res.status(200).json({
				success: true,
				msg: 'Video uploaded successfully',
				data: course,
			});

			console.log(`Video uploaded for course "${id}" successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in upload video: ${err.message}`);
		}
	},

	//[POST] /course/:id/thumbnail
	async uploadThumbnail(req, res, next) {
		try {
			const { id } = req.params;
			const thumbnailUrl = req.file?.path;

			if (!thumbnailUrl) {
				throw new Error('No thumbnail file uploaded');
			}

			const course = await Course.findByIdAndUpdate(
				id,
				{ thumbnail: thumbnailUrl },
				{ new: true }
			);

			if (!course) {
				throw new Error('Course not found');
			}

			res.status(200).json({
				success: true,
				msg: 'Thumbnail uploaded successfully',
				data: course,
			});

			console.log(`Thumbnail uploaded for course "${id}" successfully`);
		} catch (err) {
			res.status(400).json({ success: false, msg: err.message });
			console.error(`Error in upload thumbnail: ${err.message}`);
		}
	},
};

export default courseControllers;
