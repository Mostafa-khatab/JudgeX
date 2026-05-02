import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Play, Copy, Clock, Users, 
  Calendar, CheckCircle2, Loader2,
  Search, Sparkles, Code2, Video, Share2, Info
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

  const latestInterview = interviews[0];
  const pastInterviews = interviews.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#262626] font-sans pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-neutral-200 h-16 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-1.5 rounded-lg text-white">
            <Users size={20} />
          </div>
          <h1 className="text-xl font-medium tracking-tight">LeetCode Interview</h1>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span>Month's usage <Info size={14} className="inline ml-1 opacity-50" /></span>
          <span className="text-lg font-medium text-neutral-800">0<span className="text-neutral-400 font-normal">/ 10 used</span></span>
          <div className="w-32 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-0" />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-10">
        
        {/* Current Interview Section */}
        {latestInterview && (
          <div className="mb-12">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm max-w-md relative hover:shadow-md transition-shadow">
               <div className="absolute top-8 right-8 flex items-center gap-2 text-blue-500 text-xs font-medium">
                 <div className="size-2 rounded-full bg-blue-500" />
                 Created
               </div>
               
               <h2 className="text-2xl font-semibold mb-2">{latestInterview.title}</h2>
               <p className="text-sm text-neutral-400 mb-6">{new Date(latestInterview.createdAt).toLocaleString()}</p>
               
               <div className="flex items-center gap-2 text-neutral-500 text-sm mb-10">
                 <FileText size={16} />
                 {latestInterview.questions?.length || 1} question
               </div>

               <div className="flex items-center justify-end gap-3">
                 <button 
                   onClick={() => handleEndInterview(latestInterview._id)}
                   className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                   title="End Interview"
                 >
                   <Play className="size-5 rotate-90" />
                 </button>
                 <button 
                   onClick={() => copyInviteLink(latestInterview.inviteToken)}
                   className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                   title="Copy Link"
                 >
                   <Share2 size={5} />
                 </button>
               </div>
               
               {/* Hidden Enter Button overlaying the card or next to icons */}
               <button 
                 onClick={() => navigate(`/interview/room/${latestInterview._id}`)}
                 className="absolute inset-0 z-0 opacity-0"
               />
            </div>
          </div>
        )}

        {/* Create Button (Floating or Section) */}
        {!latestInterview && (
            <div className="mb-12">
               <Button 
                onClick={() => setIsCreateOpen(true)}
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
               >
                 <Plus size={20} className="mr-2" /> New Interview
               </Button>
            </div>
        )}

        {/* Past Interviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Past Interviews</h3>
            <div className="flex items-center gap-4">
               <Select defaultValue="result">
                 <SelectTrigger className="w-24 bg-neutral-200/50 border-none h-8 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="Result" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="result">Result</SelectItem>
                 </SelectContent>
               </Select>
               <div className="flex bg-neutral-200/50 p-1 rounded-lg">
                 <button className="p-1.5 bg-white shadow-sm rounded-md text-neutral-700"><Users size={14} /></button>
                 <button className="p-1.5 text-neutral-500"><Plus size={14} /></button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pastInterviews.map((interview) => (
              <div key={interview._id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                 <div className="absolute top-6 right-6 h-px w-4 bg-neutral-300" />
                 
                 <h4 className="text-lg font-semibold mb-1 truncate pr-8">{interview.title}</h4>
                 <p className="text-xs text-neutral-400 mb-4">{new Date(interview.createdAt).toLocaleString()}</p>
                 
                 <div className="flex items-center gap-4 text-neutral-500 text-xs mb-8">
                   <div className="flex items-center gap-1.5">
                     <FileText size={14} />
                     {interview.questions?.length || 3} questions
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Clock size={14} />
                     3h 0m
                   </div>
                 </div>

                 <div className="flex items-center justify-between mt-auto pt-4">
                   <div className="flex items-center gap-2">
                     <div className="size-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                        {interview.title[0].toUpperCase()}
                     </div>
                     <span className="text-xs font-medium text-neutral-700">{interview.title}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <button 
                       onClick={() => handleDelete(interview._id)}
                       className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>
                     <button 
                        onClick={() => navigate(`/interview/room/${interview._id}`)}
                        className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                     >
                       <Share2 size={16} />
                     </button>
                   </div>
                 </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 mt-12">
            <button className="p-2 bg-neutral-200/50 rounded-lg text-neutral-400 hover:text-neutral-600 disabled:opacity-50"><Plus size={16} className="rotate-90" /></button>
            <div className="h-8 w-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center text-sm font-medium">1</div>
            <button className="p-2 bg-neutral-200/50 rounded-lg text-neutral-400 hover:text-neutral-600"><Plus size={16} className="-rotate-90" /></button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Candidate Name</Label>
              <Input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="animate-spin" /> : 'Launch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewDashboard;
