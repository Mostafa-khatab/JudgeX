import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const RunCodeResultModal = ({ isOpen, onClose, output }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Run Code</h2>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					<div className="flex items-start gap-4 mb-6">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-sm text-gray-500 dark:text-gray-400">Whiteboard 1</span>
							</div>
							<div className="flex items-center gap-2 mb-4">
								<span className="text-xl font-bold text-green-500">Run Success</span>
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="text-gray-500 dark:text-gray-400">Runtime</div>
								<div className="text-right font-mono text-gray-900 dark:text-white">0 ms</div>
								<div className="text-gray-500 dark:text-gray-400">Memory</div>
								<div className="text-right font-mono text-gray-900 dark:text-white">7.1 MB</div>
							</div>
						</div>
						<div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded p-4 font-mono text-sm">
							<div className="text-blue-600 dark:text-blue-400 mb-2">#include &lt;stdio.h&gt;</div>
							<div className="text-gray-900 dark:text-white">
								<span className="text-purple-600 dark:text-purple-400">int</span> <span className="text-yellow-600 dark:text-yellow-400">main</span>(<span className="text-purple-600 dark:text-purple-400">void</span>) {'{'}
							</div>
							<div className="pl-4 text-gray-900 dark:text-white">
								puts(<span className="text-green-600 dark:text-green-400">"Hello LeetCoder"</span>);
							</div>
							<div className="pl-4 text-gray-900 dark:text-white">
								<span className="text-purple-600 dark:text-purple-400">return</span> <span className="text-blue-600 dark:text-blue-400">0</span>;
							</div>
							<div className="text-gray-900 dark:text-white">{'}'}</div>
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-gray-900 rounded p-4">
						<div className="text-xs text-gray-500 dark:text-gray-400 mb-1">stdout:</div>
						<div className="font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
							Hello LeetCoder
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RunCodeResultModal;
