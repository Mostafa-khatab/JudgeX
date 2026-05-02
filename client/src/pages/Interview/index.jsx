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

  const LANGUAGES = [
    { id: 'cpp', name: 'C++', color: 'bg-blue-500' },
    { id: 'python', name: 'Python', color: 'bg-yellow-500' },
    { id: 'javascript', name: 'JavaScript', color: 'bg-amber-500' },
    { id: 'java', name: 'Java', color: 'bg-red-500' },
    { id: 'go', name: 'Go', color: 'bg-cyan-500' },
    { id: 'rust', name: 'Rust', color: 'bg-orange-500' },
  ];

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

  const handleCleanup = async () => {
    if (!window.confirm('Remove all finished sessions older than 30 days?')) return;
    try {
      const res = await api.cleanup();
      if (res.success) {
        loadInterviews();
        toast.success(`Cleaned up ${res.data.deletedCount} sessions`);
      }
    } catch (err) {
      toast.error('Cleanup failed');
    }
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/interview/join/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  const toggleLanguage = (langId) => {
    setAllowedLanguages(prev => 
      prev.includes(langId) 
        ? prev.filter(l => l !== langId)
        : [...prev, langId]
    );
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInterviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInterviews.map(i => i._id));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      finished: 'text-neutral-500 border-neutral-500/10 bg-neutral-500/5',
      pending: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
      paused: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    };
    return colors[status] || colors.pending;
  };

  const filteredInterviews = interviews.filter(i => 
    i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark min-h-screen text-white bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                <Video className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                Interviews
              </h1>
            </div>
            <p className="text-neutral-500 text-sm font-medium tracking-wide uppercase opacity-70">
              Manage your real-time technical evaluation sessions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Session
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0f0f11]/90 border-white/5 text-white max-w-lg backdrop-blur-3xl rounded-[32px] p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black tracking-tight">New Interview</DialogTitle>
                  <DialogDescription className="text-neutral-500 font-medium">Configure session parameters</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Candidate Name / Title</Label>
                    <Input 
                      placeholder="e.g. Frontend Engineer - John Doe"
                      className="bg-white/5 border-white/5 h-14 rounded-2xl focus:ring-2 ring-blue-500/20 text-lg font-medium"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Type</Label>
                      <select 
                        value={type} 
                        onChange={e => setType(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-sm font-medium focus:ring-2 ring-blue-500/20"
                      >
                        <option value="technical">Technical</option>
                        <option value="screening">Screening</option>
                        <option value="assessment">Assessment</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Duration</Label>
                      <select 
                        value={duration} 
                        onChange={e => setDuration(Number(e.target.value))}
                        className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-sm font-medium focus:ring-2 ring-blue-500/20"
                      >
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={90}>90 Minutes</option>
                        <option value={120}>120 Minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <DialogClose asChild>
                    <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</Button>
                  </DialogClose>
                  <Button 
                    className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? <Loader2 className="animate-spin" /> : 'Launch Session'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Filter by title or candidate..."
              className="bg-white/5 border-white/5 pl-14 h-14 text-sm font-medium rounded-2xl backdrop-blur-xl focus:ring-2 ring-blue-500/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={loadInterviews}
              className="h-14 px-5 rounded-2xl border-white/5 bg-white/5 text-neutral-400 hover:text-white"
            >
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {selectedIds.length > 0 && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Button 
                  onClick={handleBulkDelete}
                  className="h-14 px-8 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedIds.length})
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="jx-glass-strong rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  <th className="px-6 py-5 w-12">
                    <button 
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.length === filteredInterviews.length && filteredInterviews.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-white/10 hover:border-white/20'}`}
                    >
                      {selectedIds.length === filteredInterviews.length && filteredInterviews.length > 0 && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Session</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Details</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Fetching Sessions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInterviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-32 text-center px-6">
                      <div className="flex flex-col items-center gap-6">
                        <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
                          <Code2 className="h-12 w-12 text-neutral-700" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black tracking-tight">No Sessions Found</h3>
                          <p className="text-neutral-500 mt-2 max-w-xs mx-auto">Create your first interview or try a different search term</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInterviews.map((interview, i) => (
                    <tr 
                      key={interview._id} 
                      className={`border-b border-white/5 transition-colors group hover:bg-white/[0.02] ${selectedIds.includes(interview._id) ? 'bg-blue-600/5' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <button 
                          onClick={() => toggleSelect(interview._id)}
                          className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.includes(interview._id) ? 'bg-blue-600 border-blue-600' : 'border-white/10 group-hover:border-white/20'}`}
                        >
                          {selectedIds.includes(interview._id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${interview.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                             {interview.status === 'active' ? <Play className="h-5 w-5 fill-current" /> : <Users className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-base tracking-tight truncate group-hover:text-blue-400 transition-colors">{interview.title}</h4>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">ID: {interview._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={`rounded-full h-6 px-3 text-[10px] font-black uppercase tracking-widest border-none ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                             <Clock className="h-3.5 w-3.5 text-blue-500" />
                             {interview.duration} Minutes
                          </div>
                          <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider tabular-nums">
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl hover:bg-blue-600/20 text-blue-400"
                            onClick={() => copyInviteLink(interview.inviteToken)}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          {interview.status === 'finished' ? (
                            <Button
                              size="sm"
                              className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest"
                              onClick={() => navigate(`/interview/results/${interview._id}`)}
                            >
                              Results
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-widest"
                              onClick={() => navigate(`/interview/room/${interview._id}`)}
                            >
                              Enter
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl hover:bg-rose-600/20 text-rose-500"
                            onClick={() => handleDelete(interview._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 flex flex-wrap items-center gap-8 px-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest opacity-60">
           <div className="flex items-center gap-2">
             <span className="h-2 w-2 rounded-full bg-blue-500" />
             Total: {interviews.length}
           </div>
           <div className="flex items-center gap-2">
             <span className="h-2 w-2 rounded-full bg-emerald-500" />
             Active: {interviews.filter(i => i.status === 'active').length}
           </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDashboard;
