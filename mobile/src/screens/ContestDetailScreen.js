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
import contestService from '../services/contestService';

const ContestDetailScreen = ({ route, navigation }) => {
  const { contestId } = route.params;
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  const fetchContest = async () => {
    try {
      setError('');
      const response = await contestService.getContest(contestId);
      setContest(response.data || response);
    } catch (err) {
      setError(err.message || 'Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime, endTime) => {
    const ms = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes} min`;
  };

  const getStatus = () => {
    if (!contest) return 'unknown';
    const now = Date.now();
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'ongoing';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ended':
        return 'The Contest Has Ended';
      case 'ongoing':
        return 'Contest is Ongoing';
      case 'upcoming':
        return 'Contest is Upcoming';
      default:
        return '';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ended':
        return { backgroundColor: '#374151' };
      case 'ongoing':
        return { backgroundColor: '#F59E0B' };
      case 'upcoming':
        return { backgroundColor: '#22C55E' };
      default:
        return {};
    }
  };

  const formatTime = (ms) => {
    if (!ms) return '0m';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}m`;
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

  if (error || !contest) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Contest not found'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatus();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Logo size={32} />
        <Text style={styles.trophyIcon}>🏆</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.contestTitle} numberOfLines={1}>{contest.title}</Text>
          <Text style={styles.contestDuration}>
            ⏱️ {formatDuration(contest.startTime, contest.endTime)}
          </Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(status)]}>
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            ℹ️ Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
          onPress={() => setActiveTab('standings')}
        >
          <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>
            📊 Standings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'info' ? (
          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {contest.description || 'No description available'}
            </Text>

            <Text style={styles.sectionTitle}>Problems</Text>
            {contest.problems?.length > 0 ? (
              contest.problems.map((problemId, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.problemItem}
                  onPress={() => navigation.navigate('ProblemDetail', { problemId: problemId })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.problemIndex}>{String.fromCharCode(65 + index)}</Text>
                  <Text style={styles.problemName}>{problemId}</Text>
                  <Text style={styles.problemArrow}>→</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noData}>No problems added yet</Text>
            )}
          </View>
        ) : (
          <View style={styles.standingsContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.rankCell]}>Top</Text>
              <Text style={[styles.tableHeaderCell, styles.nameCell]}>Name</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
              {contest.problems?.map((_, index) => (
                <Text key={index} style={[styles.tableHeaderCell, styles.scoreCell]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              ))}
            </View>

            {/* Table Rows */}
            {contest.standing?.length > 0 ? (
              contest.standing.map((entry, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.rankCell]}>
                    <View style={[styles.rankBadge, index < 3 && styles.topRank]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.nameCell]}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {entry.user?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>{entry.user}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.totalCell, styles.totalText]}>
                    {formatTime(entry.time?.reduce((a, b) => a + (b || 0), 0))}
                  </Text>
                  {entry.score?.map((score, scoreIndex) => (
                    <Text 
                      key={scoreIndex} 
                      style={[
                        styles.tableCell, 
                        styles.scoreCell,
                        styles.scoreText,
                        score > 0 && styles.scoreSuccess
                      ]}
                    >
                      {score > 0 ? '✓' : '-'}
                    </Text>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No standings yet</Text>
            )}
          </View>
        )}
      </ScrollView>
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
    flexWrap: 'wrap',
  },
  backButton: {
    padding: spacing.sm,
  },
  backArrow: {
    color: colors.text,
    fontSize: typography.sizes.xl,
  },
  trophyIcon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    minWidth: 100,
  },
  contestTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  contestDuration: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.md,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  infoContainer: {},
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  problemIndex: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    width: 30,
  },
  problemName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  problemArrow: {
    color: colors.textSecondary,
    fontSize: typography.sizes.lg,
  },
  noData: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  standingsContainer: {},
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  tableHeaderCell: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  tableCell: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  rankCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalCell: {
    width: 60,
    textAlign: 'center',
  },
  totalText: {
    color: colors.text,
  },
  scoreCell: {
    width: 35,
    textAlign: 'center',
  },
  scoreText: {
    color: colors.textSecondary,
  },
  scoreSuccess: {
    color: '#22C55E',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRank: {
    backgroundColor: colors.primary,
  },
  rankText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  userName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
});

export default ContestDetailScreen;
