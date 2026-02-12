import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Clock, CheckCircle2, XCircle, 
  Code2, MessageSquare, BarChart3, Loader2,
  Trophy, Calendar, User, AlertTriangle, Star,
  Copy, Eye, FileText
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============ API ============
const api = {
  getResults: async (id) => {
    const res = await fetch(`${API_URL}/interview/${id}/results`, { credentials: 'include' });
    return res.json();
  }
};

// ============ Component ============
const InterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSnapshot, setActiveSnapshot] = useState(null);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const res = await api.getResults(id);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.message || 'Failed to load results');
        navigate('/interview');
      }
    } catch (err) {
      toast.error('Failed to load results');
      navigate('/interview');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = Math.floor((end - start) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationColor = (rec) => {
    const colors = {
      strong_hire: 'bg-green-500/10 text-green-400 border-green-500/30',
      hire: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      lean_hire: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      lean_no_hire: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      no_hire: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[rec] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30';
  };

  const renderStars = (score) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i <= score ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-700'}`} 
          />
        ))}
      </div>
    );
  };

  // ============ Loading ============
  if (loading) {
    return (
      <div className="dark min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-neutral-500">Loading results...</p>
        </div>
      </div>
    );
  }

  // ============ Render ============
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/interview')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-6 w-px bg-neutral-700" />
            <div>
              <Badge variant="outline" className="mb-1 text-xs border-green-500/30 text-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
              <h1 className="text-2xl font-bold">{data?.title || 'Interview Results'}</h1>
              <p className="text-neutral-500 text-sm flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {data?.createdAt ? formatDate(data.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-4">
          {/* Main Score */}
          <Card className="col-span-2 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm uppercase tracking-wider">Overall Score</p>
                <p className="text-6xl font-black mt-2">
                  {data?.totalScore || '—'}
                  <span className="text-2xl text-neutral-400">/5</span>
                </p>
                {data?.feedback?.recommendation && (
                  <Badge className={`mt-4 ${getRecommendationColor(data.feedback.recommendation)}`}>
                    {data.feedback.recommendation.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Trophy className="h-14 w-14 text-white" />
              </div>
            </div>
          </Card>
          
          {/* Candidate Info */}
          <Card className="bg-neutral-900/50 border-neutral-800 p-6">
            <User className="h-5 w-5 text-blue-400 mb-4" />
            <h3 className="font-bold text-lg">{data?.candidate?.name || 'Candidate'}</h3>
            <p className="text-sm text-neutral-500 mt-1">{data?.candidate?.email || 'No email'}</p>
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Duration:</span>
                <span className="font-medium">{formatDuration(data?.startedAt, data?.endedAt)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-neutral-500">Tab Switches:</span>
                <span className={`font-medium ${data?.tabSwitchCount > 0 ? 'text-red-400' : ''}`}>
                  {data?.tabSwitchCount || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList className="bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-600">
              <Star className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="data-[state=active]:bg-blue-600">
              <Code2 className="h-4 w-4 mr-2" />
              Snapshots ({data?.snapshots?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat ({data?.messages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Events ({data?.events?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'problemSolving', label: 'Problem Solving', icon: Code2 },
                { key: 'communication', label: 'Communication', icon: MessageSquare },
                { key: 'codingStyle', label: 'Coding Style', icon: FileText },
                { key: 'technicalKnowledge', label: 'Technical Knowledge', icon: BarChart3 },
              ].map(item => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-neutral-900/50 border-neutral-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <span className="font-bold">{item.label}</span>
                      </div>
                      {renderStars(data?.feedback?.[item.key]?.score || 0)}
                    </div>
                    {data?.feedback?.[item.key]?.notes && (
                      <p className="text-sm text-neutral-400 bg-neutral-800/50 rounded-lg p-3">
                        {data.feedback[item.key].notes}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {data?.feedback?.overallNotes && (
              <Card className="bg-neutral-900/50 border-neutral-800 p-5 mt-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Overall Notes
                </h4>
                <p className="text-sm text-neutral-400">{data.feedback.overallNotes}</p>
              </Card>
            )}
          </TabsContent>

          {/* Snapshots Tab */}
          <TabsContent value="snapshots">
            <div className="grid grid-cols-3 gap-4">
              {data?.snapshots?.map((snap, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card 
                    className={`bg-neutral-900/50 border-neutral-800 p-4 cursor-pointer transition-all hover:border-blue-500 ${
                      activeSnapshot === i ? 'border-blue-500 bg-blue-600/10' : ''
                    }`}
                    onClick={() => setActiveSnapshot(activeSnapshot === i ? null : i)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px]">{snap.language}</Badge>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(snap.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-[10px] text-neutral-400 overflow-hidden h-16 bg-neutral-800/50 rounded p-2">
                      {snap.code?.slice(0, 300)}...
                    </pre>
                    {snap.note && (
                      <p className="text-xs text-neutral-500 mt-2">{snap.note}</p>
                    )}
                  </Card>
                </motion.div>
              ))}
              
              {(!data?.snapshots || data.snapshots.length === 0) && (
                <Card className="col-span-3 bg-neutral-900/30 border-neutral-800 border-dashed p-10 text-center">
                  <Code2 className="h-10 w-10 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-500">No snapshots were taken</p>
                </Card>
              )}
            </div>
            
            {/* Active Snapshot Detail */}
            {activeSnapshot !== null && data?.snapshots?.[activeSnapshot] && (
              <Card className="bg-neutral-900 border-neutral-800 mt-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{data.snapshots[activeSnapshot].language}</Badge>
                    <span className="text-sm text-neutral-400">
                      {formatDate(data.snapshots[activeSnapshot].timestamp)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(data.snapshots[activeSnapshot].code);
                      toast.success('Code copied!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="p-4 text-sm font-mono text-neutral-300 overflow-auto max-h-80 bg-neutral-950">
                  {data.snapshots[activeSnapshot].code}
                </pre>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="bg-neutral-900/50 border-neutral-800 p-4">
              <div className="space-y-3 max-h-96 overflow-auto">
                {data?.messages?.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'interviewer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-xl ${
                      msg.role === 'interviewer' ? 'bg-blue-600' : 'bg-neutral-800'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {(!data?.messages || data.messages.length === 0) && (
                  <div className="text-center py-10 text-neutral-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No messages in this session</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-neutral-900/50 border-neutral-800 p-4">
              <div className="space-y-2 max-h-96 overflow-auto">
                {data?.events?.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                    <div className={`h-2 w-2 rounded-full ${
                      event.type.includes('switch') || event.type.includes('lost') 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">
                      {event.type.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs text-neutral-500 ml-auto">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                
                {(!data?.events || data.events.length === 0) && (
                  <div className="text-center py-10 text-neutral-500">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No proctoring events recorded</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InterviewResults;
