import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { 
  PlayCircle, 
  HelpCircle, 
  Code, 
  CheckCircle, 
  Lock, 
  ChevronLeft,
  ArrowRight,
  ShieldAlert
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const MissionDashboard = ({ node, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [videoChecked, setVideoChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const steps = useMemo(() => {
    const list = [
      { id: 0, title: 'Video Lesson', type: 'video', icon: PlayCircle },
      { id: 1, title: 'Neural Quiz', type: 'quiz', icon: HelpCircle },
      { id: 2, title: 'Final Combat Trial', type: 'problem', icon: Code },
    ];
    return list;
  }, []);

  const totalSteps = steps.length;
  const isVideoStep = currentStep === 0;
  const isQuizStep = currentStep === 1;
  const isProblemStep = currentStep === 2;

  const currentQuiz = {
    question: "What is the primary characteristic of this neural node's architecture?",
    options: ["Asynchronous Flow", "Deterministic Logic", "Quantum State Synchronization", "Linear Trajectory"],
    answer: "Quantum State Synchronization"
  };

  const canNext = useMemo(() => {
    if (isVideoStep) return videoChecked;
    if (isQuizStep) return selectedOption === currentQuiz.answer;
    return false;
  }, [currentStep, videoChecked, selectedOption]);

  const handleNext = () => {
    if (canNext && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    }
  };

  const getStepStatus = (id) => {
    if (id < currentStep) return 'completed';
    if (id === currentStep) return 'active';
    return 'locked';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backIcon}>
          <ChevronLeft size={24} color="#8b949e" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSub}>MISSION PLAN</Text>
          <Text style={styles.headerTitle}>{node.title}</Text>
        </View>
      </View>

      <View style={styles.mainLayout}>
        {/* Step Indicator (Sidebar style) */}
        <View style={styles.sidebar}>
          <View style={styles.verticalLine} />
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const isActive = status === 'active';
            const isDone = status === 'completed';

            return (
              <TouchableOpacity 
                key={step.id} 
                onPress={() => step.id <= currentStep && setCurrentStep(step.id)}
                style={styles.stepItem}
                disabled={status === 'locked'}
              >
                <View style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                  status === 'locked' && styles.stepDotLocked
                ]}>
                  {isDone ? <CheckCircle size={14} color="white" /> : 
                   status === 'locked' ? <Lock size={12} color="#525252" /> : 
                   <Icon size={14} color="white" />}
                </View>
                <Text style={[styles.stepText, isActive && styles.stepTextActive]}>{step.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Area */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
          <View style={styles.contentHeader}>
            <Text style={styles.phaseTitle}>{steps[currentStep].title}</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>Phase {currentStep + 1} / {totalSteps}</Text>
            </View>
          </View>

          {isVideoStep && (
            <View style={styles.phaseContent}>
              <View style={styles.videoContainer}>
                {node.videoUrl ? (
                  <WebView 
                    style={{ flex: 1 }}
                    source={{ uri: node.videoUrl.replace('watch?v=', 'embed/') }}
                    allowsFullscreenVideo
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <PlayCircle size={48} color="#3b82f6" opacity={0.5} />
                    <Text style={styles.placeholderText}>Neural Lesson Video</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.checkboxCard}
                onPress={() => setVideoChecked(!videoChecked)}
              >
                <View style={[styles.checkbox, videoChecked && styles.checkboxChecked]}>
                  {videoChecked && <CheckCircle size={14} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>I have mastered this visual lesson</Text>
              </TouchableOpacity>
            </View>
          )}

          {isQuizStep && (
            <View style={styles.phaseContent}>
              <View style={styles.quizBox}>
                <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
              </View>
              <View style={styles.optionsGrid}>
                {currentQuiz.options.map((opt, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.optionBtn, selectedOption === opt && styles.optionBtnSelected]}
                    onPress={() => setSelectedOption(opt)}
                  >
                    <View style={[styles.optionRadio, selectedOption === opt && styles.optionRadioSelected]}>
                      {selectedOption === opt && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.optionText, selectedOption === opt && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedOption && !canNext && (
                <View style={styles.errorCard}>
                   <ShieldAlert size={16} color="#fb7185" />
                   <Text style={styles.errorText}>LOGICAL MISMATCH DETECTED. TRY AGAIN.</Text>
                </View>
              )}
            </View>
          )}

          {isProblemStep && (
            <View style={styles.phaseContent}>
              <View style={styles.trialCard}>
                <View style={styles.trialIconContainer}>
                  <Code size={40} color="#818cf8" />
                </View>
                <Text style={styles.trialTitle}>Final Combat Trial</Text>
                <Text style={styles.trialDesc}>
                  Apply everything you've learned. Solve this algorithm challenge to secure this topic's completion. Accepted submissions are automatically synchronized.
                </Text>
              </View>

              <TouchableOpacity style={styles.executeBtn}>
                <Code size={20} color="#3b82f6" />
                <Text style={styles.executeBtnText}>EXECUTE CODE TRIAL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.verifyBtn}>
                <CheckCircle size={20} color="#10b981" />
                <Text style={styles.verifyBtnText}>VERIFY SYNCHRO</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.retreatBtn} 
          onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          {currentStep > 0 && <Text style={styles.retreatText}>Retreat to Phase {currentStep}</Text>}
        </TouchableOpacity>

        {!isProblemStep && (
          <TouchableOpacity 
            style={[styles.advanceBtn, !canNext && styles.advanceBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.advanceText}>Advance Phase</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#30363d50' },
  backIcon: { marginRight: 15 },
  headerTitleContainer: { flex: 1 },
  headerSub: { color: '#8b949e', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  mainLayout: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 60, alignItems: 'center', paddingTop: 40, borderRightWidth: 1, borderRightColor: '#30363d30' },
  verticalLine: { position: 'absolute', top: 60, bottom: 60, width: 2, backgroundColor: '#30363d' },
  stepItem: { marginBottom: 40, alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#161b22', borderWidth: 2, borderColor: '#30363d', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  stepDotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb', shadowColor: '#2563eb', shadowRadius: 10, shadowOpacity: 0.5 },
  stepDotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepDotLocked: { opacity: 0.5 },
  stepText: { display: 'none' }, // Labels not shown in sidebar for mobile width
  contentScroll: { flex: 1 },
  contentPadding: { padding: 20, paddingBottom: 100 },
  contentHeader: { marginBottom: 30 },
  phaseTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#161b22', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb' },
  progressText: { color: '#8b949e', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  phaseContent: { flex: 1 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#30363d' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderText: { color: '#484f58', fontSize: 12, fontWeight: '600' },
  checkboxCard: { marginTop: 24, backgroundColor: '#161b22', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#30363d' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#30363d', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxLabel: { color: '#c9d1d9', fontSize: 14, fontWeight: '700' },
  quizBox: { backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.1)', marginBottom: 24 },
  quizQuestion: { color: '#f0f6fc', fontSize: 18, fontWeight: '700', lineHeight: 26 },
  optionsGrid: { gap: 12 },
  optionBtn: { backgroundColor: '#161b22', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#30363d' },
  optionBtnSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  optionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#30363d', alignItems: 'center', justifyContent: 'center' },
  optionRadioSelected: { borderColor: '#fff' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  optionText: { color: '#c9d1d9', fontSize: 15, fontWeight: '700' },
  optionTextSelected: { color: '#fff' },
  errorCard: { marginTop: 20, padding: 12, backgroundColor: 'rgba(251, 113, 133, 0.1)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { color: '#fb7185', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  trialCard: { backgroundColor: 'rgba(129, 140, 248, 0.05)', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.1)', marginBottom: 24 },
  trialIconContainer: { padding: 20, backgroundColor: '#161b22', borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#30363d' },
  trialTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  trialDesc: { color: '#8b949e', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  executeBtn: { backgroundColor: '#161b22', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#30363d', marginBottom: 12 },
  executeBtnText: { color: '#8b949e', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  verifyBtn: { backgroundColor: '#161b22', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#30363d' },
  verifyBtnText: { color: '#8b949e', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  footer: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#30363d50' },
  retreatBtn: { flex: 1 },
  retreatText: { color: '#8b949e', fontSize: 11, fontWeight: '700' },
  advanceBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#2563eb', shadowRadius: 15, shadowOpacity: 0.4 },
  advanceBtnDisabled: { opacity: 0.3 },
  advanceText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});

export default MissionDashboard;
