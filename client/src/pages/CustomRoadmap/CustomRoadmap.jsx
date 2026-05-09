import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, Terminal, Zap, ShieldCheck, CheckCircle, 
    Loader2, Sparkles, Navigation, Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateRoadmap, getMyRoadmaps, getRoadmapById, completeRoadmapNode } from '~/services/customRoadmap';
import routesConfig from '~/config/routes';

const TypewriterText = ({ text, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayedText(text.substring(0, i));
                i++;
                if (i > text.length) clearInterval(interval);
            }, 30);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);

    return <span>{displayedText}<span className="animate-pulse bg-blue-500 w-2 h-4 inline-block align-middle ml-1"></span></span>;
};

const CustomRoadmap = () => {
    const [roadmaps, setRoadmaps] = useState([]);
    const [selectedRoadmap, setSelectedRoadmap] = useState(null);
    const [goalInput, setGoalInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoadmaps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadRoadmaps = async () => {
        try {
            setLoading(true);
            const res = await getMyRoadmaps();
            if (res.success) {
                setRoadmaps(res.roadmaps);
                if (res.roadmaps.length > 0 && !selectedRoadmap) {
                    handleSelectRoadmap(res.roadmaps[0]._id);
                }
            }
        } catch (err) {
            toast.error('Failed to load neural paths.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!goalInput.trim()) {
            toast.warning('Objective parameter required.');
            return;
        }
        try {
            setIsGenerating(true);
            setSelectedRoadmap(null);
            const res = await generateRoadmap(goalInput);
            if (res.success) {
                toast.success('Neural trajectory established.');
                setGoalInput('');
                await loadRoadmaps();
                handleSelectRoadmap(res.roadmap._id);
            }
        } catch (err) {
            toast.error('Failed to compile trajectory.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectRoadmap = async (id) => {
        try {
            const res = await getRoadmapById(id);
            if (res.success) {
                setSelectedRoadmap(res.roadmap);
            }
        } catch (err) {
            toast.error('Data corruption in selected path.');
        }
    };

    const handleMarkComplete = async (nodeId) => {
        if (!selectedRoadmap) return;
        try {
            const res = await completeRoadmapNode(selectedRoadmap._id, nodeId);
            if (res.success) {
                setSelectedRoadmap(res.roadmap);
                toast.success('Node synchronized.');
            }
        } catch (err) {
            toast.error('Failed to synchronize node.');
        }
    };

    return (
        <div className="relative min-h-[85vh] py-10 px-4 md:px-6 w-full max-w-full bg-zinc-950 overflow-x-hidden text-zinc-100 font-sans">
            {/* Cyberpunk Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col xl:flex-row gap-8">
                
                {/* Left Sidebar - Saved Paths */}
                <div className="xl:w-80 shrink-0 flex flex-col gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Navigation className="text-blue-500" size={24} />
                            <h2 className="text-xl font-black text-white tracking-tight uppercase animate-pulse neural-flicker">Neural Paths</h2>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                            {loading ? (
                                <div className="text-zinc-500 text-sm animate-pulse">Loading paths...</div>
                            ) : roadmaps.length === 0 ? (
                                <div className="text-zinc-500 text-sm">No paths established.</div>
                            ) : (
                                roadmaps.map(rm => (
                                    <button
                                        key={rm._id}
                                        onClick={() => handleSelectRoadmap(rm._id)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                                            selectedRoadmap?._id === rm._id 
                                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                                        }`}
                                    >
                                        <h3 className={`font-bold truncate mb-1 ${selectedRoadmap?._id === rm._id ? 'text-blue-400' : 'text-zinc-300'}`}>{rm.title}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">{rm.goal}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                         <div className="space-y-4">
                             <div className="flex items-center gap-2 mb-2">
                                 <Terminal className="text-purple-500" size={18} />
                                 <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">New Objective</span>
                             </div>
                             <textarea
                                 value={goalInput}
                                 onChange={(e) => setGoalInput(e.target.value)}
                                 placeholder="Enter learning objective (e.g. Master DP for FAANG)..."
                                 className="w-full bg-zinc-950 border border-purple-500/30 rounded-xl p-4 text-sm font-mono text-blue-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none resize-none h-24 placeholder:text-zinc-700 shadow-[0_0_20px_rgba(139,92,246,0.2)] focus:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all"
                                 disabled={isGenerating}
                             />
                             <button
                                 onClick={handleGenerate}
                                 disabled={isGenerating || !goalInput.trim()}
                                 className={`w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 ${isGenerating ? 'animate-pulse' : ''}`}
                             >
                                 {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                 {isGenerating ? 'Compiling...' : 'Initialize Path'}
                             </button>
                        </div>
                    </div>
                </div>

                {/* Main View - Timeline */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div 
                                key="generating"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full min-h-[60vh] flex flex-col items-center justify-center border border-blue-500/20 bg-blue-950/10 rounded-[2.5rem] p-10 backdrop-blur-sm"
                            >
                                <Cpu className="text-blue-500 w-24 h-24 mb-8 animate-[spin_10s_linear_infinite]" strokeWidth={1} />
                                <div className="text-center space-y-4 font-mono text-sm text-blue-400">
                                    <p><TypewriterText text="[SYSTEM] Analyzing objective parameters..." delay={0} /></p>
                                    <p><TypewriterText text="[NEURAL] Mapping nodes to existing knowledge base..." delay={1500} /></p>
                                    <p><TypewriterText text="[AI] Compiling optimal learning trajectory..." delay={3000} /></p>
                                </div>
                            </motion.div>
                        ) : selectedRoadmap ? (
                            <motion.div 
                                key="roadmap"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <ShieldCheck size={200} />
                                </div>
                                
                                <div className="mb-12 relative z-10">
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
                                        {selectedRoadmap.title}
                                    </h1>
                                    <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">
                                        {selectedRoadmap.description}
                                    </p>
                                </div>

                                <div className="relative z-10 pl-4 md:pl-8">
                                    {/* The glowing vertical line */}
                                    <div className="absolute left-[31px] md:left-[47px] top-4 bottom-4 w-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] transition-all duration-1000" 
                                            style={{ height: `${(selectedRoadmap.nodes.filter(n => n.status === 'completed').length / selectedRoadmap.nodes.length) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="space-y-12 relative">
                                        {selectedRoadmap.nodes.map((node, idx) => {
                                            const isCompleted = node.status === 'completed';
                                            const isUnlocked = node.status === 'unlocked' || isCompleted;
                                            const isActive = node.status === 'unlocked';
                                            
                                            return (
                                                <motion.div 
                                                    key={node._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className={`relative flex gap-6 md:gap-10 ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}
                                                >
                                                    {/* Node Icon */}
                                                    <div className="relative shrink-0 mt-1">
                                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center z-10 relative bg-zinc-950 transition-all duration-500 ${
                                                            isCompleted ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                                                            isActive ? 'border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : 
                                                            'border-zinc-700 text-zinc-600'
                                                        }`}>
                                                            {isCompleted ? <CheckCircle size={20} /> : <span className="font-black text-sm">{node.stepNumber}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Node Content */}
                                                    <div className={`flex-1 bg-zinc-950/50 backdrop-blur-md border rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                                                        isActive ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-zinc-800/50 hover:border-zinc-700'
                                                    }`}>
                                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                            <div>
                                                                <h3 className={`text-2xl font-black tracking-tight mb-2 ${isActive ? 'text-blue-400' : 'text-zinc-200'}`}>
                                                                    {node.title}
                                                                </h3>
                                                                <p className="text-zinc-400 leading-relaxed text-sm">
                                                                    {node.description}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                                {node.linkedTopic && (
                                                                    <Link 
                                                                        to={routesConfig.roadmapTopic.replace(':topicId', node.linkedTopic._id || node.linkedTopic)}
                                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                                            isUnlocked ? 'bg-zinc-800 text-blue-400 hover:bg-blue-500 hover:text-white border border-zinc-700 hover:border-blue-500' : 'bg-zinc-900 text-zinc-600 border border-zinc-800 pointer-events-none'
                                                                        }`}
                                                                    >
                                                                        <LinkIcon size={14} /> View Topic
                                                                    </Link>
                                                                )}
                                                                
                                                                {isActive && (
                                                                    <button
                                                                        onClick={() => handleMarkComplete(node._id)}
                                                                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95"
                                                                    >
                                                                        Mark Complete <Sparkles size={14} />
                                                                    </button>
                                                                )}
                                                                
                                                                {isCompleted && (
                                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-widest">
                                                                        <CheckCircle size={14} /> Synchronized
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-10 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem]"
                            >
                                <Sparkles className="text-zinc-700 w-24 h-24 mb-6" strokeWidth={1} />
                                <h2 className="text-2xl font-black text-zinc-500 tracking-tight uppercase">Awaiting Directives</h2>
                                <p className="text-zinc-600 max-w-md mx-auto mt-4">Input a learning objective in the terminal to compile a customized neural path.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CustomRoadmap;