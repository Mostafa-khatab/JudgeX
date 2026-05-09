import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { 
  ChevronRight, 
  Layout, 
  Maximize2, 
  MessageSquare,
  ChevronDown,
  Terminal,
  Send,
  Play,
  Clock,
  Database,
  Trophy,
  RefreshCw,
  X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import problemService from '../services/problemService';
import submissionService from '../services/submissionService';
import codeRunnerService from '../services/codeRunnerService';
import ProblemStatement from '../components/ProblemStatement';
import CodeEditor from '../components/CodeEditor';
import chatbotService from '../services/chatbotService';
import { Animated } from 'react-native';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'c++17', label: 'C++ 17' },
  { id: 'c++20', label: 'C++ 20' },
  { id: 'python3', label: 'Python 3' },
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
];

const CODE_TEMPLATES = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    cout.tie(NULL);\n    \n    return 0;\n}',
  python: '# Write your solution here\nimport sys\ninput = sys.stdin.read\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()',
};

const ProblemDetailScreen = ({ route, navigation }) => {
  const { problemId, contestId } = route.params;
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('description'); // options: description, details, code

  const [code, setCode] = useState(CODE_TEMPLATES.cpp);
  const [language, setLanguage] = useState('c++17');
  const [showLanguages, setShowLanguages] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [runOutput, setRunOutput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubId, setPendingSubId] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatAnim = useRef(new Animated.Value(2000)).current; // Start far off-screen
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [showResultModal, setShowResultModal] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const pollingRef = useRef(null);

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (!pendingSubId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const response = await submissionService.getSubmission(pendingSubId);
        const data = response.data || response;
        if (data.status && data.status !== 'PENDING' && data.status !== 'JUDGING') {
          setIsSubmitting(false);
          setPendingSubId(null);
          setSubmitResult(data);
          setShowResultModal(true);
          clearInterval(pollingRef.current);
        }
      } catch (err) { console.warn(err); }
    }, 1500);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pendingSubId]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await problemService.getProblem(problemId);
      let data = response.data || response;
      if (data && data._doc) data = data._doc;
      setProblem(data);
    } catch (err) { console.warn(err); }
    finally { setLoading(false); }
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    try {
      const response = await codeRunnerService.runCode({ code, language, input: runInput });
      console.log('Code Execution Response:', response);
      setRunOutput(response.output || response.data?.output || 'No output');
    } catch (err) { 
      console.error('Code Execution Error:', err);
      setRunOutput('Error: ' + (err.message || JSON.stringify(err))); 
    }
    finally { setIsRunning(false); }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    try {
      // Use the actual _id if available, otherwise fallback to route param
      const targetId = problem?._id || problemId;
      const response = await submissionService.submit(targetId, code, language, contestId);
      const data = response.data || response;
      
      console.log('Submission Response:', data);
      
      if (data.id || data._id || data.submissionId) {
        setPendingSubId(data.id || data._id || data.submissionId);
        Alert.alert('Success', 'Submission received! Judging in progress...');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) { 
      console.error('Submission Error:', err);
      Alert.alert('Error', err.message || 'Submission failed'); 
      setIsSubmitting(false); 
    }
  };

  const toggleChat = () => {
    const toValue = isChatOpen ? 2000 : 0;
    setIsChatOpen(!isChatOpen);
    Animated.spring(chatAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = { id: Date.now(), text: chatInput, sender: 'user' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatbotService.sendMessage({ 
        message: chatInput,
        context: { problemTitle: problem?.title, code }
      });
      console.log('AI Response:', response);
      const replyText = response.reply || response.message || response.data?.reply || response.data?.message || "I couldn't process that.";
      const aiMsg = { id: Date.now() + 1, text: replyText, sender: 'ai' };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Error:', err);
      const errorMsg = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting. Error: " + (err.message || 'Unknown'), sender: 'ai' };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const lineNumbers = Array.from({ length: Math.max(code.split('\n').length, 1) }, (_, i) => i + 1).join('\n');
  const selectedLanguage = LANGUAGES.find(l => l.id === language);

  const markdownStyles = {
    body: { color: '#d4d4d8', fontSize: 16, lineHeight: 24 },
    paragraph: { marginBottom: 15 },
    strong: { color: '#fff', fontWeight: 'bold' },
    code_inline: { backgroundColor: '#27272a', color: '#3b82f6', paddingHorizontal: 6, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    link: { color: '#3b82f6' },
    code_block: {
      backgroundColor: '#161616',
      color: '#d4d4d8',
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#262626',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginVertical: 10,
    },
    fence: {
      backgroundColor: '#161616',
      color: '#d4d4d8',
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#262626',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginVertical: 10,
    },
    table: {
      borderWidth: 1,
      borderColor: '#262626',
      borderRadius: 8,
      marginVertical: 10,
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: '#262626',
      flexDirection: 'row',
    },
    th: {
      flex: 1,
      padding: 8,
      backgroundColor: '#1a1a1a',
      color: '#fff',
      fontWeight: 'bold',
    },
    td: {
      flex: 1,
      padding: 8,
      color: '#d4d4d8',
    },
    bullet_list: {
      marginVertical: 10,
    },
    ordered_list: {
      marginVertical: 10,
    },
    list_item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    bullet_list_icon: {
      color: '#3b82f6',
      fontSize: 20,
      lineHeight: 24,
      marginRight: 10,
    },
    ordered_list_icon: {
      color: '#3b82f6',
      fontSize: 16,
      lineHeight: 24,
      marginRight: 10,
      fontWeight: 'bold',
    },
    blockquote: {
      backgroundColor: '#111',
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginVertical: 10,
      borderRadius: 4,
    },
  };

  const renderStatementTab = () => (
    <View style={styles.content}>
       <View style={styles.descriptionView}>
          <Text style={styles.title}>{problem?.title}</Text>
          <View style={styles.badgeRow}>
             <View style={[styles.pill, { backgroundColor: '#14532d' }]}>
                <Text style={[styles.pillText, { color: '#22c55e' }]}>EASY</Text>
             </View>
             {problem?.tags?.slice(0, 3).map((tag, i) => (
               <View key={i} style={[styles.pill, { backgroundColor: '#1e293b' }]}>
                  <Text style={[styles.pillText, { color: '#94a3b8' }]}>{tag.toUpperCase()}</Text>
               </View>
             ))}
          </View>
          <View style={styles.metaGrid}>
             <View style={styles.metaCard}>
                <Clock size={16} color="#3b82f6" />
                <View style={styles.metaCardRight}>
                   <Text style={styles.metaCardLabel}>TIME LIMIT</Text>
                   <Text style={styles.metaCardValue}>{problem?.timeLimit || 1}s</Text>
                </View>
             </View>
             <View style={styles.metaCard}>
                <Database size={16} color="#10b981" />
                <View style={styles.metaCardRight}>
                   <Text style={styles.metaCardLabel}>MEMORY</Text>
                   <Text style={styles.metaCardValue}>{problem?.memoryLimit || 256}MB</Text>
                </View>
             </View>
             <View style={styles.metaCard}>
                <Trophy size={16} color="#f59e0b" />
                <View style={styles.metaCardRight}>
                   <Text style={styles.metaCardLabel}>POINTS</Text>
                   <Text style={styles.metaCardValue}>{problem?.point || 8}p</Text>
                </View>
             </View>
          </View>
          
        {activeTab === 'description' ? (
           <ProblemStatement 
             task={problem?.task} 
             problemTitle={problem?.title} 
             problemId={problem?.id} 
           />
        ) : (
           <View style={{ padding: 20 }}>
              <Text style={styles.sectionHeading}>Problem Details</Text>
              <View style={styles.metaGrid}>
                 <View style={styles.metaCard}>
                    <Clock size={16} color="#3b82f6" />
                    <View style={styles.metaCardRight}>
                       <Text style={styles.metaCardLabel}>TIME LIMIT</Text>
                       <Text style={styles.metaCardValue}>{problem?.timeLimit || 1}s</Text>
                    </View>
                 </View>
                 <View style={styles.metaCard}>
                    <Database size={16} color="#10b981" />
                    <View style={styles.metaCardRight}>
                       <Text style={styles.metaCardLabel}>MEMORY</Text>
                       <Text style={styles.metaCardValue}>{problem?.memoryLimit || 256}MB</Text>
                    </View>
                 </View>
              </View>
           </View>
        )}
     </View>
    </View>
  );

  const renderCodeTab = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.codeHeader}>
         <View style={styles.codeHeaderLeft}><Layout size={18} color="#3b82f6" /><Text style={styles.codeHeaderText}>Code Editor</Text></View>
         <TouchableOpacity style={styles.langPicker} onPress={() => setShowLanguages(!showLanguages)}>
            <Text style={styles.langPickerText}>{selectedLanguage?.label}</Text><ChevronDown size={14} color="#94a3b8" />
         </TouchableOpacity>
      </View>
      {showLanguages && (
        <View style={styles.langDropdown}>
           <ScrollView>{LANGUAGES.map(l => (
                <TouchableOpacity key={l.id} style={styles.langOption} onPress={() => { setLanguage(l.id); setShowLanguages(false); }}>
                   <Text style={[styles.langOptionText, language === l.id && styles.langOptionTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}</ScrollView>
        </View>
      )}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
         <View style={styles.editorContainer}>
            <CodeEditor code={code} onChangeCode={setCode} language={language} />
         </View>
         <View style={styles.customInputSection}>
            <Text style={styles.customInputTitle}>Custom Input</Text>
            <TextInput style={styles.customInputField} multiline placeholder="Enter test input..." placeholderTextColor="#52525b" value={runInput} onChangeText={setRunInput} textAlignVertical="top" />
            
            <View style={{ marginTop: 25 }}>
                <Text style={styles.customInputTitle}>Output</Text>
                <View style={styles.codeBox}>
                  {isRunning ? <ActivityIndicator size="small" color="#3b82f6" style={{ padding: 10 }} /> : <Text selectable style={styles.codeBoxText}>{runOutput || 'Execution output will appear here...'}</Text>}
                </View>
            </View>
         </View>
      </ScrollView>
      <View style={styles.codeBottomBar}>
         <View style={styles.codeBottomLeft}><Layout size={14} color="#71717a" /><Text style={styles.codeBottomLang}>{language}</Text></View>
         <View style={styles.codeBottomActions}>
            <TouchableOpacity style={styles.submissionsBottomBtn} onPress={() => navigation.navigate('Submissions', { problemId: problem?._id })}>
               <Layout size={16} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.runBtn, isRunning && styles.btnDisabled]} onPress={handleRun}>
               {isRunning ? <ActivityIndicator size="small" color="#fff" /> : <><Play size={16} color="#fff" /><Text style={styles.runBtnText}>RUN</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.btnDisabled]} onPress={handleSubmit}>
               {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <><Send size={16} color="#fff" /><Text style={styles.submitBtnText}>SUBMIT</Text></>}
            </TouchableOpacity>
         </View>
      </View>
    </View>
  );

  const renderNeuralAssistant = () => (
    <Animated.View style={[styles.chatDrawer, { transform: [{ translateX: chatAnim }] }]}>
      <LinearGradient colors={['#2563eb', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
             <MessageSquare size={18} color="#fff" />
             <Text style={styles.chatHeaderTitle}>Neural Assistant</Text>
          </View>
          <View style={styles.chatHeaderActions}>
             <TouchableOpacity style={styles.chatHeaderBtn} onPress={() => setChatMessages([])} title="Clear Chat">
                <RefreshCw size={18} color="#fff" />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.chatHeaderBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }]} onPress={toggleChat} title="Close">
                <X size={22} color="#fff" />
             </TouchableOpacity>
          </View>
      </LinearGradient>
      <ScrollView style={styles.chatContent} showsVerticalScrollIndicator={true}>
         {chatMessages.length === 0 ? (
            <View style={styles.chatEmptyState}>
               <MessageSquare size={48} color="#1e293b" />
               <Text style={styles.chatEmptyText}>How can I help you with this problem?</Text>
            </View>
         ) : (
            chatMessages.map(msg => (
               <View key={msg.id} style={[styles.msgBubble, msg.sender === 'user' ? styles.userMsg : styles.aiMsg]}>
                  <Text style={styles.msgText}>{msg.text}</Text>
               </View>
            ))
         )}
         {isChatLoading && <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 10 }} />}
      </ScrollView>
      <View style={styles.chatInputWrapper}>
         <TextInput 
            style={styles.chatInput} 
            placeholder="Ask neural assistant..." 
            placeholderTextColor="#52525b" 
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSendMessage}
         />
         <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
            <Send size={18} color="#fff" />
         </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderResultModal = () => (
    <Modal visible={showResultModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { borderColor: submitResult?.status === 'AC' ? '#22c55e' : '#ef4444' }]}>
          <Text style={[styles.modalStatus, { color: submitResult?.status === 'AC' ? '#22c55e' : '#ef4444' }]}>
            {submitResult?.status === 'AC' ? 'ACCEPTED' : submitResult?.status || 'ERROR'}
          </Text>
          <View style={styles.modalDetails}>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Execution Time</Text>
              <Text style={styles.modalDetailValue}>{submitResult?.time || 0}s</Text>
            </View>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Memory Used</Text>
              <Text style={styles.modalDetailValue}>{submitResult?.memory || 0}MB</Text>
            </View>
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Score</Text>
              <Text style={styles.modalDetailValue}>{submitResult?.point || 0} / {problem?.point || 0}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowResultModal(false)}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderResultModal()}
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
         <View style={styles.breadcrumbRow}>
            <Text style={styles.breadcrumbGrey}>problems</Text>
            <ChevronRight size={14} color="#52525b" style={{ marginHorizontal: 4 }} />
            <Text style={styles.breadcrumbWhite} numberOfLines={1}>{problem?.id || '2098A'}</Text>
         </View>
      </View>
      <View style={styles.subTabsBar}>
         <TouchableOpacity style={[styles.subTab, activeTab === 'description' && styles.subTabActive]} onPress={() => setActiveTab('description')}>
            <Text style={[styles.subTabText, activeTab === 'description' && styles.subTabTextActive]}>Description</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.subTab, activeTab === 'details' && styles.subTabActive]} onPress={() => setActiveTab('details')}>
            <Text style={[styles.subTabText, activeTab === 'details' && styles.subTabTextActive]}>Details</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.subTab, activeTab === 'code' && styles.subTabActive]} onPress={() => setActiveTab('code')}>
            <Text style={[styles.subTabText, activeTab === 'code' && styles.subTabTextActive]}>Code</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.subTab} onPress={() => navigation.navigate('Submissions', { problemId: problem?._id })}>
            <Text style={styles.subTabText}>Submissions</Text>
         </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>{activeTab === 'code' ? renderCodeTab() : renderStatementTab()}</View>
      {!isChatOpen && (
        <TouchableOpacity style={styles.aiFab} onPress={toggleChat}>
          <MessageSquare size={24} color="#fff" />
          <View style={styles.aiFabBrain}><Terminal size={12} color="#fff" /></View>
        </TouchableOpacity>
      )}
      {renderNeuralAssistant()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', flex: 1.5 },
  breadcrumbGrey: { color: '#52525b', fontSize: 13 },
  breadcrumbWhite: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  mainTabToggle: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 8, padding: 3, marginHorizontal: 10 },
  mainTabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  mainTabBtnActive: { backgroundColor: '#27272a' },
  mainTabText: { color: '#52525b', fontSize: 11, fontWeight: 'bold' },
  mainTabTextActive: { color: '#fff' },
  topRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' },
  iconBtn: { backgroundColor: '#1a1a1a', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' },
  submissionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' },
  submissionsText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  subTabsBar: { flexDirection: 'row', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  subTab: { paddingVertical: 12, marginRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabActive: { borderBottomColor: '#3b82f6' },
  subTabText: { color: '#52525b', fontSize: 14, fontWeight: '500' },
  subTabTextActive: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  descriptionView: { flex: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 15 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  pillText: { fontSize: 11, fontWeight: '900' },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    gap: 10,
  },
  metaCardRight: {
    flex: 1,
  },
  metaCardLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  metaCardValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeading: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  exampleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exampleTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  ioWrapper: { width: '100%' },
  ioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 4 },
  ioLabel: { color: '#3b82f6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  exampleBox: { backgroundColor: '#0d0d0d', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1e293b', borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  exampleText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  codeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeHeaderText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  langPicker: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  langPickerText: { color: '#fff', fontSize: 13 },
  langDropdown: { position: 'absolute', top: 50, right: 15, width: 150, maxHeight: 200, backgroundColor: '#111', borderRadius: 12, zIndex: 100, borderWidth: 1, borderColor: '#222' },
  langOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  langOptionText: { color: '#71717a', fontSize: 14 },
  langOptionTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  customInputField: { backgroundColor: '#111', borderRadius: 12, padding: 15, color: '#fff', fontSize: 15, minHeight: 100, borderWidth: 1, borderColor: '#222' },
  customInputSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  customInputTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  codeBottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  codeBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBottomLang: { color: '#71717a', fontSize: 13 },
  codeBottomActions: { flexDirection: 'row', gap: 12 },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a1a', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' },
  runBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  submissionsBottomBtn: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  aiFab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  aiFabBrain: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#8b5cf6', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0a0a0a' },
  codeBox: { backgroundColor: '#111', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#222' },
  codeBoxText: { color: '#fff', fontSize: 14 },
  editorContainer: { minHeight: 400 },
  customInputToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  customInputToggleText: { color: '#71717a', fontSize: 13, fontWeight: 'bold' },
  chatDrawer: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '75%', backgroundColor: '#0d1117', borderLeftWidth: 1, borderLeftColor: '#30363d', zIndex: 9999, elevation: 10 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  chatHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderBtn: { padding: 4 },
  chatContent: { flex: 1, padding: 15 },
  chatEmptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  chatEmptyText: { color: '#fff', fontSize: 13, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  chatInput: { flex: 1, backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#222' },
  chatSendBtn: { backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msgBubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '90%' },
  userMsg: { backgroundColor: '#2563eb', alignSelf: 'flex-end' },
  aiMsg: { backgroundColor: '#161b22', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#30363d' },
  msgText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25, borderWidth: 2, alignItems: 'center' },
  modalStatus: { fontSize: 32, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
  modalDetails: { width: '100%', marginBottom: 25 },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalDetailLabel: { color: '#71717a', fontSize: 14, fontWeight: 'bold' },
  modalDetailValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  modalCloseBtn: { backgroundColor: '#333', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default ProblemDetailScreen;
