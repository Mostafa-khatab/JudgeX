const isWindows = process.platform === 'win32';
const executable = isWindows ? 'main.exe' : 'main';

const languages = {
	c: {
		mainFile: 'main.c',
		compileCmd: `gcc -std=c99 main.c -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	c11: {
		mainFile: 'main.c',
		compileCmd: `gcc -std=c11 main.c -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	'c++11': {
		mainFile: 'main.cpp',
		compileCmd: `g++ -std=c++11 main.cpp -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	'c++14': {
		mainFile: 'main.cpp',
		compileCmd: `g++ -std=c++14 main.cpp -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	'c++17': {
		mainFile: 'main.cpp',
		compileCmd: `g++ -std=c++17 main.cpp -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	'c++20': {
		mainFile: 'main.cpp',
		compileCmd: `g++ -std=c++17 main.cpp -o ${executable}`,
		runCmd: isWindows ? 'main.exe' : './main',
	},
	python2: {
		mainFile: 'main.py',
		runCmd: 'python main.py', // Fallback to python if python2 not available
	},
	python3: {
		mainFile: 'main.py',
		runCmd: 'python main.py', // Use python instead of python3 for better compatibility
	},
};

export default languages;
