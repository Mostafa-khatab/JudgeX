import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { 
  Activity, 
  Zap, 
  Target, 
  Lightbulb, 
  Languages, 
  ArrowRight,
  Brain,
  X,
  Send,
  Cpu,
  Trash2,
  Sparkles,
  Bot
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import chatbotService from '../services/chatbotService';
import theme, { colors } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const TOOLS = [
  {
    id: 'complexity',
    title: 'Complexity Analyzer',
    subtitle: 'Neural Metrics',
    description: 'Advanced algorithmic depth analysis for time and space complexity.',
    icon: Activity,
    color: '#0ea5e9', // Cyan
    glow: 'rgba(14, 165, 233, 0.4)',
  },
  {
    id: 'optimizer',
    title: 'Code Optimizer',
    subtitle: 'Neural Optimization',
    description: 'AI-driven refactoring for peak performance and idiomatic cleanliness.',
    icon: Zap,
    color: '#8b5cf6', // Purple
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'edge_case',
    title: 'Edge Case Hunter',
    subtitle: 'Adversarial Testing',
    description: 'Stress-test your logic with automatically generated adversarial inputs.',
    icon: Target,
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'algo_consultant',
    title: 'Algo Consultant',
    subtitle: 'Strategic Guidance',
    description: 'Strategic hints and architectural guidance for difficult problems.',
    icon: Lightbulb,
    color: '#10b981', // Green
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'translator',
    title: 'Code Translator',
    subtitle: 'Language Migration',
    description: 'Seamless cross-language logic migration with context preservation.',
    icon: Languages,
    color: '#f59e0b', // Orange
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'neural_path',
    title: 'Neural Path',
    subtitle: 'Learning Trajectory',
    description: 'Generate customized learning trajectories for your coding objectives.',
    icon: Target,
    color: '#d946ef', // Magenta
    glow: 'rgba(217, 70, 239, 0.4)',
  },
];

const AILabScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Animations
  const fadeAnims = useRef(TOOLS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(TOOLS.map(() => new Animated.Value(30))).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.stagger(200, TOOLS.map((_, i) => 
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ])
    )).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const handleOpenTool = (tool) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
    setResult(null);
    setInputText('');
  };

  const initiateAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    try {
      // Simulate or call AI service
      const response = await chatbotService.sendMessage({
        message: `${selectedTool.title}: ${inputText}`,
        mode: selectedTool.id
      });
      setResult(response.data?.message || response.message);
    } catch (err) {
      setResult('⚠️ Analysis failed. Please verify your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderGridBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.gridContainer}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={styles.gridLineV} />
        ))}
        {[...Array(40)].map((_, i) => (
          <View key={i} style={styles.gridLineH} />
        ))}
      </View>
      <LinearGradient
        colors={['rgba(10, 10, 10, 0.8)', '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );

  const renderToolCard = (tool, index) => {
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <Animated.View 
        key={tool.id}
        style={{
          opacity: fadeAnims[index],
          transform: [
            { translateY: slideAnims[index] },
            { translateY: index === 1 ? floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10]
              }) : 0 
            },
            { scale: scaleAnim }
          ]
        }}
      >
        <Pressable 
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleOpenTool(tool)}
          style={styles.card}
        >
          <View style={[styles.iconGlow, { backgroundColor: tool.glow }]} />
          <View style={styles.iconWrapper}>
            <tool.icon size={32} color={tool.color} />
          </View>
          
          <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
          <Text style={styles.cardTitle}>{tool.title}</Text>
          <Text style={styles.cardDescription}>{tool.description}</Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.exploreText}>Explore Engine</Text>
            <ArrowRight size={16} color="#fff" style={{ marginLeft: 8 }} />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderNeuralModal = () => (
    <Modal visible={isModalOpen} animationType="slide" transparent>
      <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedTool?.title}</Text>
              <Text style={styles.modalSubtitle}>Neural Session // SECURE</Text>
            </View>
            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Input Area */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.sectionLabel}>SOURCE INPUT</Text>
              <TouchableOpacity onPress={() => setInputText('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalTextInput}
              multiline
              placeholder="Paste your logic or problem description here..."
              placeholderTextColor="#52525b"
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.initiateBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={initiateAnalysis}
            disabled={isAnalyzing || !inputText.trim()}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.btnContent}>
                {isAnalyzing ? <ActivityIndicator color="#fff" /> : <><Send size={18} color="#fff" style={{ marginRight: 10 }} /><Text style={styles.btnText}>Initiate Analysis</Text></>}
              </View>
            </LinearGradient>
            <View style={styles.btnGlow} />
          </TouchableOpacity>

          {/* Result Area */}
          <View style={styles.resultSection}>
            <Text style={styles.sectionLabel}>NEURAL RESULT</Text>
            <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
              {isAnalyzing ? (
                <View style={styles.shimmerContainer}>
                  <Animated.View style={[styles.shimmer, { opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]} />
                  <Text style={styles.awaitingText}>Synthesizing logic...</Text>
                </View>
              ) : result ? (
                <Text style={styles.resultText}>{result}</Text>
              ) : (
                <View style={styles.awaitingContainer}>
                  <Bot size={40} color="#27272a" />
                  <Text style={styles.awaitingText}>Awaiting Input...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderGridBackground()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View style={styles.badge}>
            <Sparkles size={12} color="#3b82f6" />
            <Text style={styles.badgeText}>CORE_SYSTEM_READY</Text>
          </View>
          <Text style={styles.mainTitle}>Neural Laboratory</Text>
          <Text style={styles.mainSub}>Advanced AI tools for hyper-efficient coding.</Text>
        </View>
        
        <View style={styles.toolsContainer}>
          {TOOLS.map(renderToolCard)}
        </View>
      </ScrollView>

      {renderNeuralModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineV: {
    position: 'absolute',
    width: 1,
    height: height,
    backgroundColor: '#3b82f6',
    left: 0,
    transform: [{ translateX: width / 20 }],
  },
  gridLineH: {
    position: 'absolute',
    height: 1,
    width: width,
    backgroundColor: '#3b82f6',
    top: 0,
    transform: [{ translateY: height / 40 }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 16,
    gap: 8,
  },
  badgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  mainSub: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  toolsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#171717',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  iconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.4,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  cardSubtitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  cardDescription: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 20,
  },
  exploreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: height * 0.85,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#1c1c1e',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 20,
    color: '#fff',
    fontSize: 15,
    height: 180,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  initiateBtn: {
    marginBottom: 32,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
  },
  btnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  btnGlow: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: '80%',
    height: 20,
    backgroundColor: '#3b82f6',
    opacity: 0.3,
    borderRadius: 10,
    filter: 'blur(10px)',
  },
  resultSection: {
    flex: 1,
  },
  resultContainer: {
    marginTop: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  awaitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 16,
  },
  awaitingText: {
    color: '#52525b',
    fontSize: 14,
    fontWeight: '700',
  },
  resultText: {
    color: '#e2e2e7',
    fontSize: 14,
    lineHeight: 24,
  },
  shimmerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 16,
  },
  shimmer: {
    width: 60,
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
});

export default AILabScreen;
