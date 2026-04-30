import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, CheckCircle2,
  Code2, MessageSquare, BarChart3, Loader2,
  Trophy, Calendar, User, Star,
  Copy, FileText
} from 'lucide-react';
import httpRequest from '~/utils/httpRequest';

import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

import ClayIcon from './components/ClayIcon';

// ============ API ============
const api = {
  getResults: async (id) => {
    const res = await httpRequest.get(`/interview/${id}/results`);
    return res.data;
  }
};

// ============ Component ============
const InterviewResults = () => {
  const { t } = useTranslation('interview');
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
        toast.error(res.message || t('errors.failedFetchInterview'));
        navigate('/interview');
      }
    } catch (err) {
      toast.error(t('errors.failedFetchInterview'));
      navigate('/interview');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt) return t('messages.dateNotAvailable');
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
          <p className="text-neutral-500">{t('loading.loadingResults')}</p>
        </div>
      </div>
    );
  }

  // ============ Render ============
  return (
    <div className="dark min-h-screen text-white p-8 bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(900px_600px_at_92%_12%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(900px_700px_at_60%_120%,rgba(16,185,129,0.12),transparent_50%),linear-gradient(to_br,rgba(10,10,10,1),rgba(4,4,6,1))]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/interview')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('buttons.back')}
            </Button>
            <div className="h-6 w-px bg-neutral-700" />
            <div>
              <Badge variant="outline" className="mb-1 text-xs border-green-500/30 text-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t('status.completed')}
              </Badge>
              <h1 className="text-2xl font-bold">{data?.title || t('messages.interviewResultsTitle')}</h1>
              <p className="text-neutral-500 text-sm flex items-center gap-2 mt-1">
                <ClayIcon size={20} tint="neutral" className="rounded-xl shadow-none">
                  <Calendar className="h-3.5 w-3.5" />
                </ClayIcon>
                {data?.createdAt ? formatDate(data.createdAt) : t('messages.dateNotAvailable')}
              </p>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Score */}
          <Card className="lg:col-span-2 jx-glass-strong p-8 overflow-hidden relative">
            <div className="pointer-events-none absolute -top-16 -right-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm uppercase tracking-wider">{t('labels.overallScore')}</p>
                <p className="text-6xl font-black mt-2">
                  {data?.totalScore || '—'}
                  <span className="text-2xl text-neutral-400">{t('labels.scoreScale')}</span>
                </p>
                {data?.feedback?.recommendation && (
                  <Badge className={`mt-4 ${getRecommendationColor(data.feedback.recommendation)}`}>
                    {t(`labels.finalRecommendation`)}: {data.feedback.recommendation.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              <ClayIcon size={112} tint="violet" className="rounded-[34px] ring-white/15">
                <Trophy className="h-14 w-14 text-white" />
              </ClayIcon>
            </div>
          </Card>
          
          {/* Candidate Info */}
          <Card className="jx-glass p-6">
            <ClayIcon size={40} tint="blue" className="rounded-2xl shadow-none ring-white/10 mb-4">
              <User className="h-5 w-5" />
            </ClayIcon>
            <h3 className="font-bold text-lg">{data?.candidate?.name || t('roles.candidate')}</h3>
            <p className="text-sm text-neutral-500 mt-1">{data?.candidate?.email || t('labels.noEmail')}</p>
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{t('labels.duration')}</span>
                <span className="font-medium">{formatDuration(data?.startedAt, data?.endedAt)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-neutral-500">{t('labels.tabSwitches')}</span>
                <span className={`font-medium ${data?.tabSwitchCount > 0 ? 'text-red-400' : ''}`}>
                  {data?.tabSwitchCount || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList className="jx-glass border border-white/10">
            <TabsTrigger value="feedback" className="data-[state=active]:bg-white/[0.10] data-[state=active]:text-white">
              <Star className="h-4 w-4 mr-2" />
              {t('sections.feedback')}
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="data-[state=active]:bg-white/[0.10] data-[state=active]:text-white">
              <Code2 className="h-4 w-4 mr-2" />
              {t('labels.snapshotsPrefix')}{data?.snapshots?.length || 0}{t('labels.closeParen')}
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-white/[0.10] data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('labels.chatPrefix')}{data?.messages?.length || 0}{t('labels.closeParen')}
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-white/[0.10] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('labels.eventsPrefix')}{data?.events?.length || 0}{t('labels.closeParen')}
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
                        <ClayIcon size={40} tint="blue" className="rounded-2xl shadow-none ring-white/10">
                          <item.icon className="h-5 w-5" />
                        </ClayIcon>
                        <span className="font-bold">{t(`categories.${item.key}`)}</span>
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
                  {t('sections.overallNotes')}
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
                  <p className="text-neutral-500">{t('messages.noSnapshots')}</p>
                </Card>
              )}
            </div>
            
            {/* Active Snapshot Detail */}
            {activeSnapshot !== null && data?.snapshots?.[activeSnapshot] && (
              <Card className="jx-glass-strong mt-4 overflow-hidden">
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
                      toast.success(t('messages.codeCopied'));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="p-4 text-sm font-mono text-neutral-300 overflow-auto max-h-80 bg-black/40">
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
                    <p>{t('messages.noMessagesInSession')}</p>
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
                    <p>{t('messages.noProctoringEvents')}</p>
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
