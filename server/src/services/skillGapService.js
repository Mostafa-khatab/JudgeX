import Submission from '../models/submission.js';
import Problem from '../models/problem.js';

/**
 * Calculates a detailed skill gap analysis for a given username.
 * @param {string} username 
 * @returns {Promise<Object>} The skill gap data including tags and summary.
 */
export const calculateUserSkillGap = async (username) => {
    // 1. Fetch all non-pending submissions for the user
    const submissions = await Submission.find({
        author: username,
        status: { $nin: ['PENDING', 'JUDGING'] },
    }).select('forProblem status');

    if (submissions.length === 0) {
        return {
            tags: [],
            summary: {
                strongTopics: [],
                weakTopics: [],
                learningTopics: [],
                topTopic: 'Learning...',
                totalSubmissions: 0,
                uniqueProblemsAttempted: 0,
            },
            message: 'No submission history found for this user.',
        };
    }

    // 2. Fetch all unique problems involved to get their tags
    const problemIds = [...new Set(submissions.map((s) => s.forProblem))];
    const problems = await Problem.find({ id: { $in: problemIds } }).select('id tags name');

    // Map problemId to tags
    const problemMap = {};
    problems.forEach((p) => {
        problemMap[p.id] = p.tags || [];
    });

    // 3. Aggregate stats by tag
    const tagStats = {};
    submissions.forEach((sub) => {
        const tags = (problemMap[sub.forProblem] || []).filter(tag => tag && isNaN(tag));
        tags.forEach((tag) => {
            if (!tagStats[tag]) {
                tagStats[tag] = {
                    totalSubmissions: 0,
                    acSubmissions: 0,
                    problemsAttempted: new Set(),
                    problemsSolved: new Set(),
                };
            }
            tagStats[tag].totalSubmissions += 1;
            tagStats[tag].problemsAttempted.add(sub.forProblem);
            if (sub.status === 'AC') {
                tagStats[tag].acSubmissions += 1;
                tagStats[tag].problemsSolved.add(sub.forProblem);
            }
        });
    });

    // 4. Calculate metrics and transform to array
    const result = Object.entries(tagStats).map(([tag, stats]) => {
        const attempted = stats.problemsAttempted.size;
        const solved = stats.problemsSolved.size;
        const strength = attempted > 0 ? (solved / attempted) * 100 : 0;

        return {
            tag,
            totalSubmissions: stats.totalSubmissions,
            acSubmissions: stats.acSubmissions,
            problemsAttempted: attempted,
            problemsSolved: solved,
            strength: Math.round(strength),
        };
    });

    // Sort by strength descending, then by total submissions
    result.sort((a, b) => b.strength - a.strength || b.totalSubmissions - a.totalSubmissions);

    // 5. Categorize
    const strongTopics = result.filter((r) => r.strength >= 70 && r.problemsAttempted >= 1);
    const weakTopics = result.filter((r) => r.strength < 50 && r.problemsAttempted >= 1);
    const learningTopics = result.filter((r) => r.strength >= 50 && r.strength < 70);

    return {
        tags: result,
        summary: {
            strongTopics: strongTopics.map((t) => t.tag),
            weakTopics: weakTopics.map((t) => t.tag),
            learningTopics: learningTopics.map((t) => t.tag),
            topTopic: result[0]?.strength > 0 ? result[0].tag : 'Learning...',
            totalSubmissions: submissions.length,
            uniqueProblemsAttempted: problemIds.length,
        },
    };
};
