import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
			unique: true,
		},
		fullname: {
			type: String,
			default: null,
		},
		bio: {
			type: String,
			default: '',
			maxlength: 500,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		permission: {
			type: String,
			enum: ['Member', 'Admin', 'Instructor'],
			default: 'Member',
		},
		joiningContest: {
			type: String,
			default: null,
		},
		joinedContest: [String],
		totalScore: {
			type: Number,
			default: 0,
		},
		totalAC: {
			type: Number,
			default: 0,
		},
		totalAttempt: {
			type: Number,
			default: 0,
		},
		defaultLanguage: {
			type: String,
			default: 'c++17',
		},
		streak: {
			type: Number,
			default: 0,
		},
		longestStreak: {
			type: Number,
			default: 0,
		},
		lastChallengeDate: {
			type: Date,
			default: null,
		},
		avatar: String,
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
	},
	{
		timestamps: true,
		statics: {
			filterAndSort: function ({ q = '', permission, sortBy, order }) {
				const regex = new RegExp(q, 'i');

				let data = this.find({
					$or: [{ name: { $regex: regex } }, { fullname: { $regex: regex } }],
				})
					.select('-resetPasswordToken -verificationToken -isVerified -password -email')
					.sort({ [sortBy]: typeof order === 'string' ? Number(order) : order || 1 });
				if (permission) {
					data = data.where('permission').equals(permission);
				}
				return data;
			},
		},
	},
);

// FIX: Add database indexes for performance
userSchema.index({ email: 1 }); // For email lookups
userSchema.index({ name: 1 }); // For username lookups
userSchema.index({ permission: 1, totalScore: -1 }); // For rankings
userSchema.index({ createdAt: -1 }); // For timeline queries
userSchema.index({ isVerified: 1 }); // For verification queries

const User = mongoose.model('User', userSchema);
export default User;
