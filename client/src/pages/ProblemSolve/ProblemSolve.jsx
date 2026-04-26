import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Editor } from '@monaco-editor/react';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Skeleton } from '~/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '~/components/ui/dialog';
import { Link } from 'react-router';
import Markdown from 'react-markdown';
import {
	AlignJustify,
	Clock,
	Cpu,
	Tag,
	Award,
	Hash,
	ChevronRight,
	Code,
	Loader2,
	Play,
	Send as SendIcon,
	FileCode,
	Settings,
	Maximize2,
	Minimize2,
	X,
	MessageSquare,
} from 'lucide-react';

import useAuthStore from '~/stores/authStore';
import useThemeStore from '~/stores/themeStore';
import { getProblem } from '~/services/problem';
import { runCode as runCodeService } from '~/services/codeRunner';
import routesConfig from '~/config/routes';
import markdownComponents from '~/config/markdownComponents.jsx';
import codeTemplate from '~/config/codeTemplate';
import editorConfig from '~/config/editor';
import Select from '~/components/Select';
import ChatBot from '~/components/ChatBot';
import { submit, getSubmission } from '~/services/submission';

const ProblemSolve = () => {
	const { t } = useTranslation('problem');
	const { isAuth, user } = useAuthStore();
	const { theme } = useThemeStore();
	const { id } = useParams();
	const [searchParams] = useSearchParams();

	const [problem, setProblem] = useState(null);
	const [loading, setLoading] = useState(false);
	const [src, setSrc] = useState('');
	const [language, setLanguage] = useState(user?.defaultLanguage || 'c++17');
	const [languageType, setLanguageType] = useState();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submission, setSubmission] = useState(null);
	const [submissionResult, setSubmissionResult] = useState(null); // final polled result
	const [isPolling, setIsPolling] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const pollIntervalRef = useRef(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [showRunPanel, setShowRunPanel] = useState(false);
	const [activeTestCase, setActiveTestCase] = useState(0);
	const [testCases, setTestCases] = useState([]); // [{ stdin, expectedOutput, actualOutput, status, error }]

	const openDialogRef = useRef(null); // kept for backward compat but no longer used as dialog trigger

	// Chat dock state
	const [isChatOpen, setIsChatOpen] = useState(false);

	const languageValue = {
		c: 'c',
		c11: 'c',
		'c++11': 'cpp',
		'c++14': 'cpp',
		'c++17': 'cpp',
		'c++20': 'cpp',
		python2: 'python',
		python3: 'python',
	};

	useEffect(() => {
		setLoading(true);
		getProblem(id)
			.then((res) => {
				setProblem(res.data);
				if (res.data?.testcase?.length > 0) {
					setTestCases(
						res.data.testcase.slice(0, 3).map((tc) => ({
							stdin: tc.stdin,
							expectedOutput: tc.stdout,
							actualOutput: null,
							status: null,
							error: null,
						}))
					);
				}
			})
			.catch((err) => {
				toast.error(err.response?.data?.msg || 'Failed to load problem');
			})
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		setLanguageType(languageValue[language]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language]);

	useEffect(() => {
		setSrc(codeTemplate[languageType] || '');
	}, [languageType]);

	const handleRun = async () => {
		if (!src.trim()) {
			toast.error('Please write some code first');
			return;
		}

		if (testCases.length === 0) {
			toast.error('No testcases available to run');
			return;
		}

		setIsRunning(true);
		setShowRunPanel(true);
		setActiveTestCase(0);

		// Reset previous results
		setTestCases((prev) =>
			prev.map((tc) => ({ ...tc, actualOutput: null, status: 'Running...', error: null }))
		);

		try {
			const promises = testCases.map(async (tc) => {
				try {
					const res = await runCodeService({ code: src, language, input: tc.stdin });
					const data = res.data || res;
					
					const actualOut = (data.output || '').replace(/\r/g, '').trim();
					const expectedOut = (tc.expectedOutput || '').replace(/\r/g, '').trim();

					let status = 'AC';
					if (data.error === 'Time Limit Exceeded') {
						status = 'TLE';
					} else if (data.error || (data.output && data.output.toLowerCase().includes('error') && data.statusCode !== 200)) {
						status = 'RTE';
					} else if (actualOut !== expectedOut) {
						status = 'WA';
					}

					return {
						...tc,
						actualOutput: data.output || '',
						status: status,
						error: data.error || null,
					};
				} catch (err) {
					return {
						...tc,
						actualOutput: '',
						status: 'IE',
						error: err.response?.data?.error || err.message || 'Execution failed',
					};
				}
			});

			const results = await Promise.all(promises);
			setTestCases(results);
		} catch (err) {
			console.error('Run error:', err);
		} finally {
			setIsRunning(false);
		}
	};

	const startPolling = useCallback((submissionId) => {
		if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
		setIsPolling(true);
		setSubmissionResult(null);

		pollIntervalRef.current = setInterval(async () => {
			try {
				const res = await getSubmission(submissionId);
				const data = res.data;
				if (data?.status && data.status !== 'PENDING') {
					clearInterval(pollIntervalRef.current);
					pollIntervalRef.current = null;
					setSubmissionResult(data);
					setIsPolling(false);
				}
			} catch (err) {
				clearInterval(pollIntervalRef.current);
				pollIntervalRef.current = null;
				setIsPolling(false);
			}
		}, 2000);
	}, []);

	// Cleanup polling on unmount
	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
		};
	}, []);

	const handleSubmit = () => {
		if (!src.trim()) {
			toast.error('Please write some code first');
			return;
		}

		setIsSubmitting(true);
		setSubmission(null);
		setSubmissionResult(null);
		submit({ src, problem: id, language, contest: user?.joiningContest })
			.then((res) => {
				const data = res.data;
				setSubmission(data);
				setDialogOpen(true);
				// Start polling for result
				startPolling(data._id);
			})
			.catch((err) => toast.error(err.response?.data?.msg || 'Submission failed'))
			.finally(() => setIsSubmitting(false));
	};

	const MetadataSkeleton = () => (
		<div className="space-y-3">
			<Skeleton className="h-5 w-1/3 rounded-lg dark:bg-neutral-800" />
			<Skeleton className="h-4 w-1/2 rounded-lg dark:bg-neutral-800" />
		</div>
	);

	return (
		<div className="flex h-screen flex-col dark:bg-neutral-950">
			{/* Header */}
			<div className="border-b border-gray-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between">
					<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
						<Link to={routesConfig.problems} className="transition hover:text-gray-700 dark:hover:text-gray-300">
							{t('problems')}
						</Link>
						<ChevronRight className="mx-2 h-4 w-4" />
						<span className="font-medium text-gray-900 dark:text-white">
							{loading ? <Skeleton className="inline-block h-4 w-32 rounded-md dark:bg-neutral-800" /> : problem?.id}
						</span>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
							{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link to={`${routesConfig.submissions}?problem=${id}`}>
								<AlignJustify className="mr-2 h-4 w-4" />
								{t('submissions')}
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel - Problem Description */}
				{!isFullscreen && (
					<div className="flex w-1/2 flex-col border-r border-gray-200 dark:border-neutral-800">
						<Tabs defaultValue="description" className="flex h-full flex-col">
							<TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
								<TabsTrigger value="description" className="capitalize">
									{t('description')}
								</TabsTrigger>
								<TabsTrigger value="details" className="capitalize">
									{t('details')}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="description" className="flex-1 overflow-y-auto p-6">
								{loading ? (
									<div className="space-y-6">
										<Skeleton className="h-10 w-2/3 rounded-lg dark:bg-neutral-800" />
										<div className="space-y-3">
											<Skeleton className="h-5 w-full rounded-lg dark:bg-neutral-800" />
											<Skeleton className="h-5 w-5/6 rounded-lg dark:bg-neutral-800" />
											<Skeleton className="h-5 w-3/4 rounded-lg dark:bg-neutral-800" />
										</div>
									</div>
								) : (
									<>
										<div className="mb-6">
											<h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">{problem?.name}</h1>
											<div className="flex flex-wrap items-center gap-2">
												<span
													data-difficulty={problem?.difficulty}
													className={`rounded-full border px-3 py-1 text-sm font-medium data-[difficulty='']:border-gray-200 data-[difficulty=easy]:border-green-200 data-[difficulty=hard]:border-red-200 data-[difficulty=medium]:border-yellow-200 data-[difficulty='']:bg-gray-100 data-[difficulty=easy]:bg-green-100 data-[difficulty=hard]:bg-red-100 data-[difficulty=medium]:bg-yellow-100 data-[difficulty='']:text-gray-600 data-[difficulty=easy]:text-green-600 data-[difficulty=hard]:text-red-600 data-[difficulty=medium]:text-yellow-600 dark:data-[difficulty='']:border-gray-700 dark:data-[difficulty=easy]:border-green-800 dark:data-[difficulty=hard]:border-red-800 dark:data-[difficulty=medium]:border-yellow-800 dark:data-[difficulty='']:bg-gray-800 dark:data-[difficulty=easy]:bg-green-900/30 dark:data-[difficulty=hard]:bg-red-900/30 dark:data-[difficulty=medium]:bg-yellow-900/30 dark:data-[difficulty='']:text-gray-400 dark:data-[difficulty=easy]:text-green-400 dark:data-[difficulty=hard]:text-red-400 dark:data-[difficulty=medium]:text-yellow-400`}
												>
													{t(problem?.difficulty)}
												</span>
												{problem?.tags?.map((tag, index) => (
													<span
														key={index}
														className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
													>
														{tag}
													</span>
												))}
											</div>
										</div>
										<div className="prose dark:prose-invert prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 dark:prose-headings:text-gray-100 dark:prose-p:text-gray-300 dark:prose-pre:bg-neutral-800/50 dark:prose-pre:border-neutral-700 max-w-none">
											<Markdown components={markdownComponents}>{problem?.task}</Markdown>
										</div>
									</>
								)}
							</TabsContent>

							<TabsContent value="details" className="flex-1 overflow-y-auto p-6">
								{loading ? (
									<div className="space-y-6">
										<MetadataSkeleton />
										<div className="my-3 h-px bg-gray-200 dark:bg-neutral-700" />
										<MetadataSkeleton />
									</div>
								) : (
									<div className="space-y-6">
										<div>
											<h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('problem-info')}</h3>
											<div className="space-y-3">
												<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
													<div className="flex items-center text-gray-600 dark:text-gray-400">
														<Hash className="mr-2 h-4 w-4" />
														<span className="text-sm">{t('id')}</span>
													</div>
													<span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{problem?.id}</span>
												</div>
												<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
													<div className="flex items-center text-gray-600 dark:text-gray-400">
														<Award className="mr-2 h-4 w-4" />
														<span className="text-sm">{t('point')}</span>
													</div>
													<span className="font-medium text-gray-900 dark:text-gray-100">{problem?.point}p</span>
												</div>
												<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
													<div className="flex items-center text-gray-600 dark:text-gray-400">
														<Clock className="mr-2 h-4 w-4" />
														<span className="text-sm">{t('time-limit')}</span>
													</div>
													<span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{problem?.timeLimit}s</span>
												</div>
												<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
													<div className="flex items-center text-gray-600 dark:text-gray-400">
														<Cpu className="mr-2 h-4 w-4" />
														<span className="text-sm">{t('memory-limit')}</span>
													</div>
													<span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{problem?.memoryLimit}MB</span>
												</div>
											</div>
										</div>

										<div className="h-px bg-gray-200 dark:bg-neutral-700" />

										<div>
											<h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('statistics')}</h3>
											<div className="grid grid-cols-2 gap-3">
												<div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
													<div className="text-2xl font-bold text-green-600 dark:text-green-400">{problem?.noOfSuccess || 0}</div>
													<div className="text-xs text-gray-600 dark:text-gray-400">{t('ac-count')}</div>
												</div>
												<div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
													<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
														{problem?.noOfSubm ? Math.round((problem?.noOfSuccess / problem?.noOfSubm) * 100) : 0}%
													</div>
													<div className="text-xs text-gray-600 dark:text-gray-400">{t('ac-rate')}</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>
				)}

				{/* Right Panel - Code Editor */}
				<div className={`flex ${isFullscreen ? 'w-full' : 'w-1/2'} flex-col`}>
					{/* Editor Header */}
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800">
						<div className="flex items-center gap-2">
							<Code className="h-4 w-4 text-blue-500" />
							<span className="text-sm font-medium text-gray-700 dark:text-gray-200">Code Editor</span>
						</div>
						<div className="flex items-center gap-3">
							<Select
								defaultValue={user?.defaultLanguage || 'c++17'}
								triggerClassname="h-8 w-32 bg-white border border-gray-200 text-xs"
								setValue={setLanguage}
								data={Object.keys(languageValue).map((item) => ({
									value: item,
									label: <span className="capitalize text-gray-700 dark:text-gray-300">{item}</span>,
								}))}
							/>
						</div>
					</div>

					{/* Editor */}
					<div className={showRunPanel ? 'h-1/2' : 'flex-1'}>
						<Editor
							language={languageValue[language]}
							value={src}
							onChange={setSrc}
							options={editorConfig}
							theme={theme === 'dark' ? 'vs-dark' : 'light'}
						/>
					</div>

					{/* Run Panel */}
					{showRunPanel && (
						<div className="flex h-1/2 flex-col border-t border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
							<div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
								<div className="flex items-center gap-2">
									<Play className="h-4 w-4 text-green-500" />
									<span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Testcases</span>
								</div>
								<Button variant="ghost" size="sm" onClick={() => setShowRunPanel(false)} className="h-7 px-2">
									<X className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
								</Button>
							</div>

							<div className="flex flex-1 overflow-hidden">
								{/* Left side: Testcase Tabs */}
								<div className="w-24 border-r border-gray-200 bg-gray-50/50 p-2 flex flex-col gap-1 overflow-y-auto dark:border-neutral-800 dark:bg-neutral-900/50">
									{testCases.map((tc, idx) => (
										<button
											key={idx}
											onClick={() => setActiveTestCase(idx)}
											className={`flex items-center justify-between rounded px-3 py-2 text-xs font-medium transition-all ${
												activeTestCase === idx 
													? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-800 dark:text-blue-400 border border-gray-200 dark:border-neutral-700' 
													: 'text-gray-600 hover:bg-gray-200 border border-transparent dark:text-gray-400 dark:hover:bg-neutral-800'
											}`}
										>
											Case {idx + 1}
											{tc.status && tc.status !== 'Running...' && (
												<span className={`h-2 w-2 rounded-full shadow-sm ${tc.status === 'AC' ? 'bg-green-500' : tc.status === 'TLE' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
											)}
										</button>
									))}
								</div>

								{/* Right side: Active Testcase Details */}
								<div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-neutral-900">
									{testCases[activeTestCase] ? (
										<div className="space-y-5">
											<div className="flex items-center gap-3">
												<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Run Result</h3>
												{testCases[activeTestCase].status && (
													<span
														className={`rounded px-2.5 py-1 text-xs font-bold shadow-sm ${
															testCases[activeTestCase].status === 'Running...'
																? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
																: testCases[activeTestCase].status === 'AC'
																? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
																: testCases[activeTestCase].status === 'TLE'
																? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
																: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
														}`}
													>
														{testCases[activeTestCase].status === 'AC' ? 'Accepted' : testCases[activeTestCase].status === 'WA' ? 'Wrong Answer' : testCases[activeTestCase].status === 'TLE' ? 'Time Limit Exceeded' : testCases[activeTestCase].status}
													</span>
												)}
											</div>

											{testCases[activeTestCase].error && (
												<div>
													<p className="mb-1.5 text-xs font-medium text-red-600 dark:text-red-400">Error</p>
													<pre className="rounded-md border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 whitespace-pre-wrap">
														{testCases[activeTestCase].error}
													</pre>
												</div>
											)}

											<div>
												<p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Input</p>
												<pre className="rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 whitespace-pre-wrap">
													{testCases[activeTestCase].stdin || '(empty)'}
												</pre>
											</div>

											{testCases[activeTestCase].actualOutput !== null && (
												<div>
													<p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Your Output</p>
													<pre className={`rounded-md border p-3 font-mono text-xs whitespace-pre-wrap ${
														testCases[activeTestCase].status === 'AC' 
															? 'border-gray-200 bg-gray-50 text-gray-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300' 
															: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400'
													}`}>
														{testCases[activeTestCase].actualOutput || '(no output)'}
													</pre>
												</div>
											)}

											<div>
												<p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Expected Output</p>
												<pre className="rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 whitespace-pre-wrap">
													{testCases[activeTestCase].expectedOutput || '(empty)'}
												</pre>
											</div>
										</div>
									) : (
										<div className="flex h-full items-center justify-center">
											<p className="text-sm text-gray-500 dark:text-gray-400">Select a testcase to view details</p>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Editor Footer */}
					<div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
								<FileCode className="h-4 w-4" />
								<span>{language}</span>
							</div>
							<div className="flex gap-2">
								<Button
									onClick={handleRun}
									variant="outline"
									size="sm"
									disabled={isRunning || isSubmitting}
									className="border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
								>
									{isRunning ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Running...
										</>
									) : (
										<>
											<Play className="mr-2 h-4 w-4" />
											Run
										</>
									)}
								</Button>
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting || isRunning}
									size="sm"
									className="bg-gradient-to-r from-blue-600 to-indigo-600 font-medium !text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Submitting...
										</>
									) : (
										<>
											<SendIcon className="mr-2 h-4 w-4" />
											Submit
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Chat sidebar placeholder: when open it floats (fixed) on the right */}
			</div>

			{/* Chat Dock: floating button + sliding sidebar */}
			{isAuth && (
				<>
					{/* Floating dock button */}
					<button
						onClick={() => setIsChatOpen((p) => !p)}
						aria-label={isChatOpen ? 'Close assistant' : 'Open assistant'}
						className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 p-0 shadow-lg hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700"
					>
						<MessageSquare className="h-6 w-6 text-white" />
					</button>

					{/* Overlay (to close when clicking outside) */}
					{isChatOpen && <div onClick={() => setIsChatOpen(false)} className="fixed inset-0 z-40 bg-black/30" />}

					{/* Sliding sidebar */}
					<div
						className={`fixed top-0 right-0 z-50 h-full transition-transform duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
						style={{ width: 420 }}
					>
						<div className="h-full w-[420px]">
							<ChatBot problemId={id} code={src} language={language} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
						</div>
					</div>
				</>
			)}

			{/* Submission Result Dialog */}
			<Dialog open={dialogOpen} onOpenChange={(open) => {
				if (!open) {
					if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
					setIsPolling(false);
				}
				setDialogOpen(open);
			}}>
				<DialogContent className="dark:!border-neutral-800 dark:!bg-neutral-900 max-w-md">
					<DialogHeader>
						<DialogTitle className="dark:text-white">Submission</DialogTitle>
						<DialogDescription>Judging your submission in real-time...</DialogDescription>
					</DialogHeader>

					{/* Polling / Result body */}
					<div className="py-4">
						{isPolling && !submissionResult ? (
							<div className="flex flex-col items-center gap-3 py-6">
								<Loader2 className="h-10 w-10 animate-spin text-blue-500" />
								<p className="text-sm text-gray-500 dark:text-gray-400">Judging... please wait</p>
							</div>
						) : submissionResult ? (
							<div className="space-y-3">
								{/* Status Badge */}
								<div className="flex items-center justify-center">
									<span
										data-status={submissionResult.status}
										className="rounded-full px-5 py-2 text-lg font-bold
											data-[status=AC]:bg-green-100 data-[status=AC]:text-green-700 dark:data-[status=AC]:bg-green-900/30 dark:data-[status=AC]:text-green-400
											data-[status=WA]:bg-red-100 data-[status=WA]:text-red-700 dark:data-[status=WA]:bg-red-900/30 dark:data-[status=WA]:text-red-400
											data-[status=TLE]:bg-yellow-100 data-[status=TLE]:text-yellow-700 dark:data-[status=TLE]:bg-yellow-900/30 dark:data-[status=TLE]:text-yellow-400
											data-[status=MLE]:bg-orange-100 data-[status=MLE]:text-orange-700 dark:data-[status=MLE]:bg-orange-900/30 dark:data-[status=MLE]:text-orange-400
											data-[status=RTE]:bg-purple-100 data-[status=RTE]:text-purple-700 dark:data-[status=RTE]:bg-purple-900/30 dark:data-[status=RTE]:text-purple-400
											data-[status=CE]:bg-gray-100 data-[status=CE]:text-gray-700 dark:data-[status=CE]:bg-gray-900/30 dark:data-[status=CE]:text-gray-400
											data-[status=IE]:bg-gray-100 data-[status=IE]:text-gray-700 dark:data-[status=IE]:bg-gray-900/30 dark:data-[status=IE]:text-gray-400"
									>
										{submissionResult.status}
									</span>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center dark:bg-neutral-800">
									<div>
										<p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
										<p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
											{submissionResult.time != null ? `${submissionResult.time}ms` : '-'}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-500 dark:text-gray-400">Memory</p>
										<p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
											{submissionResult.memory != null ? `${submissionResult.memory}KB` : '-'}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
										<p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
											{submissionResult.point != null ? `${submissionResult.point}p` : '-'}
										</p>
									</div>
								</div>

								{/* Testcase results */}
								{submissionResult.testcase?.length > 0 && (
									<div>
										<p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Test Cases</p>
										<div className="flex flex-wrap gap-1">
											{submissionResult.testcase.map((tc, i) => (
												<span
													key={i}
													title={`Testcase ${i + 1}: ${tc.status}`}
													data-status={tc.status}
													className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold
														data-[status=AC]:bg-green-100 data-[status=AC]:text-green-700 dark:data-[status=AC]:bg-green-900/40 dark:data-[status=AC]:text-green-400
														data-[status=WA]:bg-red-100 data-[status=WA]:text-red-700 dark:data-[status=WA]:bg-red-900/40 dark:data-[status=WA]:text-red-400
														data-[status=TLE]:bg-yellow-100 data-[status=TLE]:text-yellow-700 dark:data-[status=TLE]:bg-yellow-900/40 dark:data-[status=TLE]:text-yellow-400
														data-[status=MLE]:bg-orange-100 data-[status=MLE]:text-orange-700 dark:data-[status=MLE]:bg-orange-900/40 dark:data-[status=MLE]:text-orange-400
														data-[status=RTE]:bg-purple-100 data-[status=RTE]:text-purple-700 dark:data-[status=RTE]:bg-purple-900/40 dark:data-[status=RTE]:text-purple-400
														data-[status=CE]:bg-gray-100 data-[status=CE]:text-gray-600 dark:data-[status=CE]:bg-gray-800 dark:data-[status=CE]:text-gray-400"
												>
													{i + 1}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Error message */}
								{submissionResult.msg && (
									<div className="mt-2">
										{(() => {
											const msg = submissionResult.msg;
											if (typeof msg === 'object' && msg.compiler) {
												return (
													<div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
														<p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">Compilation Error:</p>
														<pre className="whitespace-pre-wrap font-mono text-xs text-red-600 dark:text-red-300">
															{msg.compiler}
														</pre>
													</div>
												);
											}
											if (typeof msg === 'object' && msg.server) {
												return (
													<div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
														<p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">System Error:</p>
														<pre className="whitespace-pre-wrap font-mono text-xs text-red-600 dark:text-red-300">
															{msg.server}
														</pre>
													</div>
												);
											}
											return (
												<div className="rounded border border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
													<pre className="whitespace-pre-wrap font-mono text-xs text-gray-600 dark:text-gray-400">
														{typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg}
													</pre>
												</div>
											);
										})()}
									</div>
								)}
							</div>
						) : (
							<p className="text-center text-sm text-gray-500 dark:text-gray-400">Queued...</p>
						)}
					</div>

					<DialogFooter className="sm:justify-start">
						<Button
							type="button"
							variant="secondary"
							className="capitalize dark:!bg-neutral-800 dark:hover:!bg-neutral-700"
							onClick={() => setDialogOpen(false)}
						>
							Close
						</Button>
						<Button
							asChild
							type="button"
							variant="secondary"
							className="bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:!from-sky-300 hover:!to-blue-400"
						>
							<Link to={routesConfig.submission.replace(':id', submission?._id)}>View Details</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ProblemSolve;
