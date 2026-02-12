import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import problemService from '../services/problemService';

const ProblemsScreen = ({ navigation }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [error, setError] = useState('');

  const fetchProblems = useCallback(async () => {
    try {
      setError('');
      const response = await problemService.getProblems({
        q: searchQuery,
        difficulty: difficultyFilter,
        size: 50,
      });
      setProblems(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load problems');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, difficultyFilter]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProblems();
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

  const getAccuracyPercent = (problem) => {
    if (!problem.noOfSubm || problem.noOfSubm === 0) return 0;
    return Math.round((problem.noOfSuccess / problem.noOfSubm) * 100);
  };

  const ProblemCard = ({ problem }) => (
    <TouchableOpacity
      style={styles.problemCard}
      onPress={() => navigation.navigate('ProblemDetail', { problemId: problem.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        {problem.solve ? (
          <View style={styles.solvedBadge}>
            <Text style={styles.solvedCheck}>✓</Text>
          </View>
        ) : (
          <View style={styles.unsolvedBadge} />
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.problemName} numberOfLines={1}>{problem.name}</Text>
        <View style={styles.tagsContainer}>
          {problem.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {problem.tags?.length > 3 && (
            <Text style={styles.moreTagsText}>+{problem.tags.length - 3}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.cardRight}>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) + '20' }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(problem.difficulty) }]}>
            {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
          </Text>
        </View>
        <Text style={styles.accuracyText}>{getAccuracyPercent(problem)}% AC</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Logo size={40} />
        <Text style={styles.headerTitle}>All Problems</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.difficultyDropdown}
          onPress={() => {
            const filters = ['', 'easy', 'medium', 'hard'];
            const currentIndex = filters.indexOf(difficultyFilter);
            setDifficultyFilter(filters[(currentIndex + 1) % filters.length]);
          }}
        >
          <Text style={styles.dropdownText}>
            {difficultyFilter ? difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1) : 'Difficulty'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Search problems..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchProblems}
        />

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        /* Problems List */
        <FlatList
          data={problems}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => <ProblemCard problem={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No problems found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backArrow: {
    color: colors.text,
    fontSize: typography.sizes.xl,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  difficultyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  dropdownText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  dropdownArrow: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  refreshButton: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: typography.sizes.lg,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  problemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLeft: {
    marginRight: spacing.md,
  },
  solvedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedCheck: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  unsolvedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardContent: {
    flex: 1,
  },
  problemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  moreTagsText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    alignSelf: 'center',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  accuracyText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl,
    fontSize: typography.sizes.md,
  },
});

export default ProblemsScreen;
