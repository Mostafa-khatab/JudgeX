import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Play, Copy, Clock, Users, 
  Calendar, CheckCircle2, Loader2,
  Search, Sparkles, Code2, Video
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogDescription,
  DialogTitle, DialogTrigger, DialogClose 
} from '~/components/ui/dialog';

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
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState('technical');
  const [duration, setDuration] = useState(60);
  const [allowedLanguages, setAllowedLanguages] = useState(['cpp', 'python', 'javascript', 'java']);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.getInterviews();
      if (res.success) {
        setInterviews(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.warning('Title must be at least 3 characters');
      return;
    }
    
    setCreating(true);
    try {
      const res = await api.createInterview({ title, type, duration, allowedLanguages });
      if (res.success) {
        toast.success('Interview created!');
        setInterviews(prev => [res.data, ...prev]);
        setIsCreateOpen(false);
        resetForm();
        navigate(`/interview/room/${res.data._id}`);
      }
    } catch (err) {
      toast.error('Failed to create interview');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('technical');
    setDuration(60);
    setAllowedLanguages(['cpp', 'python', 'javascript', 'java']);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await api.deleteInterview(id);
      setInterviews(prev => prev.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} interviews?`)) return;
    try {
      const res = await api.bulkDelete(selectedIds);
      if (res.success) {
        setInterviews(prev => prev.filter(i => !selectedIds.includes(i._id)));
        setSelectedIds([]);
        toast.success('Bulk deleted');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/interview/join/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredInterviews = interviews.filter(i => 
    i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Interviews', value: interviews.length, icon: Calendar, color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-400' },
    { label: 'Active Interviews', value: interviews.filter(i => i.status === 'active').length, icon: Play, color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { label: 'Pending Interviews', value: interviews.filter(i => i.status === 'pending').length, icon: Clock, color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
    { label: 'Completed Interviews', value: interviews.filter(i => i.status === 'finished').length, icon: CheckCircle2, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
  ];

  return (
    <div className="dark min-h-screen text-white bg-[#0a0a0b] relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Top Header */}
        <div className="flex items-start justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              Interview Platform
            </h1>
            <div className="flex items-center gap-2 text-neutral-400 font-medium">
              <div className="p-1 rounded bg-blue-500/10">
                <Video size={14} className="text-blue-500" />
              </div>
              <span className="text-sm">Real-time technical interviews with code collaboration</span>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-all shadow-lg shadow-blue-600/20 font-bold text-xs uppercase tracking-widest">
                <Plus className="size-4 mr-2" />
                New Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="jx-glass-strong border-white/5 text-white max-w-lg rounded-[32px] p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black">Launch New Session</DialogTitle>
                  <DialogDescription className="text-neutral-500">Configure parameters for the upcoming evaluation</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Candidate Identity</Label>
                    <Input 
                      placeholder="e.g. John Doe - Senior Backend"
                      className="bg-white/5 border-white/5 h-14 rounded-2xl focus:ring-2 ring-blue-500/20 text-lg font-medium"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Session Type</Label>
                      <select 
                        value={type} 
                        onChange={e => setType(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-sm font-medium"
                      >
                        <option value="technical">Technical</option>
                        <option value="screening">Screening</option>
                        <option value="assessment">Assessment</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Duration (Min)</Label>
                      <select 
                        value={duration} 
                        onChange={e => setDuration(Number(e.target.value))}
                        className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-sm font-medium"
                      >
                        <option value={30}>30m</option>
                        <option value={60}>60m</option>
                        <option value={90}>90m</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-10">
                  <DialogClose asChild><Button variant="ghost" className="flex-1 rounded-xl font-bold">Cancel</Button></DialogClose>
                  <Button className="flex-1 rounded-xl bg-blue-600 font-bold" onClick={handleCreate} disabled={creating}>
                    {creating ? <Loader2 className="animate-spin" /> : 'Launch'}
                  </Button>
                </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, idx) => (
            <div key={idx} className="jx-glass-strong p-8 rounded-[32px] border border-white/5 relative group overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color.replace('from-', 'from-').replace('/20', '')}`} />
              <div className="flex flex-col gap-4 relative z-10">
                <div className={`p-3 rounded-2xl bg-white/5 w-fit ${stat.iconColor}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tighter mb-1">{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-10 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-neutral-500 transition-colors group-focus-within:text-blue-500" />
          <Input 
            placeholder="Search interviews..."
            className="w-full h-20 bg-neutral-900/50 border-white/5 pl-16 text-lg font-medium rounded-[24px] focus:ring-4 ring-blue-500/10 transition-all placeholder:text-neutral-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List or Empty State */}
        <div className="jx-glass-strong rounded-[40px] border border-white/5 overflow-hidden">
          {loading ? (
            <div className="py-40 flex flex-col items-center gap-4">
              <Loader2 className="size-12 animate-spin text-blue-500/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Syncing Sessions...</span>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="py-40 flex flex-col items-center gap-8 text-center px-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full" />
                <div className="relative p-10 bg-white/5 rounded-[40px] border border-white/5">
                  <Code2 size={48} className="text-neutral-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">No interviews yet</h2>
                <p className="text-neutral-500 font-medium">Create your first interview session to get started</p>
              </div>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="h-12 px-10 rounded-2xl bg-blue-600 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20"
              >
                <Plus className="size-4 mr-2" />
                Create Interview
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Session Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Metrics</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInterviews.map((interview) => (
                    <tr key={interview._id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${interview.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                            {interview.status === 'active' ? <Play size={20} fill="currentColor" /> : <Users size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-lg tracking-tight group-hover:text-blue-400 transition-colors">{interview.title}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">ID: {interview._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 ${
                          interview.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                          interview.status === 'finished' ? 'bg-neutral-500/10 text-neutral-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <div className={`size-1.5 rounded-full ${
                             interview.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                             interview.status === 'finished' ? 'bg-neutral-500' : 'bg-blue-500'
                          }`} />
                          {interview.status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-tight">
                            <Clock size={12} className="text-blue-500" />
                            {interview.duration}m Duration
                          </div>
                          <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" size="icon" className="rounded-xl hover:bg-blue-500/10 text-blue-400"
                            onClick={() => copyInviteLink(interview.inviteToken)}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button 
                            className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                               interview.status === 'finished' ? 'bg-white/5 hover:bg-white/10' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            onClick={() => navigate(interview.status === 'finished' ? `/interview/results/${interview._id}` : `/interview/room/${interview._id}`)}
                          >
                            {interview.status === 'finished' ? 'Review' : 'Enter'}
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="rounded-xl hover:bg-rose-500/10 text-rose-500"
                            onClick={() => handleDelete(interview._id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDashboard;
