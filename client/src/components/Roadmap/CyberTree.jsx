import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Code, GraduationCap, CheckCircle, Lock, Sparkles } from 'lucide-react';

const nodeWidth = 550;
const nodeHeight = 340;
const verticalSpacing = 400;

const CyberNode = ({ data }) => {
  const { title, description, status, type } = data;
  
  const isCurrent = status === 'unlocked';
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';

  const TypeIcon = type === 'Video' ? PlayCircle : type === 'Problem' ? Code : GraduationCap;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-12 rounded-[2.5rem] border-2 bg-[#0d0d0e] backdrop-blur-xl transition-all duration-700 hover:scale-[1.02] group overflow-visible relative shadow-2xl ${isCompleted ? 'border-emerald-500/40' : isCurrent ? 'border-blue-500/40' : 'border-white/5'}`}
      style={{ width: nodeWidth, minHeight: nodeHeight }}
    >
      
      {/* Topic Badge */}
      <div className="absolute -top-4 left-8 bg-[#1e293b] border border-blue-500/30 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Topic</span>
      </div>

      {/* Floating Status Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
        {isCompleted ? (
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)] border-4 border-emerald-400/50 scale-110 transition-transform duration-500 group-hover:scale-125">
            <CheckCircle size={48} className="text-white" strokeWidth={3} />
          </div>
        ) : isLocked ? (
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)] border-4 border-zinc-700">
            <Lock size={48} className="text-zinc-500" strokeWidth={3} />
          </div>
        ) : null}
      </div>

      <div className={`relative z-10 ${!isLocked && !isCompleted ? '' : 'opacity-40 grayscale-[0.5]'}`}>
        <h3 className="font-black text-4xl tracking-tighter text-white mb-4 leading-tight">{title}</h3>
        <p className="text-xl text-zinc-400 leading-relaxed line-clamp-2 font-medium mb-10">{description}</p>
        
        {/* Progress Bar Section */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">
              {isCompleted ? 'Mastered' : 'Progress'}
            </span>
            <span className="text-sm font-black font-mono text-white">
              {isCompleted ? '100%' : '0%'}
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-950/80 rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : isCurrent ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-zinc-800'}`}
              style={{ width: isCompleted ? '100%' : data.isVideoWatched ? '50%' : isCurrent ? '10%' : '0%' }}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CyberTree = ({ nodes, onNodeClick }) => {
  const pathData = useMemo(() => {
    if (!nodes || nodes.length < 2) return '';
    
    // The vertical distance between centers in a flex-col with gap is (nodeHeight + gap)
    const centerOffset = 100; // Initial padding-top
    const stepY = nodeHeight + verticalSpacing;
    
    let d = `M ${0 % 2 === 0 ? 100 : 500} ${centerOffset + nodeHeight / 2}`; 
    
    for (let i = 1; i < nodes.length; i++) {
      const prevX = (i - 1) % 2 === 0 ? 100 : 500;
      const currX = i % 2 === 0 ? 100 : 500;
      const prevY = (i - 1) * stepY + centerOffset + nodeHeight / 2;
      const currY = i * stepY + centerOffset + nodeHeight / 2;
      
      const cp1y = prevY + stepY / 2;
      const cp2y = currY - stepY / 2;
      d += ` C ${prevX} ${cp1y}, ${currX} ${cp2y}, ${currX} ${currY}`;
    }
    return d;
  }, [nodes]);

  return (
    <div className="relative w-full bg-[#0a0a0a] min-h-screen overflow-hidden flex flex-col items-center" style={{ paddingTop: '100px', paddingBottom: '200px' }}>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] z-0 pointer-events-none overflow-visible" style={{ height: `${nodes.length * (nodeHeight + verticalSpacing)}px` }}>
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="20" strokeLinecap="round" className="opacity-20 blur-xl" />
        <path d={pathData} fill="none" stroke="url(#pathGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="20, 10" className="opacity-40" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-[400px]">
        {nodes.map((node, index) => {
          const isEven = index % 2 === 0;
          return (
            <div 
              key={node._id || index}
              onClick={() => onNodeClick(node)}
              className="cursor-pointer"
              style={{
                transform: `translateX(${isEven ? '-200px' : '200px'})`
              }}
            >
              <CyberNode data={node} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CyberTree;
