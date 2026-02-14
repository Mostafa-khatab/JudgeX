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
  KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import problemService from '../services/problemService';
import submissionService from '../services/submissionService';
import codeRunnerService from '../services/codeRunnerService';

const LANGUAGES = [
  { id: 'c++17', label: 'C++ 17' },
  { id: 'c++20', label: 'C++ 20' },
  { id: 'c++14', label: 'C++ 14' },
  { id: 'c++11', label: 'C++ 11' },
  { id: 'c11', label: 'C 11' },
  { id: 'c', label: 'C' },
  { id: 'python3', label: 'Python 3' },
  { id: 'python2', label: 'Python 2' },
];

const CODE_TEMPLATES = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}',
  python: '# Write your solution here\n',
};

const getLanguageType = (lang) => {
  if (!lang) return 'cpp';
  if (lang.startsWith('c++') || lang === 'c11') return 'cpp';
  if (lang === 'c') return 'c';
  return 'python';
};

const ProblemDetailScreen = ({ route, navigation }) => {
  const { problemId, contestId } = route.params;
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs: 'statement' | 'code' | 'result'
  const [activeTab, setActiveTab] = useState('statement');

  // Code editor state
  const [code, setCode] = useState(CODE_TEMPLATES.cpp);
  const [language, setLanguage] = useState('c++17');
  const [showLanguages, setShowLanguages] = useState(false);

  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [runOutput, setRunOutput] = useState('');
  const [runError, setRunError] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [pendingSubId, setPendingSubId] = useState(null);

  // Line numbers
  const [lineCount, setLineCount] = useState(7);

  // Polling ref for cleanup
  const pollingRef = useRef(null);

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  // Update line numbers when code changes
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, [code]);

  // ===== Polling: watch for PENDING submission and auto-fetch result =====
  useEffect(() => {
    if (!pendingSubId) return;

    console.log('Starting polling for submission:', pendingSubId);
    let retries = 0;
    const MAX_RETRIES = 40; // 60 seconds max (1.5s interval)

    pollingRef.current = setInterval(async () => {
      retries++;
      console.log(`Polling attempt ${retries}/${MAX_RETRIES} for ${pendingSubId}`);
      
      try {
        const response = await submissionService.getSubmission(pendingSubId);
        const data = response.data || response;
        const subData = data._doc ? data._doc : data;
        
        console.log('Poll result status:', subData.status);

        // Keep polling while PENDING or JUDGING (intermediate states)
        const isStillJudging = !subData.status || subData.status === 'PENDING' || subData.status === 'JUDGING';
        
        if (!isStillJudging) {
          // Final verdict received (AC, WA, TLE, MLE, RTE, CE, IE)
          console.log('Judging complete!', subData.status);
          setSubmission(subData);
          setIsSubmitting(false);
          setPendingSubId(null);
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else if (subData.status === 'JUDGING') {
          // Update UI to show JUDGING state
          setSubmission(prev => ({ ...prev, status: 'JUDGING' }));
        }
      } catch (err) {
        console.warn('Poll error:', err.message);
      }

      if (retries >= MAX_RETRIES) {
        console.warn('Polling timeout after', MAX_RETRIES, 'retries');
        setIsSubmitting(false);
        setPendingSubId(null);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [pendingSubId]);

  const fetchProblem = async () => {
    try {
      setError('');
      const response = await problemService.getProblem(problemId);
      // Handle response structure: { success, data } or direct object
      let problemData = null;
      if (response && response.data) {
        // Server wraps in { success, data: { ...problem } }
        problemData = response.data;
      } else if (response && response.id) {
        // Direct problem object
        problemData = response;
      } else {
        problemData = response;
      }
      
      // Safety net: if we got a Mongoose document wrapper, extract _doc
      if (problemData && problemData._doc && !problemData.difficulty) {
        problemData = problemData._doc;
      }
      setProblem(problemData);
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError(err.message || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22C55E';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return 'N/A';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Parse and structure the task content into sections
  const parseTaskContent = (task) => {
    if (!task) return { description: '', input: '', output: '', examples: [] };
    
    let text = task
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
    
    // Remove metadata header lines (already shown in info card)
    text = text
      .replace(/\*\*Time limit per test:\*\*.*$/m, '')
      .replace(/\*\*Memory limit per test:\*\*.*$/m, '')
      .replace(/\*\*Points:\*\*.*$/m, '')
      .replace(/\*\*Difficulty:\*\*.*$/m, '')
      .replace(/\*\*Tags:\*\*.*$/m, '')
      .trim();
    
    // ===== STEP 1: Split by ## sections FIRST (before any math cleanup) =====
    const sections = { description: '', input: '', output: '', examples: [] };
    const sectionRegex = /##\s*(Problem Statement|Input|Output|Examples?)\s*/gi;
    const parts = text.split(sectionRegex);
    
    let currentSection = 'description';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      const lower = part.toLowerCase();
      
      if (lower === 'problem statement') { currentSection = 'description'; continue; }
      else if (lower === 'input') { currentSection = 'input'; continue; }
      else if (lower === 'output') { currentSection = 'output'; continue; }
      else if (lower === 'examples' || lower === 'example') { currentSection = 'examples'; continue; }
      
      if (part) {
        if (currentSection === 'examples') {
          // ===== STEP 2: Extract examples code blocks BEFORE any cleanup =====
          const inputMatch = part.match(/Input:\s*```([\s\S]*?)```/i);
          const outputMatch = part.match(/Output:\s*```([\s\S]*?)```/i);
          if (inputMatch || outputMatch) {
            sections.examples.push({
              input: (inputMatch ? inputMatch[1] : '').trim(),
              output: (outputMatch ? outputMatch[1] : '').trim(),
            });
          }
        } else {
          sections[currentSection] += (sections[currentSection] ? '\n\n' : '') + part;
        }
      }
    }
    
    // ===== STEP 3: Clean math artifacts ONLY in text sections (not examples) =====
    const cleanMathArtifacts = (str) => {
      if (!str) return '';
      
      let s = str;
      
      // Remove "time limit per test..." and "memory limit per test..." lines
      s = s.replace(/^time limit per test.*$/gm, '');
      s = s.replace(/^memory limit per test.*$/gm, '');
      
      // Fix variable duplicates: "\nX\n𝑋\n" → " X " (ASCII + mathcal pair)
      // The pattern in raw text: "...of \ni\n𝑖\n-th..." should become "...of i-th..."
      s = s.replace(/\nt\n𝑡\n/g, ' t ');
      s = s.replace(/\ni\n𝑖\n/g, ' i ');
      s = s.replace(/\ns\n𝑠\n/g, ' s ');
      s = s.replace(/\nn\n𝑛\n/g, ' n ');
      s = s.replace(/\nm\n𝑚\n/g, ' m ');
      
      // Also handle when they appear at start or with different spacing
      s = s.replace(/t\n𝑡/g, 't');
      s = s.replace(/i\n𝑖/g, 'i');
      s = s.replace(/s\n𝑠/g, 's');
      s = s.replace(/n\n𝑛/g, 'n');
      s = s.replace(/m\n𝑚/g, 'm');
      
      // Fix duplicate numbers: "10\n10" → "10" (same number on consecutive lines)
      // Use word boundaries to avoid matching within larger numbers
      s = s.replace(/\n(\d+)\n\1\n/g, ' $1 ');
      s = s.replace(/\n(\d+)\n\1(?=\D|$)/g, ' $1');
      
      // Fix math symbols on their own lines: "\n≤\n" → " ≤ "
      s = s.replace(/\n([−+≤≥×÷=])\n/g, ' $1 ');
      
      // Fix "…\n…" → "…"
      s = s.replace(/…\n…/g, '…');
      
      // Fix "10\n4" (superscript) → "10^4" when preceded by ≤ or similar
      s = s.replace(/(\d+)\n(\d)(?=\s*[)\s.,])/g, '$1^$2');
      
      // Remove duplicate math expressions (the MathJax version repeats the whole expression)
      // Pattern: "1≤t≤10^4\n1 ≤ t ≤ 10^4" → "1 ≤ t ≤ 10^4"
      s = s.replace(/(\d[≤≥<>][a-z][≤≥<>]\d+(?:\^\d+)?)\n\d\s*[≤≥<>]\s*[a-z]\s*[≤≥<>]\s*\d+(?:\^\d+)?/g, '$1');
      
      // Clean remaining standalone Unicode math letters on own lines
      s = s.replace(/\n[𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧]\n/g, ' ');
      s = s.replace(/\n[𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧](?=\s)/g, '');
      
      // Remove markdown bold markers
      s = s.replace(/\*\*/g, '');
      
      // Clean excess newlines and whitespace
      s = s.replace(/\n{3,}/g, '\n\n');
      s = s.replace(/  +/g, ' ');
      
      return s.trim();
    };
    
    // Apply cleanup to text sections only
    sections.description = cleanMathArtifacts(sections.description);
    sections.input = cleanMathArtifacts(sections.input);
    sections.output = cleanMathArtifacts(sections.output);
    
    // Clean section title duplication (e.g. "Input\n\nEach test...")
    sections.input = sections.input.replace(/^Input\s*/i, '').trim();
    sections.output = sections.output.replace(/^Output\s*/i, '').trim();
    
    // Remove leading problem title if it repeats the header
    sections.description = sections.description.replace(/^[A-Z]\d*\.\s+[^\n]+\n?/, '').trim();
    
    return sections;
  };

  const handleLanguageChange = (newLang) => {
    const langType = getLanguageType(newLang);
    setLanguage(newLang);
    // Only replace with template if code is still a template
    const currentLangType = getLanguageType(language);
    const currentTemplate = CODE_TEMPLATES[currentLangType] || '';
    if (code.trim() === '' || code.trim() === currentTemplate.trim()) {
      setCode(CODE_TEMPLATES[langType] || '');
    }
    setShowLanguages(false);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    setIsRunning(true);
    setRunOutput('');
    setRunError('');

    try {
      const response = await codeRunnerService.runCode({ code, language, input: runInput });
      const data = response.data || response;
      setRunOutput(data.output || 'No output');
      if (data.error) {
        setRunError(data.error);
      }
      setActiveTab('result');
    } catch (err) {
      const errData = err.data || err;
      setRunError(errData.error || errData.msg || err.message || 'Execution failed');
      setActiveTab('result');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    setIsSubmitting(true);
    setSubmission(null);
    setPendingSubId(null);

    try {
      const response = await submissionService.submit(problemId, code, language, contestId);
      const result = response.data || response;
      console.log('Submit response:', JSON.stringify(result));
      
      setSubmission({ status: 'PENDING', _id: result._id });
      setActiveTab('result');

      // Start polling if PENDING
      if (result._id && (!result.status || result.status === 'PENDING')) {
        setPendingSubId(result._id);
      } else {
        // Sync judging returned immediate result
        setSubmission(result);
        setIsSubmitting(false);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit code');
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AC': return '#22C55E';
      case 'WA': return '#EF4444';
      case 'TLE': return '#F59E0B';
      case 'MLE': return '#8B5CF6';
      case 'RTE': return '#EC4899';
      case 'CE': return '#6B7280';
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AC': return '✅ Accepted';
      case 'WA': return '❌ Wrong Answer';
      case 'TLE': return '⏱️ Time Limit Exceeded';
      case 'MLE': return '💾 Memory Limit Exceeded';
      case 'RTE': return '💥 Runtime Error';
      case 'CE': return '🔧 Compilation Error';
      case 'IE': return '⚙️ Internal Error';
      default: return status || '⏳ Pending...';
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.id === language);

  // --- Loading ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading problem...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (error || !problem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Problem not found'}</Text>
          <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const parsedTask = parseTaskContent(problem.task);

  // Generate line numbers string
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  // --- Statement Tab ---
  const renderStatementTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Problem Info Bar */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Difficulty</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(problem.difficulty) }]}>
                {getDifficultyLabel(problem.difficulty)}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Points</Text>
            <Text style={styles.infoValue}>{problem.point ?? 100}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{problem.timeLimit ?? 1}s</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Memory</Text>
            <Text style={styles.infoValue}>{problem.memoryLimit ?? 256}MB</Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      {problem.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {problem.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Problem Description */}
      {parsedTask.description ? (
        <View style={styles.statementCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📝</Text>
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.statementText}>{parsedTask.description}</Text>
        </View>
      ) : (
        <View style={styles.statementCard}>
          <Text style={styles.statementText}>No problem statement available.</Text>
        </View>
      )}

      {/* Input Format */}
      {parsedTask.input ? (
        <View style={styles.statementCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📥</Text>
            <Text style={styles.sectionTitle}>Input</Text>
          </View>
          <Text style={styles.statementText}>{parsedTask.input}</Text>
        </View>
      ) : null}

      {/* Output Format */}
      {parsedTask.output ? (
        <View style={styles.statementCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📤</Text>
            <Text style={styles.sectionTitle}>Output</Text>
          </View>
          <Text style={styles.statementText}>{parsedTask.output}</Text>
        </View>
      ) : null}

      {/* Examples */}
      {parsedTask.examples?.length > 0 && (
        <View style={styles.statementCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={styles.sectionTitle}>Examples</Text>
          </View>
          {parsedTask.examples.map((example, idx) => (
            <View key={idx} style={styles.exampleContainer}>
              {parsedTask.examples.length > 1 && (
                <Text style={styles.exampleLabel}>Example {idx + 1}</Text>
              )}
              {/* Input block */}
              <View style={styles.codeBlockWrapper}>
                <View style={styles.codeBlockHeader}>
                  <Text style={styles.codeBlockHeaderText}>📥 Input</Text>
                </View>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeBlockText} selectable>{example.input}</Text>
                </View>
              </View>
              {/* Output block */}
              <View style={styles.codeBlockWrapper}>
                <View style={[styles.codeBlockHeader, styles.codeBlockHeaderOutput]}>
                  <Text style={styles.codeBlockHeaderText}>📤 Output</Text>
                </View>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeBlockText} selectable>{example.output}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Statistics */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{problem.noOfSubm ?? 0}</Text>
          <Text style={styles.statLabel}>Submissions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{problem.noOfSuccess ?? 0}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(problem.noOfSubm ?? 0) > 0 
              ? Math.round(((problem.noOfSuccess ?? 0) / problem.noOfSubm) * 100) 
              : 0}%
          </Text>
          <Text style={styles.statLabel}>AC Rate</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // --- Code Tab ---
  const renderCodeTab = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
        {/* Language Selector */}
        <View style={styles.langSection}>
          <Text style={styles.editorSectionTitle}>Language</Text>
          <TouchableOpacity 
            style={styles.languageSelector}
            onPress={() => setShowLanguages(!showLanguages)}
          >
            <Text style={styles.languageText}>📦 {selectedLanguage?.label}</Text>
            <Text style={styles.dropdownArrow}>{showLanguages ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showLanguages && (
            <View style={styles.languageDropdown}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    language === lang.id && styles.languageOptionSelected
                  ]}
                  onPress={() => handleLanguageChange(lang.id)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    language === lang.id && styles.languageOptionTextSelected
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Code Editor (IDE style) */}
        <View style={styles.editorSection}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorHeaderIcon}>💻</Text>
            <Text style={styles.editorHeaderText}>Code Editor</Text>
            <Text style={styles.editorCharCount}>{code.length} chars</Text>
          </View>
          <View style={styles.editorContainer}>
            {/* Line numbers gutter */}
            <View style={styles.lineNumberGutter}>
              <Text style={styles.lineNumbers}>{lineNumbers}</Text>
            </View>
            {/* Code area */}
            <TextInput
              style={styles.codeInput}
              multiline
              placeholder="// Write your code here..."
              placeholderTextColor="#5A5A5A"
              value={code}
              onChangeText={setCode}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              dataDetectorTypes="none"
            />
          </View>
        </View>

        {/* Custom Input for Run */}
        <View style={styles.editorSection}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorHeaderIcon}>📥</Text>
            <Text style={styles.editorHeaderText}>Custom Input</Text>
          </View>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              multiline
              placeholder="Enter test input here..."
              placeholderTextColor="#5A5A5A"
              value={runInput}
              onChangeText={setRunInput}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // --- Result Tab ---
  const renderResultTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Run Output */}
      {(runOutput || runError) && (
        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>📤 Run Output</Text>
          {runError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorCardTitle}>❌ Error</Text>
              <Text style={styles.errorCardText}>{runError}</Text>
            </View>
          ) : null}
          {runOutput ? (
            <View style={styles.outputCard}>
              <Text style={styles.outputTitle}>✅ Output</Text>
              <Text style={styles.outputText}>{runOutput}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Submission Result */}
      {submission && (
        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>📊 Submission Result</Text>
          <View style={styles.submissionCard}>
            {(submission.status === 'PENDING' || submission.status === 'JUDGING') ? (
              <View style={styles.judgingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.judgingText}>
                  {submission.status === 'JUDGING' ? '🔄 Running testcases...' : '⚙️ Queued for judging...'}
                </Text>
                <Text style={styles.judgingSubtext}>
                  {submission.status === 'JUDGING' 
                    ? 'Your code is being tested now' 
                    : 'Waiting for an available judge'}
                </Text>
                <View style={styles.judgingDots}>
                  <Text style={styles.judgingDotsText}>⏳ Result will appear automatically</Text>
                </View>
              </View>
            ) : (
              <>
                {/* Status + Points header */}
                <View style={styles.submissionHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
                      {getStatusLabel(submission.status)}
                    </Text>
                  </View>
                  <Text style={styles.submissionPoints}>{submission.point ?? 0} pts</Text>
                </View>
                
                {/* Stats row */}
                <View style={styles.submissionDetails}>
                  <View style={styles.submissionItem}>
                    <Text style={styles.submissionLabel}>⏱ Time</Text>
                    <Text style={styles.submissionValue}>{submission.time ?? 0} ms</Text>
                  </View>
                  <View style={styles.submissionItem}>
                    <Text style={styles.submissionLabel}>💾 Memory</Text>
                    <Text style={styles.submissionValue}>{submission.memory ?? 0} KB</Text>
                  </View>
                  <View style={styles.submissionItem}>
                    <Text style={styles.submissionLabel}>✓ Passed</Text>
                    <Text style={styles.submissionValue}>
                      {submission.testcase 
                        ? `${submission.testcase.filter(tc => tc.status === 'AC').length}/${submission.testcase.length}`
                        : '—'}
                    </Text>
                  </View>
                </View>

                {/* Testcase-by-testcase results */}
                {submission.testcase && submission.testcase.length > 0 && (
                  <View style={styles.testcaseList}>
                    <Text style={styles.testcaseListTitle}>Test Cases</Text>
                    {submission.testcase.map((tc, idx) => (
                      <View key={idx} style={[
                        styles.testcaseRow,
                        { borderLeftColor: tc.status === 'AC' ? '#22C55E' : '#EF4444' }
                      ]}>
                        <Text style={styles.testcaseIndex}>Test {idx + 1}</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={[
                          styles.testcaseStatus,
                          { color: tc.status === 'AC' ? '#22C55E' : '#EF4444' }
                        ]}>
                          {tc.status === 'AC' ? '✅ Passed' : `❌ ${typeof tc.status === 'object' ? 'Failed' : (tc.status || 'Failed')}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Compilation Error Message or Checker Output */}
                {submission.msg && (function() {
                  const msgContent = typeof submission.msg === 'object' 
                    ? (submission.msg.message || submission.msg.error || JSON.stringify(submission.msg, null, 2))
                    : submission.msg;
                  
                  // Hide if useless success message
                  if (msgContent.includes('"checker": "Judging completed"') || 
                      msgContent.includes('Judging completed') ||
                      (submission.msg.checker === 'Judging completed' && Object.keys(submission.msg).length === 1)) {
                    return null;
                  }

                  return (
                    <View style={styles.errorOutputBox}>
                      <Text style={styles.errorOutputTitle}>Compiler / Checker Output</Text>
                      <Text style={styles.errorOutputText}>{msgContent}</Text>
                    </View>
                  );
                })()}
              </>
            )}
          </View>
        </View>
      )}

      {/* Empty State */}
      {!runOutput && !runError && !submission && (
        <View style={styles.emptyResult}>
          <Text style={styles.emptyResultIcon}>🏁</Text>
          <Text style={styles.emptyResultTitle}>No Results Yet</Text>
          <Text style={styles.emptyResultText}>
            Write your code in the Code tab, then press Run or Submit to see results here.
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerProblemId}>{problem.id}</Text>
          <Text style={styles.headerProblemName} numberOfLines={1}>{problem.name}</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'statement', label: '📄 Statement' },
          { key: 'code', label: '💻 Code' },
          { key: 'result', label: '📊 Result' },
        ].map((tab) => (
          <TouchableOpacity 
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentWrapper}>
        {activeTab === 'statement' && renderStatementTab()}
        {activeTab === 'code' && renderCodeTab()}
        {activeTab === 'result' && renderResultTab()}
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarLang}>📦 {selectedLanguage?.label}</Text>
        </View>
        <View style={styles.bottomBarActions}>
          <TouchableOpacity 
            style={[styles.runBtn, (isRunning || isSubmitting) && styles.btnDisabled]}
            onPress={handleRun}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? (
              <ActivityIndicator color="#58A6FF" size="small" />
            ) : (
              <Text style={styles.runBtnText}>▶ Run</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitBtn, (isSubmitting || isRunning) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || isRunning}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>⬆ Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ============ STYLES ============
const EDITOR_BG = '#0D1117';
const EDITOR_GUTTER = '#161B22';
const EDITOR_BORDER = '#30363D';
const EDITOR_TEXT = '#C9D1D9';
const EDITOR_LINE_NUM = '#484F58';
const EDITOR_CURSOR = '#58A6FF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backLinkBtn: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    color: colors.text,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerProblemId: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  headerProblemName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },

  // --- Tab Bar ---
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },

  // --- Tab Content ---
  tabContentWrapper: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  // --- Statement Tab ---
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  tagText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statementCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  statementText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  // Example blocks
  exampleContainer: {
    marginTop: spacing.sm,
  },
  exampleLabel: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  codeBlockWrapper: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  codeBlockHeader: {
    backgroundColor: '#1A3A2A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  codeBlockHeaderOutput: {
    backgroundColor: '#1A2A3A',
  },
  codeBlockHeaderText: {
    color: '#8EB5A0',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeBlock: {
    backgroundColor: EDITOR_BG,
    padding: spacing.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EDITOR_BORDER,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  codeBlockText: {
    color: '#E6EDF3',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // --- Code Tab (IDE-like) ---
  langSection: {
    marginTop: spacing.md,
  },
  editorSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: EDITOR_GUTTER,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: EDITOR_BORDER,
  },
  languageText: {
    color: EDITOR_TEXT,
    fontSize: typography.sizes.md,
  },
  dropdownArrow: {
    color: EDITOR_LINE_NUM,
    fontSize: typography.sizes.sm,
  },
  languageDropdown: {
    backgroundColor: EDITOR_GUTTER,
    borderRadius: borderRadius.md,
    marginTop: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EDITOR_BORDER,
  },
  languageOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: EDITOR_BORDER,
  },
  languageOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  languageOptionText: {
    color: EDITOR_TEXT,
    fontSize: typography.sizes.md,
  },
  languageOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  editorSection: {
    marginTop: spacing.lg,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EDITOR_GUTTER,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: EDITOR_BORDER,
    gap: spacing.sm,
  },
  editorHeaderIcon: {
    fontSize: 14,
  },
  editorHeaderText: {
    color: EDITOR_TEXT,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  editorCharCount: {
    color: EDITOR_LINE_NUM,
    fontSize: typography.sizes.xs,
  },
  editorContainer: {
    flexDirection: 'row',
    backgroundColor: EDITOR_BG,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EDITOR_BORDER,
    minHeight: 300,
  },
  lineNumberGutter: {
    backgroundColor: EDITOR_GUTTER,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: EDITOR_BORDER,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  lineNumbers: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    lineHeight: 22,
    color: EDITOR_LINE_NUM,
  },
  codeInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: EDITOR_TEXT,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    minHeight: 300,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
      caretColor: EDITOR_CURSOR,
    } : {}),
  },
  customInputContainer: {
    backgroundColor: EDITOR_BG,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EDITOR_BORDER,
    minHeight: 80,
  },
  customInput: {
    padding: 12,
    color: EDITOR_TEXT,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    minHeight: 80,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } : {}),
  },

  // --- Result Tab ---
  resultSection: {
    marginTop: spacing.md,
  },
  resultSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: spacing.sm,
  },
  errorCardTitle: {
    color: '#DC2626',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  errorCardText: {
    color: '#B91C1C',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  outputCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  outputTitle: {
    color: '#22C55E',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  outputText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  submissionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  submissionPoints: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  submissionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  submissionItem: {
    alignItems: 'center',
  },
  submissionLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  submissionValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  judgingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  judgingText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  judgingSubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  judgingDots: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
  },
  judgingDotsText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  testcaseList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  testcaseListTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  testcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: '#0D1117',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
  },
  testcaseIndex: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  testcaseStatus: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  errorOutputBox: {
    marginTop: spacing.md,
    backgroundColor: '#1C1119',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  errorOutputTitle: {
    color: '#EF4444',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  errorOutputText: {
    color: '#F8D7DA',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyResultIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyResultTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyResultText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },

  // --- Bottom Bar ---
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: EDITOR_GUTTER,
    borderTopWidth: 1,
    borderTopColor: EDITOR_BORDER,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarLang: {
    color: EDITOR_LINE_NUM,
    fontSize: typography.sizes.xs,
  },
  bottomBarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  runBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: EDITOR_BORDER,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    height: 36,
  },
  runBtnText: {
    color: '#58A6FF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  submitBtn: {
    backgroundColor: '#238636',
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
    height: 36,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default ProblemDetailScreen;
