import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import problemService from '../services/problemService';
import submissionService from '../services/submissionService';

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

const SubmitCodeScreen = ({ route, navigation }) => {
  const { problemId, problemName, contestId } = route.params;
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('c++17');
  const [showLanguages, setShowLanguages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter your code');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const response = await submissionService.submit(problemId, code, language, contestId);
      setResult(response.data || response);
      
      // Show result alert
      const status = response.data?.status || response?.status;
      if (status === 'AC') {
        Alert.alert('🎉 Accepted!', 'Your solution is correct!', [
          { text: 'View Details', onPress: () => {} },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          `Result: ${status}`,
          getStatusMessage(status),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'AC': return 'Accepted - Your solution is correct!';
      case 'WA': return 'Wrong Answer - Your output is incorrect';
      case 'TLE': return 'Time Limit Exceeded - Your solution is too slow';
      case 'MLE': return 'Memory Limit Exceeded - Your solution uses too much memory';
      case 'RTE': return 'Runtime Error - Your solution crashed';
      case 'CE': return 'Compilation Error - Your code has syntax errors';
      case 'IE': return 'Internal Error - Something went wrong on our end';
      default: return 'Unknown status';
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

  const selectedLanguage = LANGUAGES.find(l => l.id === language);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Logo size={32} />
        <View style={styles.headerInfo}>
          <Text style={styles.problemId}>{problemId}</Text>
          <Text style={styles.problemName} numberOfLines={1}>{problemName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Language Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>
            <TouchableOpacity 
              style={styles.languageSelector}
              onPress={() => setShowLanguages(!showLanguages)}
            >
              <Text style={styles.languageText}>{selectedLanguage?.label}</Text>
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
                    onPress={() => {
                      setLanguage(lang.id);
                      setShowLanguages(false);
                    }}
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

          {/* Code Editor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Code</Text>
            <View style={styles.codeEditorContainer}>
              <TextInput
                style={styles.codeEditor}
                multiline
                placeholder="Paste or type your code here..."
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={setCode}
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>
            <Text style={styles.charCount}>{code.length} characters</Text>
          </View>

          {/* Result */}
          {result && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Result</Text>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                      {result.status}
                    </Text>
                  </View>
                  <Text style={styles.resultPoints}>{result.point || 0} pts</Text>
                </View>
                
                <View style={styles.resultDetails}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Time</Text>
                    <Text style={styles.resultValue}>{result.time || 0} ms</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Memory</Text>
                    <Text style={styles.resultValue}>{result.memory || 0} KB</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Passed</Text>
                    <Text style={styles.resultValue}>
                      {result.testcasePassed || 0}/{result.totalTestcase || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    color: colors.text,
    fontSize: typography.sizes.xl,
  },
  headerInfo: {
    flex: 1,
  },
  problemId: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  problemName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  languageText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  dropdownArrow: {
    color: colors.textSecondary,
  },
  languageDropdown: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  languageOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  languageOptionText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  languageOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  codeEditorContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    minHeight: 250,
  },
  codeEditor: {
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 250,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  resultCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  resultHeader: {
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  resultPoints: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  resultValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  bottomPadding: {
    height: 100,
  },
  submitContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});

export default SubmitCodeScreen;
