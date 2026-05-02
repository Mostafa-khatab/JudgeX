import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
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

// ============ Component ============
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
    <div className="min-h-screen jx-mesh-bg text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <ClayIcon size={44} tint="violet">
                  <Sparkles size={18} />
                </ClayIcon>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tighter">JudgeX Interviews</h1>
                  <p className="text-white/60 text-sm">Premium real-time collaborative sessions (Socket.IO + WebRTC)</p>
                </div>
              </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black tracking-tight shadow-lg shadow-blue-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Interview
                </Button>
              </DialogTrigger>
              <DialogContent className="jx-glass-strong border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="px-7 pt-7">
                  <DialogTitle className="text-xl font-black tracking-tight">Create Interview</DialogTitle>
                  <DialogDescription className="text-white/60">Fast start, premium workspace. You can tweak later inside the room.</DialogDescription>
                </DialogHeader>
                <div className="px-7 py-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-2">Type</div>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-11 rounded-2xl bg-white/10 border-white/10 text-white">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-2xl">
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="system">System Design</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-2">Duration</div>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="h-11 rounded-2xl bg-white/10 border-white/10 text-white">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-2xl">
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-2">Languages</div>
                    <div className="h-11 rounded-2xl bg-white/10 border border-white/10 px-3 flex items-center gap-2 overflow-x-auto">
                      {['cpp', 'python', 'javascript', 'java'].map(l => {
                        const on = langs.includes(l);
                        return (
                          <button
                            key={l}
                            onClick={() => setLangs(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))}
                            className={`shrink-0 h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                              on ? 'bg-white/15 border-white/15 text-white' : 'bg-transparent border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter className="px-7 pb-7">
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 font-black shadow-lg shadow-purple-500/20"
                  >
                    {creating ? 'Creating…' : 'Launch Workspace'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, token, or ID…"
                className="h-12 pl-11 rounded-2xl bg-white/10 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="hidden sm:flex items-center gap-2 jx-glass px-3 py-2 rounded-2xl border-white/10 bg-white/10 text-white/80">
              <Code2 className="h-4 w-4" />
              <span className="text-xs font-bold tracking-tight">Bento Dashboard</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 jx-glass px-3 py-2 rounded-2xl border-white/10 bg-white/10 text-white/80">
              <Video className="h-4 w-4" />
              <span className="text-xs font-bold tracking-tight">WebRTC</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-4 jx-glass-strong border-white/10 bg-white/10 text-white overflow-hidden rounded-3xl">
              <div className="p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/60">Create</div>
                    <div className="mt-2 text-xl font-black tracking-tight">New Interview</div>
                    <div className="mt-1 text-sm text-white/60">Electric Blue + Deep Purple accents, glass UI.</div>
                  </div>
                  <ClayIcon size={56} tint="blue">
                    <Plus size={20} />
                  </ClayIcon>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black shadow-lg shadow-blue-500/25"
                  >
                    Create Interview
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="col-span-12 lg:col-span-8 jx-glass-strong border-white/10 bg-white/10 text-white overflow-hidden rounded-3xl">
              <div className="px-7 pt-7 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-white/60">Past Interviews</div>
                  <div className="mt-2 text-lg font-black tracking-tight">Recent Sessions</div>
                </div>
                <Badge className="bg-white/10 border border-white/10 text-white/80">{filtered.length}</Badge>
              </div>
              <div className="px-7 pb-7">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="h-48 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-sm">
                    No interviews yet. Create your first workspace.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.slice(0, 8).map((it) => (
                      <motion.div
                        key={it?._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
                      >
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-black tracking-tight truncate">{it?.title || 'Interview'}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/60">
                              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(it?.createdAt || Date.now()).toLocaleDateString()}</span>
                              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{it?.duration || 60}m</span>
                              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />2</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/15 text-white"
                              onClick={() => copyInvite(it?.inviteToken)}
                              title="Copy invite"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-9 w-9 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200"
                              onClick={() => deleteOne(it?._id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="px-4 pb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500/15 border border-blue-500/20 text-blue-200">{it?.type || 'technical'}</Badge>
                            <Badge className="bg-purple-500/15 border border-purple-500/20 text-purple-200">{(it?.allowedLanguages || []).slice(0, 2).join(', ') || 'langs'}</Badge>
                          </div>
                          <Button
                            onClick={() => navigate(`/interview/room/${it?._id}`)}
                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 font-black"
                          >
                            Open
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
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
