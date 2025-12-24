import React, { useState, useEffect } from 'react';
import { Search, X, Check, PlusSquare } from 'lucide-react';
import { getProblems } from '~/services/problem';
import { toast } from 'react-toastify';

const AddQuestionModal = ({ isOpen, onClose, onSelectQuestion }) => {
	const [questions, setQuestions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [difficulty, setDifficulty] = useState('');

	useEffect(() => {
		if (isOpen) {
			fetchProblems();
		}
	}, [isOpen, search, difficulty]);

	const fetchProblems = async () => {
		setLoading(true);
		try {
			const res = await getProblems({
				search: search,
				difficulty: difficulty !== 'Difficulty' ? difficulty : '',
				limit: 20,
			});
			setQuestions(res.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load problems');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[900px] h-[600px] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Question</h2>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
						<X size={20} />
					</button>
				</div>

				{/* Filters */}
				<div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
					<select
						value={difficulty}
						onChange={(e) => setDifficulty(e.target.value)}
						className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
					>
						<option value="">Difficulty</option>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Question ID/Title"
							className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
						/>
					</div>
				</div>

				{/* List */}
				<div className="flex-1 overflow-auto">
					{loading ? (
						<div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
					) : (
						<table className="w-full text-left border-collapse">
							<thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
								<tr>
									<th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
									<th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Difficulty</th>
									<th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acceptance</th>
									<th className="px-6 py-3"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
								{questions.map((q) => (
									<tr
										key={q._id || q.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
										onClick={() => onSelectQuestion(q)}
									>
										<td className="px-6 py-3 text-sm text-gray-900 dark:text-white font-medium">
											{q.id}. {q.name}
										</td>
										<td className="px-6 py-3 text-sm">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													q.difficulty === 'easy'
														? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
														: q.difficulty === 'medium'
														? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
														: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
												}`}
											>
												{q.difficulty}
											</span>
										</td>
										<td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
											{q.noOfSubm ? Math.round((q.noOfSuccess / q.noOfSubm) * 100) : 0}%
										</td>
										<td className="px-6 py-3 text-right">
											<button className="text-gray-400 hover:text-blue-600">
												<PlusSquare size={18} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
					<span className="text-sm text-gray-500">{questions.length} questions found</span>
					<button
						onClick={onClose}
						className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default AddQuestionModal;
