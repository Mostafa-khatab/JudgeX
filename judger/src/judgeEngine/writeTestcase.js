import path from 'path';
import fs from 'fs-extra';

const writeTestcase = (testcase = []) => {
	const testcasePath = path.join(path.resolve(), 'tmp', 'testcase');
	
	// Create directory if it doesn't exist
	fs.ensureDirSync(testcasePath);
	
	// Instead of emptying the directory, just overwrite the files we need
	// This avoids the file locking issue on Windows
	testcase.forEach((test, index) => {
		const inpFile = path.join(testcasePath, `${index + 1}.inp`);
		const outFile = path.join(testcasePath, `${index + 1}.out`);
		
		fs.writeFileSync(inpFile, test.stdin);
		fs.writeFileSync(outFile, test.stdout);
	});
	
	// Clean up any extra files that might exist (but don't force it)
	try {
		const files = fs.readdirSync(testcasePath);
		files.forEach(file => {
			const filePath = path.join(testcasePath, file);
			const fileIndex = parseInt(file.match(/\d+/)?.[0] || '0');
			// Only delete files that are not part of our testcases
			if (fileIndex > testcase.length) {
				try {
					fs.unlinkSync(filePath);
				} catch (err) {
					// Ignore errors when deleting extra files
					console.warn(`Could not delete extra file ${file}:`, err.message);
				}
			}
		});
	} catch (err) {
		// Ignore cleanup errors
		console.warn('Could not clean up extra files:', err.message);
	}
};

export default writeTestcase;
