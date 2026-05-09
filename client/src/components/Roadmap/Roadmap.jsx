import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTopics } from '~/services/topic';
import { Button } from '~/components/ui/button';
import { CheckCircle, Loader2, Zap, Sparkles } from 'lucide-react';
import { RoadmapNode } from './RoadmapNode';
import { verifyRoadmapProblem } from '~/services/user';
import { Skeleton } from '~/components/ui/skeleton';
import useAuthStore from '~/stores/authStore';
import { generateRoadmap } from '~/services/customRoadmap';

const Roadmap = () => {
	const { user } = useAuthStore();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [nodes, setNodes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [customGoal, setCustomGoal] = useState('');
	const [customRoadmap, setCustomRoadmap] = useState(null);
	const [generating, setGenerating] = useState(false);
	
	const inputRef = useRef(null);

	useEffect(() => {
		if (searchParams.get('action') === 'generate' && inputRef.current) {
			inputRef.current.focus();
		}
	}, [searchParams]);

	useEffect(() => {
		const fetchRoadmapData = async () => {
			try {
				setLoading(true);
				const res = await getTopics();
				const topics = Array.isArray(res?.data) ? res.data : [];

				const rp = user?.roadmapProgress || {};
				const unlocked = Array.isArray(rp.unlockedTopicIds) ? rp.unlockedTopicIds : [];
				const completed = Array.isArray(rp.completedTopicIds) ? rp.completedTopicIds : [];
				const topicProgress = rp.topicProgress || {};

				const mapped = topics.map((t) => {
					const isCompleted = completed.includes(t.topicId);
					const isUnlocked = isCompleted || unlocked.includes(t.topicId) || (unlocked.length === 0 && t.order === 0);

					const tp = topicProgress?.[t.topicId] || topicProgress?.get?.(t.topicId) || {};
					const quizzesCount = Array.isArray(t.quizzes) ? t.quizzes.length : 0;
					const totalSteps = 1 + quizzesCount + 1;
					const denom = Math.max(1, totalSteps - 1);
					const step = typeof tp.currentStep === 'number' ? tp.currentStep : 0;
					const progressPct = isCompleted ? 100 : isUnlocked ? Math.min(100, Math.floor((step / denom) * 100)) : 0;
					const isProblemStep = step === totalSteps - 1;
					const linked = Array.isArray(t.linkedProblems) ? t.linkedProblems[0] : null;
					const linkedProblemId = linked?.id;

					return {
						id: t.topicId,
						topicId: t.topicId,
						title: t.title,
						description: t.description,
						status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
						type: 'topic',
						progress: progressPct,
						showVerify: Boolean(isUnlocked && !isCompleted && isProblemStep && linkedProblemId),
						linkedProblemId,
					};
				});

				setNodes(mapped);
			} catch (error) {
				console.error('Failed to fetch roadmap data:', error);
			} finally {
				setLoading(false);
			}
		};

    fetchRoadmapData();
  }, [user]);

	const handleNodeClick = (node) => {
		if (!node?.topicId) return;
		navigate(`/roadmap/${node.topicId}`);
	};

	const handleVerify = async (node) => {
		try {
			if (!node?.topicId || !node?.linkedProblemId) return;
			const res = await verifyRoadmapProblem({ topicId: node.topicId, problemId: node.linkedProblemId });
			if (res?.data?.accepted) {
				toast.success('Accepted submission found. Topic completed and next topic unlocked.');
			} else {
				toast.error('No accepted submission found yet.');
			}
		} catch {
			toast.error('Failed to verify completion');
		}
	};

  const nodeHeight = 240; // Approximate height per node block + margin
  const svgHeight = nodes.length * nodeHeight;

  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const overallProgress = nodes.length > 0 ? completedCount / nodes.length : 0;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [customGoal]);

  if (loading) {
    return (
      <div className="py-20 px-4 max-w-5xl mx-auto flex flex-col items-center space-y-16">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="w-full max-w-2xl h-40 rounded-xl" />
        ))}
      </div>
    );
  }


	return (
    <div className="relative py-16 px-4 w-full max-w-full mx-auto flex flex-col items-center justify-center overflow-visible">
		<div className="w-full max-w-full px-4 mx-auto mb-12 p-8 bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-800 z-10 shadow-2xl">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
					Neural Path Generator <span className="text-blue-500 text-xs not-italic ml-2">v2.0</span>
				</h2>
				<Button
					onClick={() => navigate('/roadmaps')}
					className="flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 font-black uppercase tracking-widest px-6 py-3 rounded-2xl border border-blue-500/30 transition-all active:scale-95 shadow-lg shadow-blue-500/10"
				>
					<Sparkles size={18} />
					My Saved Paths
				</Button>
			</div>
			<div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
				<textarea
					ref={inputRef}
					value={customGoal}
					onChange={e => setCustomGoal(e.target.value)}
					placeholder="Describe your learning mission (e.g., 'Master Neural Networks with PyTorch from scratch')..."
					className="flex-1 w-full bg-zinc-950/50 text-white border border-zinc-800 rounded-2xl p-4 resize-none min-h-[96px] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-zinc-600 font-medium overflow-hidden shadow-inner"
				/>
				<div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
					<Button
						onClick={async () => {
							if (!customGoal.trim()) return toast.warning('Goal required');
							setGenerating(true);
							try {
								const res = await generateRoadmap(customGoal);
								if (res?.success && res.roadmap) {
									setCustomRoadmap(res.roadmap);
									toast.success('Neural path generated. Initializing trajectory...');
									setTimeout(() => navigate(`/roadmaps/${res.roadmap._id}`), 1500);
								}
							} catch (e) {
								toast.error('Generation failed');
							} finally {
								setGenerating(false);
							}
						}}
						disabled={generating}
						className="flex-1 md:w-48 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest px-6 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95"
					>
						{generating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
						{generating ? 'Processing...' : 'Generate'}
					</Button>
				</div>
			</div>
		</div>

      {customRoadmap && (
        <div className="w-full max-w-4xl mx-auto mb-12 p-8 bg-zinc-950/90 backdrop-blur-2xl rounded-3xl border border-zinc-800 z-10">
          <h2 className="text-2xl font-black text-white mb-6">Your Neural Path</h2>
          <div className="relative pl-8 md:pl-12">
            <div className="absolute left-[31px] md:left-[47px] top-4 bottom-4 w-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-full bg-blue-500 transition-all duration-1000" style={{ height: `${(customRoadmap.nodes.filter(n => n.status === 'completed').length / customRoadmap.nodes.length) * 100}%` }}></div>
            </div>
            <div className="space-y-12">
              {customRoadmap.nodes.map((node, idx) => {
                const isCompleted = node.status === 'completed';
                const isActive = node.status === 'unlocked';
                return (
                  <motion.div key={node._id || idx} className={`relative flex gap-6 md:gap-10 ${!isActive && !isCompleted ? 'opacity-40 grayscale' : ''}`}> 
                    <div className="relative shrink-0 mt-1">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center bg-zinc-950 transition-all duration-500 ${isCompleted ? 'border-emerald-500 text-emerald-500' : isActive ? 'border-blue-500 text-blue-500' : 'border-zinc-700 text-zinc-600'}`}> 
                        {isCompleted ? <CheckCircle size={20} /> : <span className="font-black text-sm">{node.stepNumber}</span>}
                      </div>
                    </div>
                    <div className={`flex-1 bg-zinc-950/50 border rounded-3xl p-6 md:p-8 ${isActive ? 'border-blue-500/40' : 'border-zinc-800/50'} transition-all`}> 
                      <h3 className={`text-2xl font-black ${isActive ? 'text-blue-400' : 'text-zinc-200'}`}>{node.title}</h3>
                      <p className="text-zinc-400 text-sm">{node.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced SVG Winding Path */}
      <div className="absolute top-[250px] bottom-0 left-1/2 transform -translate-x-1/2 w-[300px] md:w-[600px] z-0 pointer-events-none" style={{ minHeight: svgHeight }}>
        <svg 
          className="w-full h-full" 
          viewBox={`0 0 600 ${svgHeight}`}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Background Path (Dashed) */}
          <motion.path
            d={`M 300 80 
                ${nodes.map((_, i) => {
                  if (i === 0) return '';
                  const y = (i * nodeHeight) + 80;
                  const prevY = ((i - 1) * nodeHeight) + 80;
                  const midY = (y + prevY) / 2;
                  const xOffset = i % 2 === 0 ? 150 : 450;
                  const prevXOffset = (i - 1) % 2 === 0 ? 150 : 450;
                  
                  // Create a smooth bezier curve between points
                  return `C ${prevXOffset} ${midY}, ${xOffset} ${midY}, ${xOffset} ${y}`;
                }).join(' ')}`}
            fill="transparent"
            stroke="url(#roadmapGradient)"
            strokeWidth="8"
            strokeDasharray="16 16"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Foreground Path (Solid representing progress) */}
          <motion.path
            d={`M 300 80 
                ${nodes.map((_, i) => {
                  if (i === 0) return '';
                  const y = (i * nodeHeight) + 80;
                  const prevY = ((i - 1) * nodeHeight) + 80;
                  const midY = (y + prevY) / 2;
                  const xOffset = i % 2 === 0 ? 150 : 450;
                  const prevXOffset = (i - 1) % 2 === 0 ? 150 : 450;
                  
                  return `C ${prevXOffset} ${midY}, ${xOffset} ${midY}, ${xOffset} ${y}`;
                }).join(' ')}`}
            fill="transparent"
            stroke="url(#completedGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: overallProgress }} // Animate dynamically based on completed nodes
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </div>
      
      {/* Nodes mapping */}
		<div className="relative z-10 w-full mt-4 flex flex-col max-w-4xl mx-auto" style={{ gap: '0px' }}>
			{nodes.map((node, index) => (
				<RoadmapNode
					key={node.id}
					node={node}
					isLeft={index % 2 === 0}
					onClick={handleNodeClick}
					onVerify={handleVerify}
				/>
			))}
		</div>
	</div>
	);
};

export default Roadmap;