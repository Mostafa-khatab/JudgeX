import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import routesConfig from '~/config/routes';
import useAuthStore from '~/stores/authStore';
import { getTopicById } from '~/services/topic';
import { updateRoadmapProgress, verifyRoadmapProblem } from '~/services/user';
import { CheckCircle, Circle, Lock, PlayCircle, HelpCircle, Code, ArrowRight, ChevronLeft } from 'lucide-react';

const RoadmapTopic = () => {
	const { topicId } = useParams();
	const { user, reload, isLoading: isLoadingUser } = useAuthStore();

	const [loading, setLoading] = useState(true);
	const [topic, setTopic] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [videoChecked, setVideoChecked] = useState(false);
	const [selectedOption, setSelectedOption] = useState(null);
	const [isInitialized, setIsInitialized] = useState(false);

	const progress = user?.roadmapProgress;
	const userTopicProgress = useMemo(() => {
		if (!topicId || !progress?.topicProgress) return null;
		// Handle both plain object and Mongoose Map (if applicable)
		return progress.topicProgress[topicId] || (typeof progress.topicProgress.get === 'function' ? progress.topicProgress.get(topicId) : null) || null;
	}, [progress, topicId]);

	const STORAGE_KEY = `roadmap_progress_${topicId || 'default'}`;

	useEffect(() => {
		let mounted = true;
		(async () => {
			if (!topicId) return;
			try {
				setLoading(true);
				const res = await getTopicById(topicId);
				if (!mounted) return;
				setTopic(res?.data || null);
			} catch (err) {
				toast.error('Failed to load topic');
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
			setIsInitialized(false);
		};
	}, [topicId]);

	const totalSteps = useMemo(() => {
		if (!topic) return 0;
		const quizzes = Array.isArray(topic.quizzes) ? topic.quizzes.length : 0;
		return 1 + quizzes + 1;
	}, [topic]);

	const steps = useMemo(() => {
		if (!topic) return [];
		const list = [{ id: 0, title: 'Video Lesson', type: 'video', icon: PlayCircle }];
		topic.quizzes?.forEach((q, i) => {
			list.push({ id: i + 1, title: `Quiz ${i + 1}`, type: 'quiz', icon: HelpCircle });
		});
		list.push({ id: totalSteps - 1, title: 'Coding Problem', type: 'problem', icon: Code });
		return list;
	}, [topic, totalSteps]);

	const linkedProblemId = useMemo(() => {
		const linked = Array.isArray(topic?.linkedProblems) ? topic.linkedProblems[0] : null;
		return linked?.id;
	}, [topic]);

	const unlockedTopicIds = useMemo(() => Array.isArray(progress?.unlockedTopicIds) ? progress.unlockedTopicIds : [], [progress]);
	const completedTopicIds = useMemo(() => Array.isArray(progress?.completedTopicIds) ? progress.completedTopicIds : [], [progress]);
	const isCompletedTopic = useMemo(() => completedTopicIds.includes(topicId), [completedTopicIds, topicId]);
	const isUnlockedTopic = useMemo(() => isCompletedTopic || unlockedTopicIds.includes(topicId) || (unlockedTopicIds.length === 0 && topic?.order === 0), [isCompletedTopic, unlockedTopicIds, topicId, topic]);

	useEffect(() => {
		// Wait for both topic and user data to be ready
		if (isInitialized || loading || isLoadingUser || !topicId) return;

		const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
		
		// Priority: Backend > Local > 0
		const stepFromBackend = typeof userTopicProgress?.currentStep === 'number' ? userTopicProgress.currentStep : null;
		const stepFromLocal = typeof localData.currentStep === 'number' ? localData.currentStep : null;
		
		const finalStep = Math.max(stepFromBackend || 0, stepFromLocal || 0);
		
		setCurrentStep(finalStep);
		setVideoChecked(userTopicProgress?.videoWatched || localData.videoChecked || false);
		
		if (localData.selectedOption !== undefined) {
			setSelectedOption(localData.selectedOption);
		}
		
		setIsInitialized(true);
	}, [userTopicProgress, topicId, STORAGE_KEY, isInitialized, loading, isLoadingUser]);

	useEffect(() => {
		if (!topicId || !isInitialized) return;
		const data = { currentStep, videoChecked, selectedOption };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}, [currentStep, videoChecked, selectedOption, topicId, STORAGE_KEY, isInitialized]);

	if (loading) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-10">
				<div className="text-sm text-gray-500 dark:text-gray-400">Loading topic...</div>
			</div>
		);
	}

	if (!topic) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-10">
				<div className="text-sm text-red-600 dark:text-red-400">Topic not found.</div>
				<Link className="text-blue-600 dark:text-blue-400 underline" to={routesConfig.home}>Back to Home</Link>
			</div>
		);
	}

	if (!isUnlockedTopic) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-10 space-y-3">
				<div className="text-sm text-gray-700 dark:text-gray-300">This topic is locked. Complete previous topics to unlock it.</div>
				<Link className="text-blue-600 dark:text-blue-400 underline" to={routesConfig.home}>Back to Home</Link>
			</div>
		);
	}

	const isVideoStep = currentStep === 0;
	const isProblemStep = totalSteps > 0 && currentStep === totalSteps - 1;
	const quizIndex = currentStep - 1;
	const currentQuiz = !isVideoStep && !isProblemStep ? topic.quizzes?.[quizIndex] : null;

	const canNext = (() => {
		if (isVideoStep) return videoChecked;
		if (isProblemStep) return false;
		if (!currentQuiz) return false;
		if (!selectedOption) return false;
		return String(selectedOption).trim() === String(currentQuiz.answer).trim();
	})();

	const handleNext = async () => {
		try {
			if (!canNext) return;
			const nextStep = Math.min(currentStep + 1, totalSteps - 1);
			setCurrentStep(nextStep);
			setSelectedOption(null); // Clear selection for the next step

			const patch = { currentStep: nextStep };
			if (isVideoStep) patch.videoWatched = true;
			if (!isVideoStep && !isProblemStep) {
				const prevPassed = Array.isArray(userTopicProgress?.quizzesPassed) ? userTopicProgress.quizzesPassed : [];
				const copy = [...prevPassed];
				copy[quizIndex] = true;
				patch.quizzesPassed = copy;
			}

			await updateRoadmapProgress({ topicId, patch });
			await reload(); // Refresh user data to sync with backend
		} catch {
			toast.error('Failed to update progress');
		}
	};

	const handleVerifyProblem = async () => {
		try {
			const res = await verifyRoadmapProblem({ topicId, problemId: linkedProblemId });
			if (res.data.accepted) {
				toast.success('Problem verified! Topic completed.');
			} else {
				toast.info('No accepted submission found for this problem.');
			}
		} catch {
			toast.error('Failed to verify problem');
		}
	};

	const getStepStatus = (stepId) => {
		if (stepId < currentStep) return 'completed';
		if (stepId === currentStep) return 'active';
		return 'locked';
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-12">
			<div className="flex flex-col lg:flex-row gap-12">
				{/* Sidebar Path */}
				<div className="w-full lg:w-80 shrink-0">
					<div className="sticky top-24 space-y-8 bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
								<span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Current Mission</span>
							</div>
							<h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{topic.title}</h1>
						</div>

						<div className="relative px-2">
							{/* Vertical Line */}
							<div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>

							<div className="space-y-6">
								{steps.map((step) => {
									const status = getStepStatus(step.id);
									const Icon = step.icon;
									const isClickable = status !== 'locked' || isCompletedTopic;

									return (
										<button
											key={step.id}
											onClick={() => isClickable && setCurrentStep(step.id)}
											disabled={!isClickable}
											className={`relative flex items-center gap-5 w-full text-left group transition-all ${
												status === 'active' ? 'translate-x-1' : ''
											} ${!isClickable ? 'opacity-40 cursor-not-allowed' : ''}`}
										>
											<div
												className={`z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
													status === 'completed'
														? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
														: status === 'active'
														? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110'
														: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400'
												}`}
											>
												{status === 'completed' ? <CheckCircle size={16} /> : status === 'locked' ? <Lock size={12} /> : <Icon size={14} />}
											</div>
											<div className="flex-1 min-w-0">
												<div
													className={`text-sm font-bold truncate transition-colors ${
														status === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'
													}`}
												>
													{step.title}
												</div>
												{status === 'completed' && <div className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest mt-0.5">Verified</div>}
											</div>
										</button>
									);
								})}
							</div>
						</div>

						<Link to={`${routesConfig.home}?tab=roadmap`} className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:gap-3 transition-all pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
							<ChevronLeft size={14} /> Back to Roadmap
						</Link>
					</div>
				</div>

				{/* Content View */}
				<div className="flex-1 min-w-0">
					<div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-10 shadow-xl space-y-10">
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-100 dark:border-zinc-800/50">
							<div className="space-y-2">
								<h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{steps[currentStep]?.title}</h2>
								<div className="flex items-center gap-3">
									<div className="h-1 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
										<div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}></div>
									</div>
									<span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phase {currentStep + 1} / {totalSteps}</span>
								</div>
							</div>
							{isCompletedTopic && (
								<div className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2 shadow-sm">
									<CheckCircle size={14} strokeWidth={3} /> Mission Accomplished
								</div>
							)}
						</div>

						<div className="min-h-[400px]">
							{isVideoStep && (
								<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
									<div className="w-full aspect-video rounded-[2rem] overflow-hidden bg-black shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] border-4 border-zinc-200 dark:border-zinc-800">
										<iframe
											width="100%"
											height="100%"
											src={topic.videoUrl}
											title="Topic Video"
											frameBorder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
										></iframe>
									</div>
									<div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between group">
										<label className="flex items-center gap-4 cursor-pointer select-none">
											<div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${videoChecked ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'border-zinc-300 dark:border-zinc-700'}`}>
												{videoChecked && <CheckCircle size={14} strokeWidth={3} />}
											</div>
											<input type="checkbox" className="hidden" checked={videoChecked} onChange={(e) => setVideoChecked(e.target.checked)} />
											<span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">I have mastered this visual lesson</span>
										</label>
									</div>
								</div>
							)}

							{currentQuiz && (
								<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
									<div className="p-8 rounded-[2rem] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 shadow-inner">
										<p className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-relaxed">
											{currentQuiz.question}
										</p>
									</div>
									<div className="grid grid-cols-1 gap-4">
										{currentQuiz.options?.map((opt, i) => (
											<button
												key={i}
												onClick={() => setSelectedOption(opt)}
												className={`flex items-center gap-5 p-6 border rounded-2xl text-left transition-all group ${
													selectedOption === opt
														? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.01]'
														: 'bg-white dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500'
												}`}
											>
												<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === opt ? 'border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-blue-400'}`}>
													{selectedOption === opt && <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>}
												</div>
												<span className="text-base font-bold">{opt}</span>
											</button>
										))}
									</div>
									{selectedOption && !canNext && (
										<motion.div 
											initial={{ opacity: 0, x: -10 }} 
											animate={{ opacity: 1, x: 0 }}
											className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-3"
										>
											<HelpCircle size={18} /> Logical mismatch detected. Try another path.
										</motion.div>
									)}
								</div>
							)}

							{isProblemStep && (
								<div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
									<div className="p-10 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex flex-col items-center text-center space-y-6">
										<div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-indigo-100 dark:border-indigo-800 animate-bounce-slow">
											<Code className="text-indigo-600 dark:text-indigo-400" size={48} />
										</div>
										<div className="space-y-4">
											<h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Final Combat Trial</h3>
											<p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium max-w-xl">
												Apply everything you've learned. Solve this algorithm challenge to secure this topic's completion. 
												Accepted submissions are automatically synchronized.
											</p>
										</div>
									</div>

									{linkedProblemId ? (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<a
												href={routesConfig.problemSolve.replace(':id', linkedProblemId)}
												target="_blank"
												rel="noreferrer"
												className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-2xl group"
											>
												<Code className="text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 mb-4 transition-colors" size={32} />
												<span className="text-xs font-black text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest">Execute Code Trial</span>
											</a>
											<button
												onClick={handleVerifyProblem}
												className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-2xl group"
											>
												<CheckCircle className="text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500 mb-4 transition-colors" size={32} />
												<span className="text-xs font-black text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest">Verify Synchro</span>
											</button>
										</div>
									) : (
										<div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest text-center">
											Intelligence gap: No problem linked to this neural node yet.
										</div>
									)}
								</div>
							)}
						</div>

						<div className="flex items-center justify-between pt-10 border-t border-zinc-100 dark:border-zinc-800/50">
							<button
								onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
								className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${currentStep > 0 ? 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white' : 'invisible'}`}
							>
								<ChevronLeft size={14} /> Retreat to Phase {currentStep}
							</button>
							{!isProblemStep && (
								<button
									onClick={handleNext}
									disabled={!canNext}
									className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
								>
									Advance Phase <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RoadmapTopic;
