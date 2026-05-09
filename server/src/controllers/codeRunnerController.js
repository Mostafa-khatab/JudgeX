import axios from 'axios';
import { runCodeLocally } from '../utils/localCodeRunner.js';

// JDoodle language mapping
const JDOODLE_LANGUAGES = {
	'python3': { language: 'python3', versionIndex: '5' },
	'python2': { language: 'python2', versionIndex: '0' },
	'python': { language: 'python3', versionIndex: '5' },
	'c': { language: 'c', versionIndex: '5' },
	'c11': { language: 'c', versionIndex: '5' },
	'cpp': { language: 'cpp17', versionIndex: '1' },
	'c++': { language: 'cpp17', versionIndex: '1' },
	'c++11': { language: 'cpp14', versionIndex: '4' },
	'c++14': { language: 'cpp14', versionIndex: '4' },
	'c++17': { language: 'cpp17', versionIndex: '1' },
	'c++20': { language: 'cpp17', versionIndex: '1' },
	'java': { language: 'java', versionIndex: '4' },
	'javascript': { language: 'nodejs', versionIndex: '4' },
	'node': { language: 'nodejs', versionIndex: '4' },
};

export const runCode = async (req, res) => {
	try {
		const { code, language, input } = req.body;

		console.log('Code Runner Request (Local):', { language, codeLength: code?.length, hasInput: !!input });

		if (!code || !code.trim()) {
			return res.status(400).json({ msg: 'Code is required' });
		}

		const result = await runCodeLocally(code, language, input);

		if (result.error) {
			console.error('Local Execution Error:', result.error);

			let errorMsg = result.error;
			if (errorMsg.includes('Time Limit Exceeded')) {
				return res.status(200).json({
					success: true,
					output: '',
					error: 'Time Limit Exceeded',
					executionTime: result.executionTime
				});
			}

			if (errorMsg.includes('Compilation Error')) {
				return res.status(200).json({
					success: true,
					output: errorMsg,
					error: 'Compilation Error',
					executionTime: result.executionTime
				});
			}

			return res.status(200).json({
				success: true,
				output: errorMsg,
				error: 'Execution Error',
				executionTime: result.executionTime
			});
		}

		return res.status(200).json({
			success: true,
			output: result.output || '',
			error: null,
			executionTime: result.executionTime,
		});
	} catch (err) {
		console.error('Code runner error:', err);
		return res.status(500).json({ success: false, msg: 'Server error during execution' });
	}
};
