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
    if (allowedLanguages.length === 0) {
      toast.warning('Select at least one language');
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
      } else {
        toast.error(res.msg || 'Failed to create');
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
      toast.success('Interview deleted');
    } catch (err) {
      toast.error('Failed to delete');
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-500 border-green-500/30',
      finished: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
      pending: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    };
    return colors[status] || colors.pending;
  };

  const filteredInterviews = interviews.filter(i => 
    i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============ Render ============
  return (
    <div className="dark min-h-screen text-white bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(59,130,246,0.26),transparent_55%),radial-gradient(900px_600px_at_92%_12%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(900px_700px_at_60%_120%,rgba(16,185,129,0.14),transparent_50%),linear-gradient(to_br,rgba(10,10,10,1),rgba(4,4,6,1))]">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Interview Platform
            </h1>
            <p className="text-neutral-500 mt-2 flex items-center gap-2">
              <ClayIcon size={22} tint="emerald" className="rounded-xl shadow-none ring-white/10">
                <Video className="h-3.5 w-3.5" />
              </ClayIcon>
              Real-time technical interviews with code collaboration
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 gap-2 shadow-xl shadow-blue-500/20">
                <Plus className="h-5 w-5" />
                New Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950/70 border-white/10 text-white max-w-lg backdrop-blur-2xl rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ClayIcon size={26} tint="violet" className="rounded-2xl shadow-none ring-white/10">
                    <Sparkles className="h-4 w-4" />
                  </ClayIcon>
                  Create Interview Session
                </DialogTitle>
                <DialogDescription className="text-neutral-500">
                  Set up a new technical interview session
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-5 py-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Session Title *</Label>
                  <Input 
                    placeholder="e.g. Senior Backend Developer Interview"
                    className="bg-black/30 border-white/10 h-12 rounded-2xl"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                
                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Interview Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['technical', 'screening', 'assessment', 'mock'].map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                          className={`py-3 px-4 rounded-2xl border transition-all capitalize text-sm font-medium ${
                            type === t 
                              ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' 
                              : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/15'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                
                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Duration</Label>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90, 120].map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-2 rounded-2xl border text-sm transition-all ${
                          duration === d 
                            ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' 
                            : 'bg-black/30 border-white/10 text-neutral-400 hover:border-white/15'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Languages */}
                <div className="space-y-2">
                  <Label className="text-neutral-300">Allowed Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => toggleLanguage(lang.id)}
                        className={`px-3 py-1.5 rounded-2xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                          allowedLanguages.includes(lang.id)
                            ? 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                            : 'bg-black/30 border-white/10 text-neutral-500 hover:border-white/15'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${lang.color}`} />
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 border-white/12 bg-white/[0.04] text-neutral-200 rounded-2xl hover:bg-white/[0.06]">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create & Enter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: interviews.length, icon: Calendar, color: 'from-blue-500 to-blue-600' },
            { label: 'Active', value: interviews.filter(i => i.status === 'active').length, icon: Play, color: 'from-green-500 to-emerald-600' },
            { label: 'Pending', value: interviews.filter(i => i.status === 'pending').length, icon: Clock, color: 'from-yellow-500 to-amber-600' },
            { label: 'Completed', value: interviews.filter(i => i.status === 'finished').length, icon: CheckCircle2, color: 'from-purple-500 to-violet-600' },
          ].map(stat => (
            <Card key={stat.label} className="jx-glass p-5 hover:bg-white/[0.08] transition-all">
              <ClayIcon size={44} tint="neutral" className={`bg-gradient-to-br ${stat.color} rounded-2xl shadow-xl shadow-black/40 ring-white/15 mb-3`}>
                <stat.icon className="h-5 w-5 text-white" />
              </ClayIcon>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{stat.label} Interviews</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <Input
            placeholder="Search interviews..."
            className="bg-black/30 border-white/10 pl-12 h-14 text-lg rounded-3xl backdrop-blur-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Interview List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
          ) : filteredInterviews.length === 0 ? (
            <Card className="jx-glass border-dashed p-16 text-center">
              <ClayIcon size={64} tint="neutral" className="mx-auto mb-4 rounded-[26px] shadow-none">
                <Code2 className="h-8 w-8 text-white/70" />
              </ClayIcon>
              <h3 className="text-xl font-bold text-neutral-400">No interviews yet</h3>
              <p className="text-neutral-500 text-sm mt-2">Create your first interview session to get started</p>
              <Button 
                className="mt-6 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Interview
              </Button>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredInterviews.map((interview, i) => (
                <motion.div
                  key={interview._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="jx-glass p-5 hover:bg-white/[0.08] transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ClayIcon
                          size={56}
                          tint={interview.status === 'active' ? 'emerald' : 'neutral'}
                          className={
                            interview.status === 'active'
                              ? 'bg-gradient-to-br from-emerald-400/90 via-emerald-500/70 to-cyan-600/70'
                              : 'bg-gradient-to-br from-neutral-300/20 via-neutral-500/15 to-neutral-900/20'
                          }
                        >
                          {interview.status === 'active' ? (
                            <Play className="h-6 w-6 text-white" />
                          ) : (
                            <Users className="h-6 w-6 text-neutral-500" />
                          )}
                        </ClayIcon>
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">
                            {interview.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant="outline" className={getStatusColor(interview.status)}>
                              {interview.status}
                            </Badge>
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {interview.duration} min
                            </span>
                            {interview.candidate?.name && (
                              <span className="text-xs text-neutral-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {interview.candidate.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-200/90 border-white/12 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl"
                          onClick={() => copyInviteLink(interview.inviteToken)}
                        >
                          <Copy className="h-4 w-4 mr-1.5" />
                          Copy Invite Link
                        </Button>
                        
                        {interview.status === 'finished' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/12 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl"
                            onClick={() => navigate(`/interview/results/${interview._id}`)}
                          >
                            View Results
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400"
                            onClick={() => navigate(`/interview/room/${interview._id}`)}
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Enter
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-2xl text-rose-200/80 hover:text-rose-100 hover:bg-rose-500/10"
                          onClick={() => handleDelete(interview._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDashboard;
