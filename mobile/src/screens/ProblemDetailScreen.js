import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import problemService from '../services/problemService';

const ProblemDetailScreen = ({ route, navigation }) => {
  const { problemId } = route.params;
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      setError('');
      const response = await problemService.getProblem(problemId);
      setProblem(response.data || response);
    } catch (err) {
      setError(err.message || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#22C55E';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  // Parse task content - it may contain HTML or markdown
  const parseTaskContent = (task) => {
    if (!task) return null;
    
    // Remove HTML tags for simple display
    let cleanText = task
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
    
    return cleanText;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !problem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Problem not found'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const taskContent = parseTaskContent(problem.task);

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
          <Text style={styles.problemId}>{problem.id}</Text>
          <Text style={styles.problemName} numberOfLines={1}>{problem.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Problem Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Difficulty</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(problem.difficulty) }]}>
                  {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Points</Text>
              <Text style={styles.infoValue}>{problem.point || 100}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time Limit</Text>
              <Text style={styles.infoValue}>{problem.timeLimit || 1}s</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Memory</Text>
              <Text style={styles.infoValue}>{problem.memoryLimit || 256}MB</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {problem.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {problem.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Problem Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem Statement</Text>
          <View style={styles.statementCard}>
            <Text style={styles.statementText}>
              {taskContent || 'No problem statement available.'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{problem.noOfSubm || 0}</Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{problem.noOfSuccess || 0}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {problem.noOfSubm > 0 
                  ? Math.round((problem.noOfSuccess / problem.noOfSubm) * 100) 
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>AC Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => navigation.navigate('SubmitCode', { problemId: problem.id, problemName: problem.name })}
        >
          <Text style={styles.submitButtonText}>Submit Solution</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.primary,
    fontSize: typography.sizes.md,
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
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tagText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
  },
  statementCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statementText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-around',
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
  bottomPadding: {
    height: 100,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
  submitButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});

export default ProblemDetailScreen;
