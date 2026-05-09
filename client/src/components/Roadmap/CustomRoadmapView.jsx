import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import CyberTree from './CyberTree';
import NodeDetailDrawer from './NodeDetailDrawer';
import { getRoadmapById, deleteRoadmap } from '~/services/customRoadmap';
import { toast } from 'react-toastify';

const CustomRoadmapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoadmap = useCallback(async () => {
    try {
      const data = await getRoadmapById(id);
      if (data.success) setRoadmap(data.roadmap);
    } catch (e) {
      console.error('Failed to load roadmap', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleDelete = async () => {
    console.log('Delete button clicked for ID:', id);
    if (!window.confirm('Are you sure you want to delete this roadmap? This action cannot be undone.')) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('Deleting roadmap...');
    setDeleting(true);
    try {
      const res = await deleteRoadmap(id);
      console.log('Delete response:', res);
      if (res.success) {
        toast.success('Roadmap deleted successfully');
        navigate('/roadmaps'); // Adjust redirect path as needed
      } else {
        toast.error(res.msg || 'Failed to delete roadmap');
      }
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete roadmap: ' + (e.response?.data?.msg || e.message));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!roadmap) {
    return <p className="text-center py-8">Roadmap not found.</p>;
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const closeDrawer = () => setSelectedNode(null);

  const refreshRoadmap = async (currentId) => {
    // We don't set global loading to true here to prevent unmounting the drawer
    try {
      const data = await getRoadmapById(id);
      if (data.success) {
        setRoadmap(data.roadmap);
        
        // Find next unlocked node if current is completed
        if (currentId) {
          const updatedNodes = data.roadmap.nodes;
          const currentNode = updatedNodes.find(n => (n.nodeId || n._id) === currentId);
          
          // Update the selected node data even if not moving to next
          if (currentNode) {
            setSelectedNode(currentNode);
          }

          if (currentNode && (currentNode.status === 'completed' || currentNode.isVideoWatched)) {
            const currentCanonicalId = currentNode.nodeId;
            const outgoingEdges = data.roadmap.edges.filter(e => e.source === currentCanonicalId);
            const nextNode = updatedNodes.find(n => 
              outgoingEdges.some(e => e.target === n.nodeId) && 
              (n.status === 'unlocked' || n.status === 'completed')
            );
            
            if (nextNode) {
              setTimeout(() => setSelectedNode(nextNode), 1000); // Small delay for animation
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to refresh', e);
    }
  };

  const calculateProgress = () => {
    if (!roadmap || !roadmap.nodes) return 0;
    const totalNodes = roadmap.nodes.length;
    const progressValue = roadmap.nodes.reduce((acc, node) => {
      if (node.status === 'completed') return acc + 1;
      
      // Partial progress calculation
      let nodeProgress = 0;
      if (node.isVideoWatched) nodeProgress += 0.34;
      if (node.isQuizPassed) nodeProgress += 0.33;
      if (node.isProblemSolved) nodeProgress += 0.33;
      
      return acc + nodeProgress;
    }, 0);
    
    return Math.min(100, Math.round((progressValue / totalNodes) * 100));
  };

  const progressPercent = calculateProgress();

  return (
    <div className="relative w-full min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="mx-4 md:mx-8 mt-4 md:mt-8 mb-4 px-6 md:px-10 py-6 md:py-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] md:rounded-[3rem] z-20 flex flex-col md:flex-row items-start md:items-center justify-between shadow-2xl shadow-black/50 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
            <span className="text-[10px] md:text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Neural Trajectory</span>
            {roadmap.nodes.find(n => n.status === 'unlocked') && (
              <div className="hidden sm:flex items-center">
                <span className="text-zinc-800 mx-3">/</span>
                <span className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 backdrop-blur-md">
                  Current: {roadmap.nodes.find(n => n.status === 'unlocked').title}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-zinc-600 bg-clip-text text-transparent drop-shadow-2xl leading-none">
            {roadmap.title}
          </h2>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
          <div className="text-left md:text-right space-y-1 md:space-y-2">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Mission Progress</div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-32 md:w-48 h-2 bg-zinc-950/80 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-700 ease-out rounded-full relative" 
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
                </div>
              </div>
              <span className="text-xs md:text-sm font-black font-mono text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                {progressPercent}%
              </span>
            </div>
          </div>

          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group"
            title="Delete Roadmap"
          >
            {deleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} className="md:size-6 group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <CyberTree nodes={roadmap.nodes} onNodeClick={setSelectedNode} />
      </div>

      {selectedNode && (
        <NodeDetailDrawer
          node={selectedNode}
          onClose={closeDrawer}
          roadmapId={roadmap._id}
          refresh={refreshRoadmap}
        />
      )}
    </div>
  );
};

export default CustomRoadmapView;