import axios from 'axios';

// JDoodle language mapping
const JDOODLE_LANGUAGES = {
	'python3': { language: 'python3', versionIndex: '5' },
	'python2': { language: 'python2', versionIndex: '0' },
	'c': { language: 'c', versionIndex: '5' },
	'c11': { language: 'c', versionIndex: '5' },
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

		console.log('Code Runner Request:', { language, codeLength: code?.length, hasInput: !!input });

		if (!code || !code.trim()) {
			return res.status(400).json({ msg: 'Code is required' });
		}

		const langConfig = JDOODLE_LANGUAGES[language];
		if (!langConfig) {
			return res.status(400).json({ msg: `Unsupported language: ${language}` });
		}

		// Gather all available JDoodle keys from environment variables
		const jdoodleKeys = [];
		let i = 1;
		while (process.env[`JDOODLE_CLIENT_ID_${i}`] && process.env[`JDOODLE_CLIENT_SECRET_${i}`]) {
			jdoodleKeys.push({
				clientId: process.env[`JDOODLE_CLIENT_ID_${i}`],
				clientSecret: process.env[`JDOODLE_CLIENT_SECRET_${i}`]
			});
			i++;
		}
		
		// Fallback to original variables if array-style not used yet
		if (jdoodleKeys.length === 0 && process.env.JDOODLE_CLIENT_ID && process.env.JDOODLE_CLIENT_SECRET) {
			jdoodleKeys.push({
				clientId: process.env.JDOODLE_CLIENT_ID,
				clientSecret: process.env.JDOODLE_CLIENT_SECRET
			});
		}

		if (jdoodleKeys.length === 0) {
			return res.status(500).json({ success: false, msg: 'JDoodle API not configured' });
		}

		// Select a random key to balance the load and save tokens
		const randomKey = jdoodleKeys[Math.floor(Math.random() * jdoodleKeys.length)];

		try {
			const startTime = Date.now();
			const response = await axios.post('https://api.jdoodle.com/v1/execute', {
				clientId: randomKey.clientId,
				clientSecret: randomKey.clientSecret,
				script: code,
				language: langConfig.language,
				versionIndex: langConfig.versionIndex,
				stdin: input || ''
			}, { timeout: 15000 });

			const elapsed = Date.now() - startTime;
			const data = response.data;

			return res.status(200).json({
				success: true,
				output: data.output || '',
				error: data.statusCode === 200 ? null : (data.output || 'Execution error'),
				executionTime: elapsed,
			});

		} catch (apiErr) {
			console.error('JDoodle API Error:', apiErr.message);

			if (apiErr.message && apiErr.message.toLowerCase().includes('timeout')) {
				return res.status(200).json({
					success: true,
					output: '',
					error: 'Time Limit Exceeded',
					executionTime: 15000
				});
			}

			return res.status(500).json({
				success: false,
				msg: 'Remote execution service unavailable',
				error: apiErr.message
			});
		}
	} catch (error) {
		console.error('Code runner error:', error);
		return res.status(500).json({
			success: false,
			msg: 'Failed to run code',
			error: error.message
		});
	}
};
