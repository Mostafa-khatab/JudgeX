import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, PlayCircle, X, Sparkles, BookOpen, GraduationCap, Loader2, Code, RotateCcw } from 'lucide-react';
import { updateNodeProgress } from '~/services/customRoadmap';

const NodeDetailDrawer = ({ node, onClose, roadmapId, refresh }) => {
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'problems', 'quiz'
  const [quizStates, setQuizStates] = useState({}); // { [index]: { selected, submitted } }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node.isQuizPassed && node.quizzes) {
      const initial = {};
      node.quizzes.forEach((q, i) => {
        initial[i] = { selected: q.correctAnswerIndex, submitted: true };
      });
      setQuizStates(initial);
    }
  }, [node.isQuizPassed, node.quizzes]);

  const handleMarkVideoWatched = async () => {
    setLoading(true);
    try {
      await updateNodeProgress(roadmapId, node.nodeId || node._id, { isVideoWatched: true });
      await refresh(node.nodeId || node._id);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmitQuiz = async (quizIndex) => {
    const state = quizStates[quizIndex];
    if (!state || state.selected === null) return;
    
    const isCorrect = node.quizzes[quizIndex].correctAnswerIndex === state.selected;
    setQuizStates(prev => ({
      ...prev,
      [quizIndex]: { ...state, submitted: true }
    }));

    if (isCorrect) {
      setLoading(true);
      try {
        await updateNodeProgress(roadmapId, node.nodeId || node._id, { isQuizPassed: true });
        await refresh(node.nodeId || node._id);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
  };

  const videoId = node.videoIds?.[0];
  const videoUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}` 
    : node.videoSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(node.title)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-zinc-900 border-t md:border border-zinc-700 rounded-t-[2rem] md:rounded-2xl w-full md:max-w-3xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-blue-900/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800">
          <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter leading-tight truncate mr-4">{node.title}</h2>
          <button onClick={onClose} className="shrink-0 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 p-3 md:p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md overflow-x-auto no-scrollbar">
          {[
            { id: 'video', label: 'Lesson', icon: PlayCircle },
            { id: 'problems', label: 'Practice', icon: BookOpen },
            { id: 'quiz', label: 'Quiz', icon: GraduationCap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-700/50'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Video Tab */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                {videoId ? (
                  <iframe 
                    src={videoUrl} 
                    title="YouTube video" 
                    className="w-full h-full"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full p-4 text-center">
                    <a 
                      href={node.videoSearchUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex flex-col items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <PlayCircle size={40} className="opacity-50" />
                      <span className="text-sm font-bold">Initialize External Sync — Open YouTube Search</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleMarkVideoWatched}
                  disabled={node.isVideoWatched || loading}
                  className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    node.isVideoWatched 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : node.isVideoWatched ? <><CheckCircle size={16} strokeWidth={3}/> Sync Complete</> : <><Sparkles size={16}/> Authenticate Step</>}
                </button>
              </div>
            </div>
          )}

          {/* Problems Tab */}
          {activeTab === 'problems' && (
            <div className="space-y-4">
              {node.linkedProblems?.length > 0 ? (
                node.linkedProblems.map((prob, i) => (
                  <div key={i} className="bg-zinc-800/40 p-4 md:p-5 rounded-2xl border border-zinc-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-zinc-800 hover:border-emerald-500/30 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <Code className="size-6 md:size-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-base md:text-lg">{prob.name || prob.id}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {prob.tags?.map(t => (
                            <span key={t} className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 px-2.5 py-1 rounded-md border border-zinc-800">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={`/problem/${prob.id}`} 
                      target="_blank"
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest text-center transition-all active:scale-95"
                    >
                      Initialize Solve
                    </a>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <BookOpen size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No challenges linked to this sector.</p>
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {node.quizzes?.length > 0 ? (
                node.quizzes.map((q, i) => (
                  <div key={i} className="space-y-6 p-5 md:p-8 bg-zinc-800/30 rounded-[2rem] border border-zinc-700/50">
                    <h4 className="text-white font-black text-lg md:text-2xl leading-snug tracking-tight">{q.question}</h4>
                    <div className="space-y-3">
                      {q.options.map((opt, idx) => {
                        const isSelected = quizStates[i]?.selected === idx;
                        return (
                          <button
                            key={idx}
                            disabled={quizStates[i]?.submitted && q.correctAnswerIndex === quizStates[i]?.selected}
                            onClick={() => setQuizStates(prev => ({
                              ...prev,
                              [i]: { selected: idx, submitted: false }
                            }))}
                            className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all font-bold text-sm md:text-base ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-900/40 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                                : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      {quizStates[i]?.submitted ? (
                        <div className="space-y-4">
                          <div className={`text-center p-4 border rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs ${
                            q.correctAnswerIndex === quizStates[i]?.selected 
                              ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                              : 'bg-red-900/30 border-red-500 text-red-400'
                          }`}>
                            {q.correctAnswerIndex === quizStates[i]?.selected ? 'Sync Successful — Knowledge Authenticated' : 'Data Corruption — Correction Required'}
                          </div>
                          {q.correctAnswerIndex !== quizStates[i]?.selected && (
                             <button
                               onClick={() => setQuizStates(prev => ({ ...prev, [i]: { ...quizStates[i], submitted: false } }))}
                               className="w-full py-3.5 border border-red-500/50 text-red-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                             >
                               <RotateCcw size={14} /> Initialize Retrial
                             </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubmitQuiz(i)}
                          disabled={quizStates[i]?.selected === undefined || loading}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] md:text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16}/> Authenticate Sequence</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <GraduationCap size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No validation sequence found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailDrawer;