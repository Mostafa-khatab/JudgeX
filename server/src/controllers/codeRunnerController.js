import axios from 'axios';

export const runCode = async (req, res) => {
	try {
		const { code, language, input } = req.body;

		console.log('Code Runner Request (Remote):', { language, codeLength: code?.length, hasInput: !!input });

		if (!code || !code.trim()) {
			return res.status(400).json({ msg: 'Code is required' });
		}

		// Piston API Language Mapping
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
			'node': 'node',
			'typescript': 'ts-node',
			'go': 'go'
		};

		const lang = pistonLanguages[language] || language;

		try {
			// Execute using Piston API (No Docker needed!)
			const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
				language: lang,
				version: '*',
				files: [
					{
						content: code
					}
				],
				stdin: input || ''
			}, { timeout: 15000 });

			const result = response.data.run;
			
			return res.status(200).json({
				success: true,
				output: result.stdout || '',
				error: result.stderr || (result.code !== 0 ? result.output : null),
				executionTime: result.time || 0,
			});

		} catch (apiErr) {
			console.error('Piston API Error:', apiErr.message);
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
