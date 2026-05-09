import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, Activity, Zap, Target, Lightbulb, 
    Languages, ArrowRight, Code, Cpu, ShieldCheck, 
    X, Send, Copy, RotateCcw, ChevronLeft, Terminal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { toast } from 'react-toastify';
import { sendChatMessage } from '~/services/chatbot';

const TOOLS = [
    {
        id: 'complexity',
        title: 'Complexity Analyzer',
        description: 'Advanced algorithmic depth analysis for time and space complexity.',
        icon: Activity,
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(14,165,233,0.8)]',
        glowColor: 'shadow-sky-500',
        prompt: 'Analyze the time and space complexity of the following code. Provide the Big O notation and a brief explanation.'
    },
    {
        id: 'optimizer',
        title: 'Code Optimizer',
        description: 'AI-driven refactoring for peak performance and idiomatic cleanliness.',
        icon: Zap,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(99,102,241,0.8)]',
        glowColor: 'shadow-indigo-500',
        prompt: 'Optimize the following code for better performance and readability. Keep the core logic the same.'
    },
    {
        id: 'edgecases',
        title: 'Edge Case Hunter',
        description: 'Stress-test your logic with automatically generated adversarial inputs.',
        icon: Target,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(244,63,94,0.8)]',
        glowColor: 'shadow-rose-500',
        prompt: 'Generate 5 critical edge cases for the following problem description or code that might lead to failure.'
    },
    {
        id: 'consultant',
        title: 'Algo Consultant',
        description: 'Strategic hints and architectural guidance for difficult problems.',
        icon: Lightbulb,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(16,185,129,0.8)]',
        glowColor: 'shadow-emerald-500',
        prompt: 'I am stuck on this problem. Can you give me a progressive hint? Do not give me the full solution yet.'
    },
    {
        id: 'translator',
        title: 'Code Translator',
        description: 'Seamless cross-language logic migration with context preservation.',
        icon: Languages,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(245,158,11,0.8)]',
        glowColor: 'shadow-amber-500',
        prompt: 'Translate the following code to the target language specified. Ensure idiomatic correctness.'
    },
    {
        id: 'roadmap',
        title: 'Neural Path',
        description: 'Generate customized learning trajectories for your coding objectives.',
        icon: Target,
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        dropShadow: 'drop-shadow-[0_0_18px_rgba(217,70,239,0.8)]',
        glowColor: 'shadow-fuchsia-500',
        isRoute: true,
        route: '/roadmap?action=generate'
    }
];

const scrollbarStyles = "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full";

const AILab = () => {
    const navigate = useNavigate();
    const [selectedTool, setSelectedTool] = useState(null);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRunTool = async () => {
        if (!input.trim()) {
            toast.warning('Input required for analysis');
            return;
        }

        try {
            setLoading(true);
            setOutput('');
            const message = `${selectedTool.prompt}\n\nInput:\n${input}`;
            const res = await sendChatMessage({ message });
            setOutput(res.reply || res.message || 'The AI lab is currently recalibrating. Try again.');
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.msg || 'Laboratory connection unstable. Try again.';
            toast.error(errMsg);
            console.error('AI Lab Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const ToolCard = ({ tool }) => (
        <motion.div
            layoutId={tool.id}
            onClick={() => {
                if (tool.isRoute) {
                    navigate(tool.route);
                } else {
                    setSelectedTool(tool);
                }
            }}
            className="group relative cursor-pointer h-full"
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
        >
            <div className={`absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl blur-2xl ${tool.color}`}></div>
            <div className="relative flex flex-col h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-sm group-hover:shadow-2xl transition-all group-hover:border-zinc-300 dark:group-hover:border-zinc-700">
                
                {/* Neon Icon */}
                <div className="mb-10 mt-2 relative inline-flex items-center justify-start">
                    <div className={`absolute bg-current opacity-20 blur-xl w-14 h-14 rounded-full ${tool.color}`}></div>
                    <tool.icon className={`relative z-10 w-14 h-14 ${tool.color} ${tool.dropShadow} transition-all duration-300 group-hover:scale-110`} strokeWidth={1.5} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">{tool.title}</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-10 flex-1">
                    {tool.description}
                </p>
                
                <div className={`mt-auto flex items-center text-sm font-bold text-zinc-400 group-hover:${tool.color} transition-colors duration-300`}>
                    <span className="relative">
                        Explore Engine
                        <span className={`absolute -bottom-1 left-0 w-0 h-[2px] bg-current transition-all duration-300 group-hover:w-full ${tool.color}`}></span>
                    </span>
                    <ArrowRight size={18} className="ml-3 group-hover:translate-x-3 transition-transform duration-300" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="relative min-h-[80vh] py-8 md:py-16 px-4 md:px-6 w-full max-w-full bg-zinc-50/50 dark:bg-[#09090b]/50 overflow-x-hidden">
            {/* High-Tech Background Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-50 dark:to-[#09090b]"></div>
            </div>

            <div className="relative z-10 w-full h-full">
                <AnimatePresence mode="wait">
                    {!selectedTool ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            key="dashboard"
                            className="w-full"
                        >
                            {/* Header Section */}
                            <div className="text-center mb-12 md:mb-24 space-y-4 md:space-y-6 max-w-4xl mx-auto">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    Neural Laboratory v4.2
                                </motion.div>
                                <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                    Think <span className="italic font-serif text-blue-600 dark:text-blue-500">Beyond</span> Human.
                                </h1>
                                <p className="text-gray-500 dark:text-zinc-400 text-sm md:text-xl font-medium leading-relaxed max-w-2xl mx-auto px-4">
                                    State-of-the-art neural tools designed for the next generation of competitive programmers.
                                </p>
                            </div>

                            {/* Full Width Tool Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 w-full max-w-[1600px] mx-auto pb-20">
                                {TOOLS.map((tool) => (
                                    <ToolCard key={tool.id} tool={tool} />
                                ))}
                            </div>

                            {/* Footer Capabilities */}
                            <div className="mt-12 md:mt-28 pt-12 border-t border-gray-200/50 dark:border-zinc-800/50 grid grid-cols-1 md:grid-cols-3 gap-8 text-center w-full max-w-7xl mx-auto opacity-60">
                                <div className="space-y-2">
                                    <Cpu className="mx-auto text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" size={24} strokeWidth={1.5} />
                                    <div className="text-[10px] font-black uppercase tracking-widest dark:text-white">Low Latency</div>
                                </div>
                                <div className="space-y-2">
                                    <ShieldCheck className="mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" size={24} strokeWidth={1.5} />
                                    <div className="text-[10px] font-black uppercase tracking-widest dark:text-white">Precision Mode</div>
                                </div>
                                <div className="space-y-2">
                                    <Terminal className="mx-auto text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" size={24} strokeWidth={1.5} />
                                    <div className="text-[10px] font-black uppercase tracking-widest dark:text-white">Language Agnostic</div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            key="tool-view"
                            className="w-full flex flex-col min-h-[80vh] pb-20"
                        >
                            <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 rounded-3xl md:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] flex flex-col flex-1 overflow-hidden relative">
                                
                                {/* Tool Header - Sticky */}
                                <div className="px-4 md:px-10 py-4 md:py-6 border-b border-gray-100 dark:border-zinc-800/50 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shrink-0 sticky top-0 z-20">
                                    <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
                                        <button 
                                            onClick={() => { setSelectedTool(null); setOutput(''); setInput(''); }}
                                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl md:rounded-2xl transition-all active:scale-95 shrink-0"
                                        >
                                            <ChevronLeft size={20} className="md:size-6" />
                                        </button>
                                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-zinc-100 dark:bg-zinc-950/50 flex items-center justify-center shadow-inner border border-gray-200/50 dark:border-zinc-800/50 shrink-0`}>
                                            <selectedTool.icon className={`${selectedTool.color} ${selectedTool.dropShadow} size-5 md:size-7`} strokeWidth={1.5} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                                                {selectedTool.title}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse bg-current ${selectedTool.color}`}></div>
                                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Neural Session</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedTool(null); setOutput(''); setInput(''); }}
                                        className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0"
                                    >
                                        <X size={20} className="md:size-6" />
                                    </button>
                                </div>

                                {/* 2-Column Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-[500px]">
                                    
                                    {/* Input Panel */}
                                    <div className="p-4 md:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800 flex flex-col bg-white/50 dark:bg-zinc-900/50 min-h-[350px] md:min-h-[400px] lg:min-h-full">
                                        <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Code size={16} className="text-blue-500" />
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Source Input</span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setInput('')}
                                                className="text-gray-400 hover:text-blue-500 h-7 text-[9px] uppercase font-black"
                                            >
                                                <RotateCcw size={10} className="mr-1.5" /> Clear
                                            </Button>
                                        </div>
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Paste your source code or technical problem description here..."
                                            className={`flex-1 w-full bg-zinc-50 dark:bg-zinc-950 border border-gray-200/50 dark:border-zinc-800/50 rounded-2xl md:rounded-3xl p-4 md:p-6 text-xs md:text-sm font-mono text-gray-800 dark:text-zinc-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-zinc-700 overflow-y-auto ${scrollbarStyles}`}
                                        ></textarea>
                                        <Button 
                                            onClick={handleRunTool}
                                            disabled={loading}
                                            className="mt-6 md:mt-8 h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform shrink-0"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <Send size={16} /> Initiate Analysis
                                                </div>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Output Panel */}
                                    <div className="p-4 md:p-10 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col min-h-[350px] md:min-h-[400px] lg:min-h-full">
                                        <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Cpu size={16} className="text-purple-500" />
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Neural Result</span>
                                            </div>
                                            {output && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(output);
                                                        toast.success('Result secured to clipboard');
                                                    }}
                                                    className="text-blue-600 dark:text-blue-400 h-7 text-[9px] uppercase font-black"
                                                >
                                                    <Copy size={10} className="mr-1.5" /> Copy
                                                </Button>
                                            )}
                                        </div>
                                        <div className={`flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-4 md:p-8 pb-12 md:pb-16 overflow-y-auto relative shadow-sm ${scrollbarStyles}`}>
                                            {!output && !loading && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-800 space-y-4 px-6 text-center">
                                                    <Bot className="size-16 md:size-20" strokeWidth={1} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Awaiting input for computation...</p>
                                                </div>
                                            )}
                                            {loading && (
                                                <div className="space-y-4 md:space-y-6">
                                                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-3/4"></div>
                                                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-1/2"></div>
                                                    <div className="h-24 md:h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl md:rounded-3xl animate-pulse"></div>
                                                </div>
                                            )}
                                            {output && (
                                                <div className="text-xs md:text-sm text-gray-700 dark:text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in duration-700">
                                                    {output}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AILab;