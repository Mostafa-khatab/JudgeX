import axios from 'axios';

// Wandbox compiler mapping
const WANDBOX_COMPILERS = {
	'python3': 'cpython-3.12.7',
	'python2': 'cpython-2.7.18',
	'c': 'gcc-13.2.0-c',
	'c11': 'gcc-13.2.0-c',
	'c++11': 'gcc-13.2.0',
	'c++14': 'gcc-13.2.0',
	'c++17': 'gcc-13.2.0',
	'c++20': 'gcc-13.2.0',
	'java': 'openjdk-jdk-22+36',
	'javascript': 'nodejs-20.17.0',
	'node': 'nodejs-20.17.0',
};

export const runCode = async (req, res) => {
	try {
		const { code, language, input } = req.body;

		console.log('Code Runner Request:', { language, codeLength: code?.length, hasInput: !!input });

		if (!code || !code.trim()) {
			return res.status(400).json({ msg: 'Code is required' });
		}

		const compiler = WANDBOX_COMPILERS[language];
		if (!compiler) {
			return res.status(400).json({ msg: `Unsupported language: ${language}` });
		}

		try {
			const startTime = Date.now();
			const response = await axios.post('https://wandbox.org/api/compile.json', {
				code,
				compiler,
				stdin: input || '',
				'save': false
			}, { timeout: 30000 });

			const elapsed = Date.now() - startTime;
			const data = response.data;

			const output = data.program_output || '';
			const compileError = data.compiler_error || '';
			const runtimeError = data.program_error || '';
			const error = compileError || runtimeError || null;

			return res.status(200).json({
				success: true,
				output: output,
				error: error,
				executionTime: elapsed,
			});

		} catch (apiErr) {
			console.error('Wandbox API Error:', apiErr.message);
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
