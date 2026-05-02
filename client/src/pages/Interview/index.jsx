import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Play, Copy, Clock, Users, 
  Calendar, CheckCircle2, Loader2,
  Search, Sparkles, Code2, Video, Share2, Info, FileText
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogDescription,
  DialogTitle, DialogTrigger, DialogClose, DialogFooter
} from '~/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
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
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form
  const [title, setTitle] = useState('');

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
      const res = await api.createInterview({ title, type: 'technical', duration: 60, allowedLanguages: ['cpp', 'python', 'javascript'] });
      if (res.success) {
        toast.success('Interview created!');
        setInterviews(prev => [res.data, ...prev]);
        setIsCreateOpen(false);
        setTitle('');
        navigate(`/interview/room/${res.data._id}`);
      }
    } catch (err) {
      toast.error('Failed to create interview');
    } finally {
      setCreating(false);
    }
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

  const handleEndInterview = async (id) => {
    if (!window.confirm('End this interview session?')) return;
    try {
      await fetch(`${API_URL}/interview/${id}/end`, { method: 'POST', credentials: 'include' });
      loadInterviews();
      toast.success('Interview ended');
    } catch (err) {
      toast.error('Failed to end interview');
    }
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/interview/join/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans pb-20 transition-colors">
      
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Video size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">JudgeX Interview</h1>
              <p className="text-sm text-neutral-500 font-medium">Manage and conduct real-time evaluations</p>
            </div>
          </div>
        </div>

        {/* Action Grid: Create + Latest (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
          {/* Create Card */}
          <div 
            onClick={() => setIsCreateOpen(true)}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/5 group"
          >
            <div className="size-14 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
              <Plus size={32} />
            </div>
            <span className="font-bold text-sm text-neutral-500 group-hover:text-blue-500 transition-colors">Create an interview</span>
          </div>

          {/* Show Latest Interview if exists and active */}
          {interviews.length > 0 && interviews[0].status !== 'finished' && (
            <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 flex flex-col justify-between shadow-sm relative">
               <div className="absolute top-8 right-8 flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                 <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                 Active Session
               </div>
               
               <div>
                 <h2 className="text-2xl font-black tracking-tight mb-1">{interviews[0].title}</h2>
                 <p className="text-xs text-neutral-500 font-medium mb-6 uppercase tracking-wider">{new Date(interviews[0].createdAt).toLocaleString()}</p>
                 
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-tight">
                      <FileText size={16} className="text-blue-500" />
                      {interviews[0].questions?.length || 1} questions
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-tight">
                      <Clock size={16} className="text-blue-500" />
                      {interviews[0].duration || 60}m limit
                    </div>
                 </div>
               </div>

               <div className="flex items-center justify-end gap-3 mt-8">
                 <Button 
                   variant="ghost" size="icon"
                   onClick={() => copyInviteLink(interviews[0].inviteToken)}
                   className="rounded-xl hover:bg-blue-500/10 text-blue-500"
                 >
                   <Share2 size={18} />
                 </Button>
                 <Button 
                   onClick={() => navigate(`/interview/room/${interviews[0]._id}`)}
                   className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                 >
                   Enter Room
                 </Button>
               </div>
            </div>
          )}
        </div>

        {/* Past Interviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               Past Interviews
               <Badge variant="secondary" className="rounded-lg text-[10px] font-black uppercase">{interviews.filter(i => i.status === 'finished').length}</Badge>
            </h3>
            
            <div className="flex items-center gap-4">
               <Select defaultValue="result">
                 <SelectTrigger className="w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl">
                    <SelectValue placeholder="Result" />
                 </SelectTrigger>
                 <SelectContent className="dark:bg-neutral-900 border-neutral-800">
                    <SelectItem value="result" className="text-[10px] font-black uppercase">Recent</SelectItem>
                    <SelectItem value="oldest" className="text-[10px] font-black uppercase">Oldest</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.filter(i => i.status === 'finished').map((interview) => (
              <div key={interview._id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all relative group">
                 <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                 </div>
                 
                 <h4 className="text-lg font-black tracking-tight mb-1 truncate pr-8 group-hover:text-blue-500 transition-colors">{interview.title}</h4>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4 opacity-60">{new Date(interview.createdAt).toLocaleString()}</p>
                 
                 <div className="flex items-center gap-4 text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-8">
                   <div className="flex items-center gap-1.5">
                     <FileText size={14} className="text-blue-500" />
                     {interview.questions?.length || 3}
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Clock size={14} className="text-blue-500" />
                     {interview.duration || 60}m
                   </div>
                 </div>

                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                   <div className="flex items-center gap-2">
                     <div className="size-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-xs font-black">
                        {interview.title[0].toUpperCase()}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{interview.title}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <Button 
                       variant="ghost" size="icon"
                       onClick={() => handleDelete(interview._id)}
                       className="size-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                     >
                       <Trash2 size={16} />
                     </Button>
                     <Button 
                        variant="ghost" size="icon"
                        onClick={() => navigate(`/interview/results/${interview._id}`)}
                        className="size-8 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                     >
                       <Code2 size={16} />
                     </Button>
                   </div>
                 </div>
              </div>
            ))}
          </div>

          {/* Empty State for Past Interviews */}
          {interviews.filter(i => i.status === 'finished').length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
               <div className="p-6 rounded-full bg-neutral-100 dark:bg-white/5 mb-4">
                 <Clock size={32} className="text-neutral-300" />
               </div>
               <h4 className="text-xl font-black tracking-tight">No history yet</h4>
               <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-2">Completed interview sessions will appear here for review and analytics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-[32px] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black tracking-tight">New Interview</DialogTitle>
            <p className="text-sm text-neutral-500 font-medium">Configure a new technical evaluation session</p>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Candidate Name / Identity</Label>
              <Input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. John Doe - Senior Frontend"
                className="h-14 bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 ring-blue-500/20 text-lg font-bold"
              />
            </div>
          </div>
          <DialogFooter className="mt-10 gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20" 
              onClick={handleCreate} 
              disabled={creating}
            >
              {creating ? <Loader2 className="animate-spin" /> : 'Launch Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewDashboard;
