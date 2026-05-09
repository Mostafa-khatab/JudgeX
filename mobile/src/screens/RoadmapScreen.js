import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { 
  CheckCircle2,
  Trash2,
  History,
  Cpu,
  Info,
  Zap,
  ChevronRight,
  BookOpen,
  MessageSquare,
  X,
  Sparkles,
  Target,
  Lock,
  PlayCircle,
  HelpCircle,
  Code,
  ChevronLeft,
  Check
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import roadmapService from '../services/roadmapService';
import api from '../services/api';
import MissionDashboard from '../components/MissionDashboard';
import NeuralPath from '../components/NeuralPath';

const { width, height } = Dimensions.get('window');

const PathCard = ({ title, subtitle, progress, status, onPress, onDelete, isSaved }) => {
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const isCurrent = status === 'current';

  return (
    <View style={{ opacity: isLocked ? 0.6 : 1, marginBottom: 16 }}>
      <TouchableOpacity 
        onPress={onPress} 
        disabled={isLocked}
        style={[
          styles.pathCard,
          isCurrent && styles.cardCurrent,
          isLocked && styles.cardLocked
        ]}
      >
        <View style={styles.cardBadge}>
          <Zap size={10} color={isCurrent ? "#3b82f6" : "#52525b"} fill={isCurrent ? "#3b82f6" : "transparent"} />
          <Text style={[styles.badgeText, { color: isCurrent ? "#3b82f6" : "#52525b" }]}>
            {isCurrent ? `CURRENT: ${title}` : `${progress}% SYNC`}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Cpu size={22} color="#4b5563" />
          </View>
          
          <View style={styles.titleInfo}>
            <Text style={[styles.cardTitle, isLocked && styles.textLocked]} numberOfLines={2}>
              {isLocked ? 'ENCRYPTED DATA SEGMENT' : title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {isLocked ? 'Access denied. Complete preceding nodes to unlock neural path.' : subtitle}
            </Text>
          </View>

          {isSaved && onDelete && (
             <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
                <Trash2 size={18} color="#ef4444" />
             </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.progressRow}>
            <Text style={styles.evolutionLabel}>NEURAL EVOLUTION</Text>
            <Text style={styles.progressValue}>{isCompleted ? 'STABILIZED' : `${Math.floor(progress / 20)}/6 STEPS`}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill, 
              { 
                width: `${progress}%`, 
                backgroundColor: isCompleted ? '#10b981' : isLocked ? '#1f2937' : '#3b82f6' 
              }
            ]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const RoadmapScreen = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [officialPaths, setOfficialPaths] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [showSavedPaths, setShowSavedPaths] = useState(false);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      if (currentUser?.name) {
        const userRes = await api.get(`/user/info/${currentUser.name}`);
        if (userRes.success) {
          setUserProgress(userRes.data.roadmapProgress);
        }
      }

      const [customRes, officialRes] = await Promise.all([
        roadmapService.getRoadmaps(),
        api.get('/topic')
      ]);
      
      if (customRes.success) setRoadmaps(customRes.roadmaps || []);
      if (officialRes.success) setOfficialPaths(officialRes.data || []);
    } catch (err) {
      console.error('Failed to load roadmaps', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoadmaps();
  };

  const handleGenerate = async () => {
    if (!goalInput.trim()) return;
    try {
      setIsGenerating(true);
      const res = await roadmapService.generateRoadmap(goalInput);
      if (res.success) {
        setGoalInput('');
        await fetchRoadmaps();
        if (res.roadmap?.nodes?.length > 0) {
          setSelectedNode(res.roadmap.nodes[0]);
        }
      }
    } catch (err) {
      console.error('Failed to generate roadmap', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const EMERGENCY_VIDEOS = {
    'graph': 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    'bfs': 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    'dfs': 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    'adjacency': 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    'representation': 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
    'linked list': 'https://www.youtube.com/watch?v=f9vT8H_mY20',
    'stack': 'https://www.youtube.com/watch?v=KInG04mAjO0',
    'queue': 'https://www.youtube.com/watch?v=KInG04mAjO0',
    'dynamic programming': 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
    'sorting': 'https://www.youtube.com/watch?v=RfXt_qH61n8',
    'recursion': 'https://www.youtube.com/watch?v=RfXt_qH61n8',
    'react': 'https://www.youtube.com/watch?v=hQAHSlTtcmY',
    'state': 'https://www.youtube.com/watch?v=O6P86uwfdNY',
    'hooks': 'https://www.youtube.com/watch?v=O6P86uwfdNY',
    'useeffect': 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
    'props': 'https://www.youtube.com/watch?v=hQAHSlTtcmY',
    'javascript': 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    'nodejs': 'https://www.youtube.com/watch?v=ENrzD9HAZK4',
    'express': 'https://www.youtube.com/watch?v=7H_QH9nipRLk',
    'mongodb': 'https://www.youtube.com/watch?v=pWbMrx5rVBE',
    'sql': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    'database': 'https://www.youtube.com/watch?v=pWbMrx5rVBE',
    'css': 'https://www.youtube.com/watch?v=1PnVor36_40',
    'html': 'https://www.youtube.com/watch?v=ok-plXXHlWw',
    'api': 'https://www.youtube.com/watch?v=GZvSYJDk-us',
    'auth': 'https://www.youtube.com/watch?v=27f8S7D-73E',
    'frontend': 'https://www.youtube.com/watch?v=hQAHSlTtcmY',
    'backend': 'https://www.youtube.com/watch?v=ENrzD9HAZK4'
  };

  const GLOBAL_FALLBACK = 'https://www.youtube.com/watch?v=zOjov-2OZ0E'; // CS50

  const handleSelectRoadmap = async (roadmap) => {
    setLoading(true);
    if (roadmap.isOfficial) {
      try {
        const res = await api.get(`/topic/${roadmap.topicId || roadmap._id}`);
        if (res.success) {
          const tId = res.data.topicId;
          const mId = res.data._id;
          let status = 'locked';
          if (userProgress?.completedTopicIds?.includes(tId) || userProgress?.completedTopicIds?.includes(mId)) status = 'completed';
          else if (userProgress?.unlockedTopicIds?.includes(tId) || userProgress?.unlockedTopicIds?.includes(mId)) status = 'current';
          else if (officialPaths[0]?.topicId === tId) status = 'current';

          setSelectedRoadmap({
            title: roadmap.title || roadmap.name,
            nodes: [{ ...res.data, status, isOfficial: true }]
          });
        }
      } catch (err) {
        console.error('Failed to load official topic', err);
      } finally {
        setLoading(false);
      }
    } else {
      setShowSavedPaths(false);
      try {
        const res = await roadmapService.getRoadmapById(roadmap._id);
        if (res.success && res.roadmap) {
          const roadmapData = res.roadmap;
          
          // Enrichment: Find missing videos from official topics
          const enrichedNodes = await Promise.all(roadmapData.nodes.map(async (n, i) => {
            const tId = n.topicId;
            const mId = n._id;
            let status = 'locked';
            if (userProgress?.completedTopicIds?.includes(tId) || userProgress?.completedTopicIds?.includes(mId)) status = 'completed';
            else if (userProgress?.unlockedTopicIds?.includes(tId) || userProgress?.unlockedTopicIds?.includes(mId)) status = 'current';
            else if (i === 0) status = 'current';
            
            let enrichedVideo = n.videoUrl || n.video || n.video_url;
            
            // If video is missing, try to find a match in official paths
            if (!enrichedVideo) {
              const match = officialPaths.find(p => 
                p.title?.toLowerCase().includes(n.title?.toLowerCase()) || 
                n.title?.toLowerCase().includes(p.title?.toLowerCase())
              );
              if (match) {
                try {
                  const topicRes = await api.get(`/topic/${match.topicId || match._id}`);
                  if (topicRes.success) enrichedVideo = topicRes.data.videoUrl;
                } catch (e) { /* ignore */ }
              }
            }

            // If video is still missing, check Emergency Dictionary
            if (!enrichedVideo) {
              const lowerTitle = n.title?.toLowerCase() || '';
              for (const [key, val] of Object.entries(EMERGENCY_VIDEOS)) {
                if (lowerTitle.includes(key)) {
                  enrichedVideo = val;
                  break;
                }
              }
            }

            // Final Fallback: CS50 or similar
            if (!enrichedVideo) {
              enrichedVideo = GLOBAL_FALLBACK;
            }

            return {
              ...n,
              videoUrl: enrichedVideo,
              isCustom: true,
              roadmapId: roadmap._id,
              status
            };
          }));

          roadmapData.nodes = enrichedNodes;
          setSelectedRoadmap(roadmapData);
        }
      } catch (err) {
        console.error('Failed to select roadmap', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteRoadmap = async (id) => {
     try {
       const res = await roadmapService.deleteRoadmap(id);
       if (res.success) {
         fetchRoadmaps();
       }
     } catch (err) {
       console.error('Failed to delete roadmap', err);
     }
  };

  const calculateItemStatus = (item) => {
    if (!userProgress) return 'locked';
    const topicId = item.topicId;
    if (userProgress.completedTopicIds?.includes(topicId)) return 'completed';
    if (userProgress.unlockedTopicIds?.includes(topicId)) return 'current';
    const firstTopicId = officialPaths[0]?.topicId;
    if (topicId === firstTopicId && (!userProgress.unlockedTopicIds || userProgress.unlockedTopicIds.length === 0)) {
       return 'current';
    }
    return 'locked';
  };

  const calculateItemProgress = (item) => {
    if (!userProgress) return 0;
    const topicId = item.topicId;
    if (userProgress.completedTopicIds?.includes(topicId)) return 100;
    if (!userProgress.topicProgress) return 0;
    const progress = userProgress.topicProgress[topicId];
    if (!progress) return 0;
    if (progress.completed) return 100;
    let score = 0;
    if (progress.videoWatched) score += 33;
    if (progress.quizzesPassed?.length > 0) score += 33;
    if (progress.problemSolved) score += 34;
    return Math.min(score, 99);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.archiveBadge}>
            <View style={styles.blueDot} />
            <Text style={styles.archiveText}>NEURAL ARCHIVE</Text>
          </View>
          <Text style={styles.headerTitle}>Neural <Text style={{ color: '#3b82f6' }}>Path</Text></Text>
        </View>
        <TouchableOpacity style={styles.savedPathsBtn} onPress={() => setShowSavedPaths(true)}>
           <History size={16} color="white" />
        </TouchableOpacity>
      </View>

      {selectedRoadmap ? (
        <View style={{ flex: 1 }}>
          <View style={styles.treeHeader}>
            <TouchableOpacity onPress={() => setSelectedRoadmap(null)} style={styles.backBtnSmall}>
              <ChevronLeft size={18} color="#3b82f6" />
              <Text style={styles.backBtnText}>BACK TO HUB</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <NeuralPath 
              roadmap={selectedRoadmap} 
              onNodeSelect={(node) => setSelectedNode(node)} 
            />
          </ScrollView>
        </View>
      ) : (
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          <View style={styles.homeLayer}>
            <View style={styles.inputBox}>
                 <TextInput 
                    style={styles.goalInput}
                    placeholder="Describe your learning mission (e.g. 'Master Neural Networks')..."
                    placeholderTextColor="#4b5563"
                    multiline
                    value={goalInput}
                    onChangeText={setGoalInput}
                 />
                 <TouchableOpacity 
                   disabled={!goalInput.trim() || isGenerating}
                   style={[styles.generateBtn, isGenerating && { opacity: 0.7 }]}
                   onPress={handleGenerate}
                 >
                   {isGenerating ? <ActivityIndicator color="white" size="small" /> : <Zap size={18} color="white" fill="white" />}
                   <Text style={styles.generateBtnText}>{isGenerating ? 'COMPILING...' : 'GENERATE'}</Text>
                 </TouchableOpacity>
              </View>

            <Text style={styles.sectionLabel}>OFFICIAL PATHWAYS</Text>
            {officialPaths.map((item) => (
              <PathCard 
                key={item._id || item.topicId}
                title={item.title || item.name || "Neural Topic"}
                subtitle={`${item.linkedProblems?.length || 1} Stages`}
                progress={calculateItemProgress(item)}
                status={calculateItemStatus(item)}
                onPress={() => handleSelectRoadmap({ ...item, isOfficial: true })}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Saved Paths Modal */}
      <Modal
        visible={showSavedPaths}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedPaths(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.savedPathsModal}>
            <View style={styles.modalHeader}>
               <View style={styles.modalTitleBox}>
                 <View style={styles.archiveBadge}>
                    <View style={styles.blueDot} />
                    <Text style={styles.archiveText}>PERSONAL ARCHIVE</Text>
                 </View>
                 <Text style={styles.modalTitle}>Neural <Text style={{ color: '#3b82f6' }}>Trajectories</Text></Text>
                 <Text style={styles.modalSubtitle}>Manage your custom learning paths and track your evolution through the neural grid.</Text>
               </View>
               <TouchableOpacity onPress={() => setShowSavedPaths(false)} style={styles.modalClose}>
                 <X size={20} color="#fff" />
               </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 24 }}>
               {roadmaps.length > 0 ? (
                 roadmaps.map(item => (
                   <PathCard 
                     key={item._id}
                     title={item.title}
                     subtitle={item.goal}
                     progress={item.progress || 0}
                     status={item.progress === 100 ? 'completed' : 'current'}
                     isSaved={true}
                     onPress={() => handleSelectRoadmap(item)}
                     onDelete={() => handleDeleteRoadmap(item._id)}
                   />
                 ))
               ) : (
                 <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No saved trajectories found.</Text>
                 </View>
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mission Dashboard Overlay */}
      <Modal
        visible={!!selectedNode}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedNode(null)}
      >
        {selectedNode && (
          <MissionDashboard 
            node={selectedNode} 
            onBack={() => setSelectedNode(null)} 
            onComplete={fetchRoadmaps}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#0d1117' },
  headerInfo: { flex: 1 },
  archiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  blueDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3b82f6' },
  archiveText: { color: '#484f58', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  savedPathsBtn: { width: 44, height: 44, backgroundColor: '#161b22', alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#30363d' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  homeLayer: { paddingHorizontal: 24 },
  inputBox: { backgroundColor: '#0d0d0e', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  goalInput: { color: '#fff', fontSize: 15, height: 80, textAlignVertical: 'top', marginBottom: 20, fontWeight: '600' },
  generateBtn: { backgroundColor: '#2563eb', height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  generateBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  sectionLabel: { color: '#8b949e', fontSize: 12, fontWeight: '900', marginBottom: 20, marginTop: 10, letterSpacing: 2 },
  
  pathCard: { backgroundColor: '#0d0d0e', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#161b22', position: 'relative' },
  cardCurrent: { borderColor: '#3b82f640' },
  cardLocked: { opacity: 0.5 },
  cardBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#161b22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#30363d', marginBottom: 16 },
  badgeText: { fontSize: 8, fontWeight: '900' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#161b22', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: '#30363d' },
  titleInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 6 },
  cardSubtitle: { color: '#52525b', fontSize: 12, fontWeight: '500', lineHeight: 18 },
  textLocked: { color: '#3f3f46' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#ffffff05', paddingTop: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  evolutionLabel: { color: '#404040', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  progressValue: { color: '#fff', fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 6, backgroundColor: '#0a0a0a', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  deleteBtn: { position: 'absolute', bottom: 0, right: 0, padding: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  savedPathsModal: { backgroundColor: '#0d1117', height: height * 0.9, borderTopLeftRadius: 50, borderTopRightRadius: 50, borderTopWidth: 1, borderTopColor: '#30363d' },
  modalHeader: { padding: 40, paddingBottom: 20 },
  modalTitleBox: { flex: 1 },
  modalTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 16, letterSpacing: -1.5 },
  modalSubtitle: { color: '#8b949e', fontSize: 14, fontWeight: '500', lineHeight: 22 },
  modalClose: { position: 'absolute', top: 40, right: 40, width: 48, height: 48, borderRadius: 24, backgroundColor: '#161b22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#30363d' },
  modalScroll: { flex: 1 },

  emptyState: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#484f58', fontSize: 14, fontWeight: '600' },

  treeHeader: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0d1117' },
  backBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#161b22', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#30363d' },
  backBtnText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});

export default RoadmapScreen;
