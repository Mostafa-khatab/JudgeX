import { calculateUserSkillGap } from '../services/skillGapService.js';

const skillGapController = {
	/**
	 * GET /user/skill-gap/:name
	 * Generates a skill gap analysis for a user by analyzing their performance across problem tags.
	 */
	async getSkillGap(req, res) {
		try {
			const { name } = req.params;
			const data = await calculateUserSkillGap(name);

			res.json({
				success: true,
				data: data,
			});

			console.log(`Skill gap analysis generated for user via service: ${name}`);
		} catch (err) {
			console.error('Skill gap error:', err);
			res.status(500).json({ success: false, msg: 'Failed to generate skill gap analysis' });
		}
	},
};

export default skillGapController;
