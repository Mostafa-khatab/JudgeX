import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Layout, ChevronRight, Target, Zap, Cpu } from 'lucide-react';
import { getMyRoadmaps } from '~/services/customRoadmap';

const CustomRoadmapDashboard = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyRoadmaps();
        if (data.success) setRoadmaps(data.roadmaps);
      } catch (e) {
        console.error('Failed to load custom roadmaps', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={48} strokeWidth={3} />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse"></div>
        </div>
        <span className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs">Accessing Neural Core</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Sparkles className="text-white" size={16} fill="currentColor" />
            </div>
            <span className="text-[10px] md:text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Personal Archive</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
            Neural <span className="text-blue-500">Trajectories</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl">
            Manage your custom learning paths and track your evolution through the neural grid.
          </p>
        </div>
      </div>

      {!roadmaps.length ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-zinc-900/30 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-zinc-800">
           <Layout className="text-zinc-700 mb-6 size-12 md:size-16" strokeWidth={1} />
           <p className="text-zinc-500 font-black uppercase tracking-widest text-xs md:text-sm text-center px-4">
             No saved trajectories found in this sector.<br/>
             <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/home?tab=roadmap')}>Initialize New Generation</span>
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {roadmaps.map((rm, idx) => {
            const completedCount = rm.nodes?.filter(n => n.status === 'completed').length || 0;
            const totalNodes = rm.nodes?.length || 1;
            const progressPct = Math.round((completedCount / totalNodes) * 100);
            
            return (
              <motion.div
                key={rm._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/roadmaps/${rm._id}`)}
                className="group relative cursor-pointer"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="relative bg-[#0d0d0e] border-2 border-zinc-800/50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 h-full flex flex-col transition-all duration-500 group-hover:border-blue-500/50 group-hover:bg-zinc-900/40 group-hover:-translate-y-2 shadow-2xl">
                  
                  {/* Card Icon */}
                  <div className="mb-6 md:mb-8 flex justify-between items-start">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-blue-500/30 group-hover:bg-blue-600/10 transition-colors">
                      <Cpu className="text-zinc-500 group-hover:text-blue-400 transition-colors size-6 md:size-8" />
                    </div>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-zinc-950 border border-zinc-800 group-hover:border-emerald-500/30">
                      <Zap className={`size-3 ${progressPct === 100 ? 'text-emerald-500' : 'text-blue-500'} animate-pulse`} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{progressPct}% Sync</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3 md:space-y-4">
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors leading-tight">
                      {rm.title}
                    </h3>
                    <p className="text-zinc-500 line-clamp-3 leading-relaxed font-medium text-sm md:text-base">
                      {rm.description}
                    </p>
                  </div>

                  {/* Progress Bar Footer */}
                  <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-zinc-800/50 space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                      <span>Neural Evolution</span>
                      <span className="text-zinc-300">{completedCount}/{totalNodes} Steps</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${progressPct === 100 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-blue-600 shadow-[0_0_15px_#2563eb]'}`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px] pt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      Initialize Path <ChevronRight size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomRoadmapDashboard;