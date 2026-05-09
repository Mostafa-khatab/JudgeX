import React, { useMemo, useEffect, useRef } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  TouchableOpacity
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Check, Lock, Target, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const IS_WIDE = width > 600;
const MAX_WIDTH = 450;
const CARD_WIDTH = Math.min(width * 0.78, MAX_WIDTH);
const NODE_HEIGHT = 120; 
const VERTICAL_GAP = 100; 
const HORIZONTAL_OFFSET = IS_WIDE ? 50 : width * 0.12;

const NeuralNode = ({ node, index, onSelect }) => {
  const isCompleted = node.status === 'completed';
  const isLocked = node.status === 'locked';
  const isCurrent = node.status === 'current' || (!isCompleted && !isLocked);
  const isEven = index % 2 === 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    if (isLocked) return;
    Animated.spring(scaleAnim, { toValue: 1.02, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const nodeStyle = {
    width: CARD_WIDTH,
    minHeight: NODE_HEIGHT,
    backgroundColor: '#0d0d0e',
    borderRadius: 20,
    padding: 20,
    paddingTop: 40,
    borderWidth: 1.5,
    borderColor: isLocked ? '#161b22' : isCompleted ? '#10b98140' : '#3b82f640',
    opacity: isLocked ? 0.5 : 1,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <Animated.View style={[
      styles.nodeWrapper,
      { 
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          { translateX: isEven ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET }
        ]
      }
    ]}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isLocked && onSelect(node)}
        style={[styles.card, nodeStyle]}
      >
        <View style={styles.topicBadge}>
          <View style={styles.blueDot} />
          <Text style={styles.topicBadgeText}>TOPIC</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 10, lineHeight: 28 }} numberOfLines={2}>
            {node.title}
          </Text>
          <Text style={{ color: '#8b949e', fontSize: 13, fontWeight: '500', lineHeight: 20 }} numberOfLines={3}>
            {node.description || 'Access mission logs to begin neural synchronization for this topic segment.'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.progressHeader}>
             <Text style={styles.progressLabel}>MASTERED</Text>
             <Text style={styles.progressValue}>{isCompleted ? '100%' : isCurrent ? '33%' : '0%'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill, 
              { 
                width: isCompleted ? '100%' : isCurrent ? '33%' : '0%',
                backgroundColor: isCompleted ? '#10b981' : '#3b82f6'
              }
            ]} />
          </View>
        </View>

        {isCompleted && (
          <View style={styles.masteryOverlay}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.checkCircle}
            >
              <Check size={32} color="white" strokeWidth={4} />
            </LinearGradient>
          </View>
        )}

        {isLocked && (
          <View style={styles.lockOverlay}>
             <Lock size={24} color="#30363d" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const NeuralPath = ({ roadmap, onNodeSelect }) => {
  const nodes = roadmap?.nodes || [];
  const totalProgress = useMemo(() => {
    if (nodes.length === 0) return 0;
    const completed = nodes.filter(n => n.status === 'completed').length;
    return Math.floor((completed / nodes.length) * 100);
  }, [nodes]);

  const pathData = useMemo(() => {
    if (nodes.length < 2) return '';
    const stepY = NODE_HEIGHT + VERTICAL_GAP;
    const startY = 160 + NODE_HEIGHT / 2;
    const getCenterX = (i) => width / 2 + (i % 2 === 0 ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET);

    let d = `M ${getCenterX(0)} ${startY}`;
    for (let i = 1; i < nodes.length; i++) {
      const prevX = getCenterX(i - 1);
      const currX = getCenterX(i);
      const prevY = (i - 1) * stepY + startY;
      const currY = i * stepY + startY;
      const cp1y = prevY + (currY - prevY) / 1.5;
      const cp2y = currY - (currY - prevY) / 1.5;
      d += ` C ${prevX} ${cp1y}, ${currX} ${cp2y}, ${currX} ${currY}`;
    }
    return d;
  }, [nodes]);

  return (
    <View style={styles.container}>
      {/* Roadmap Header */}
      <View style={styles.roadmapHeader}>
         <View style={styles.headerTop}>
            <View style={styles.pathIndicator}>
               <View style={styles.blueDot} />
               <Text style={styles.pathIndicatorText}>NEURAL TRAJECTORY</Text>
            </View>
            <View style={styles.currentMissionBadge}>
               <Text style={styles.currentMissionText}>CURRENT: {nodes.find(n => n.status === 'current')?.title || 'INITIALIZING'}</Text>
            </View>
         </View>
         
         <View style={styles.headerMain}>
            <Text style={styles.roadmapTitle} numberOfLines={1}>{roadmap?.title || 'Neural Pathway'}</Text>
            <View style={styles.headerRight}>
               <View style={styles.headerProgressBox}>
                  <Text style={styles.headerProgressLabel}>MISSION PROGRESS</Text>
                  <View style={styles.headerProgressRow}>
                     <View style={styles.headerProgressTrack}>
                        <View style={[styles.headerProgressFill, { width: `${totalProgress}%` }]} />
                     </View>
                     <Text style={styles.headerProgressVal}>{totalProgress}%</Text>
                  </View>
               </View>
               <TouchableOpacity style={styles.trashBtn}>
                  <Trash2 size={18} color="#484f58" />
               </TouchableOpacity>
            </View>
         </View>
      </View>

      <View style={styles.svgContainer}>
        <Svg height={nodes.length * (NODE_HEIGHT + VERTICAL_GAP) + 800} width={width}>
          <Defs>
            <SvgGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3b82f6" />
              <Stop offset="0.5" stopColor="#60a5fa" />
              <Stop offset="1" stopColor="#3b82f6" />
            </SvgGradient>
          </Defs>
          <Path d={pathData} stroke="#3b82f6" strokeWidth="12" fill="none" opacity={0.05} strokeLinecap="round" />
          <Path 
            d={pathData} 
            stroke="url(#pathGrad)" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
            strokeDasharray="10, 8" 
          />
        </Svg>
      </View>

      <View style={styles.nodesContainer}>
        {nodes.map((node, idx) => (
          <NeuralNode key={node._id || idx} node={node} index={idx} onSelect={onNodeSelect} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  roadmapHeader: { padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#ffffff05' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  pathIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blueDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3b82f6' },
  pathIndicatorText: { color: '#484f58', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  currentMissionBadge: { backgroundColor: '#1e3a8a40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f630' },
  currentMissionText: { color: '#3b82f6', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  headerMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roadmapTitle: { color: '#fff', fontSize: 28, fontWeight: '900', flex: 1, letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerProgressBox: { width: 140 },
  headerProgressLabel: { color: '#484f58', fontSize: 7, fontWeight: '900', textAlign: 'right', marginBottom: 6, letterSpacing: 1 },
  headerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerProgressTrack: { flex: 1, height: 4, backgroundColor: '#161b22', borderRadius: 2, overflow: 'hidden' },
  headerProgressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  headerProgressVal: { color: '#fff', fontSize: 10, fontWeight: '900' },
  trashBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#161b22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#30363d' },

  svgContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  nodesContainer: { paddingTop: 60, paddingBottom: 200, alignItems: 'center' },
  nodeWrapper: { width: CARD_WIDTH, marginBottom: VERTICAL_GAP },
  card: { backgroundColor: '#0d1117', borderRadius: 20, padding: 20, minHeight: NODE_HEIGHT, position: 'relative' },
  cardCurrent: { borderColor: '#3b82f650', backgroundColor: '#0d1117' },
  cardLocked: { opacity: 0.4 },
  topicBadge: { position: 'absolute', top: -10, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f640' },
  topicBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  cardContent: { marginBottom: 20, marginTop: 4 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8, lineHeight: 28 },
  cardDesc: { color: '#52525b', fontSize: 12, fontWeight: '500', lineHeight: 18 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#ffffff05', paddingTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { color: '#404040', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  progressValue: { color: '#fff', fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 6, backgroundColor: '#0a0a0a', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  masteryOverlay: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -40 }, { translateY: -60 }], zIndex: 100 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowRadius: 30, shadowOpacity: 0.6, borderWidth: 4, borderColor: '#34d399' },
  lockOverlay: { position: 'absolute', top: 24, right: 24 },
});

export default NeuralPath;
