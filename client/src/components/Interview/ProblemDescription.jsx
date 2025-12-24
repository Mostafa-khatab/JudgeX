import React from 'react';
import ReactMarkdown from 'react-markdown';

const ProblemDescription = ({ problem }) => {
	if (!problem) {
		return (
			<div className="p-6 text-gray-400 italic">
				Select a problem to start the interview...
			</div>
		);
	}

	return (
		<div className="p-6 h-full overflow-y-auto bg-gray-800 text-gray-100 rounded-lg shadow-inner custom-scrollbar">
			<h1 className="text-2xl font-bold mb-4 text-blue-400">{problem.title}</h1>
			<div className="flex gap-2 mb-6">
				<span className={`px-2 py-1 rounded text-xs font-semibold ${
					problem.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
					problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
					'bg-red-900 text-red-300'
				}`}>
					{problem.difficulty}
				</span>
			</div>
			<div className="prose prose-invert max-w-none">
				<ReactMarkdown>{problem.description}</ReactMarkdown>
			</div>
			{problem.examples && (
				<div className="mt-8">
					<h2 className="text-xl font-semibold mb-4 text-gray-300">Examples</h2>
					{problem.examples.map((example, index) => (
						<div key={index} className="mb-4 p-4 bg-gray-900 rounded-md border border-gray-700">
							<p className="font-mono text-sm text-blue-300 mb-1">Input:</p>
							<code className="block mb-2 text-gray-300">{example.input}</code>
							<p className="font-mono text-sm text-green-300 mb-1">Output:</p>
							<code className="block text-gray-300">{example.output}</code>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ProblemDescription;
