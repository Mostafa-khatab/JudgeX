import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Clock,
  Users,
  Calendar,
  Video,
  Code2,
  Sparkles,
  Copy,
  ArrowRight,
  Trash2,
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import ClayIcon from './components/ClayIcon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============ API ============
const api = {
  getInterviews: async () => {
    const res = await fetch(`${API_URL}/interview/`, { credentials: 'include' });
    return res.json();
  },
  createInterview: async (data) => {
    const res = await fetch(`${API_URL}/interview/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteInterview: async (id) => {
    const res = await fetch(`${API_URL}/interview/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return res.json();
  },
  bulkDelete: async (ids) => {
    const res = await fetch(`${API_URL}/interview/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    return res.json();
  },
  cleanup: async () => {
    const res = await fetch(`${API_URL}/interview/cleanup`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  }
};

// ============ Sub-Components ============
const TechPattern = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
       style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
);

const FloatingBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"
    />
    <motion.div 
      animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]"
    />
    <motion.div 
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px]"
    />
  </div>
);

// ============ Main Component ============
const InterviewDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState('technical');
  const [duration, setDuration] = useState('60');
  const [langs, setLangs] = useState(['cpp', 'python', 'javascript', 'java']);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getInterviews();
        if (!mounted) return;
        if (res?.success) setItems(res.data || []);
        else toast.error(res?.message || 'Failed to load interviews');
      } catch {
        toast.error('Connection error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => {
      const title = (i?.title || '').toLowerCase();
      const token = (i?.inviteToken || '').toLowerCase();
      return title.includes(q) || token.includes(q) || (i?._id || '').toLowerCase().includes(q);
    });
  }, [items, query]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await api.createInterview({
        title: `Interview - ${new Date().toLocaleDateString()}`,
        type,
        duration: Number(duration) || 60,
        allowedLanguages: langs,
      });
      if (res?.success) {
        toast.success('Interview created');
        navigate(`/interview/room/${res.data._id}`);
        return;
      }
      toast.error(res?.message || 'Failed to create interview');
    } catch {
      toast.error('Connection error');
    } finally {
      setCreating(false);
      setCreateOpen(false);
    }
  };

  const copyInvite = async (inviteToken) => {
    try {
      const url = `${window.location.origin}/interview/join/${inviteToken}`;
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied');
    } catch {
      toast.error('Failed to copy invite link');
    }
  };

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      const res = await api.deleteInterview(id);
      if (res?.success) {
        setItems(prev => prev.filter(i => i?._id !== id));
        toast.success('Deleted');
      } else {
        toast.error(res?.message || 'Delete failed');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white overflow-hidden">
      <TechPattern />
      <FloatingBlobs />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-20">
        <div className="flex flex-col gap-12">
          
          {/* --- Header Section --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                Neural Communications v2.0
              </motion.div>
              <div className="flex items-center gap-5">
                <ClayIcon size={64} tint="violet" className="shadow-2xl shadow-purple-500/20">
                  <Sparkles size={28} className="neural-flicker" />
                </ClayIcon>
                <div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    JudgeX <span className="text-blue-500">Interviews</span>
                  </h1>
                  <p className="mt-2 text-white/40 text-sm md:text-lg font-medium max-w-xl">
                    High-fidelity collaborative workspaces for technical evaluation.
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black tracking-tight shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1 active:scale-95">
                  <Plus className="h-5 w-5 mr-2.5" />
                  Launch New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="jx-glass-strong border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 pointer-events-none" />
                <DialogHeader className="px-10 pt-10 relative z-10">
                  <DialogTitle className="text-3xl font-black tracking-tight">Session Configuration</DialogTitle>
                  <DialogDescription className="text-white/50 text-base">Initialize your premium collaborative workspace.</DialogDescription>
                </DialogHeader>
                <div className="px-10 py-8 grid grid-cols-2 gap-6 relative z-10">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block">Interview Blueprint</label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:ring-blue-500/20">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-2xl">
                        <SelectItem value="technical">Technical (Algorithm)</SelectItem>
                        <SelectItem value="system">System Design</SelectItem>
                        <SelectItem value="behavioral">Behavioral / HR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block">Duration</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-2xl">
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="45">45 Minutes</SelectItem>
                        <SelectItem value="60">60 Minutes</SelectItem>
                        <SelectItem value="90">90 Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block">Tech Stack</label>
                    <div className="h-14 rounded-2xl bg-white/5 border border-white/10 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {['cpp', 'python', 'javascript', 'java'].map(l => {
                        const on = langs.includes(l);
                        return (
                          <button
                            key={l}
                            onClick={() => setLangs(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))}
                            className={`shrink-0 h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                              on ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-transparent border-white/10 text-white/40 hover:text-white'
                            }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter className="px-10 pb-10 relative z-10">
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-500/20"
                  >
                    {creating ? 'Initializing...' : 'Construct Workspace'}
                    <ArrowRight className="h-5 w-5 ml-2.5" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* --- Search & Quick Stats --- */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Lookup session by title, token, or identifier..."
                className="h-16 pl-14 rounded-[2rem] bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:bg-white/[0.05] focus:border-blue-500/30 transition-all text-base"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none flex items-center gap-3 jx-glass px-5 py-4 rounded-2xl border-white/5 bg-white/[0.02] text-white/60">
                <Code2 className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-black tracking-widest uppercase">Protocol: Socket.IO</span>
              </div>
              <div className="flex-1 md:flex-none flex items-center gap-3 jx-glass px-5 py-4 rounded-2xl border-white/5 bg-white/[0.02] text-white/60">
                <Video className="h-5 w-5 text-purple-500" />
                <span className="text-xs font-black tracking-widest uppercase">Stream: WebRTC</span>
              </div>
            </div>
          </div>

          {/* --- Bento Grid Layout --- */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Create Card (Bento Style) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-12 lg:col-span-4"
            >
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] blur-3xl" />
                <Card className="relative h-full jx-glass-strong border-white/5 bg-white/[0.02] overflow-hidden rounded-[2.5rem] p-10 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-8">
                      <Plus className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-3">Initialize</div>
                    <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">Launch New Workspace</h2>
                    <p className="text-white/40 font-medium leading-relaxed">
                      Deploy a fresh collaborative session with real-time code execution and high-definition video.
                    </p>
                  </div>
                  <div className="mt-12">
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Create Interview
                      <ArrowRight className="h-5 w-5 ml-2.5" />
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Sessions List */}
            <Card className="col-span-12 lg:col-span-8 jx-glass-strong border-white/5 bg-white/[0.01] overflow-hidden rounded-[2.5rem]">
              <div className="px-10 pt-10 pb-6 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-2">History</div>
                  <h2 className="text-2xl font-black tracking-tight">Recent Sessions</h2>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-white/60">
                  {filtered.length} ARCHIVED
                </div>
              </div>
              
              <div className="px-10 pb-10">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="h-32 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="h-64 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center px-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                      <Code2 className="h-8 w-8 text-white/20" />
                    </div>
                    <p className="text-white/40 font-medium max-w-xs text-sm leading-relaxed">
                      No active sessions found in your neural history. Create your first workspace to begin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filtered.slice(0, 8).map((it, idx) => (
                        <motion.div
                          key={it?._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl" />
                          <div className="relative rounded-3xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden jx-vibrant-border">
                            <div className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1.5">{it?.type || 'technical'}</div>
                                  <div className="font-black text-lg tracking-tight truncate leading-tight group-hover:text-blue-400 transition-colors">
                                    {it?.title || 'Interview'}
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(it?.createdAt || Date.now()).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {it?.duration || 60}m</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                    onClick={() => copyInvite(it?.inviteToken)}
                                    title="Copy Invite Link"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10"
                                    onClick={() => deleteOne(it?._id)}
                                    title="Delete Session"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-6 flex items-center justify-between gap-4">
                                <div className="flex -space-x-2">
                                  {(it?.allowedLanguages || []).slice(0, 3).map((l, i) => (
                                    <div key={i} className="h-7 px-3 rounded-lg bg-zinc-950 border border-white/10 text-[9px] font-black uppercase flex items-center justify-center">
                                      {l}
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  onClick={() => navigate(`/interview/room/${it?._id}`)}
                                  className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                  Enter
                                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDashboard;
