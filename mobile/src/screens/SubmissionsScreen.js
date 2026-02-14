import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import submissionService from '../services/submissionService';
import { useAuth } from '../context/AuthContext';

const SubmissionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // View Code State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setError('');
      const response = await submissionService.getSubmissions({
        author: user?.name,
        size: 50,
      });
      setSubmissions(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AC': return '#22C55E';
      case 'WA': return '#EF4444';
      case 'TLE': return '#F59E0B';
      case 'MLE': return '#8B5CF6';
      case 'RTE': return '#EC4899';
      case 'CE': return '#6B7280';
      case 'IE': return '#6B7280';
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AC': return 'Accepted';
      case 'WA': return 'Wrong Answer';
      case 'TLE': return 'Time Limit';
      case 'MLE': return 'Memory Limit';
      case 'RTE': return 'Runtime Error';
      case 'CE': return 'Compile Error';
      case 'IE': return 'Internal Error';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handleViewCode = async (submissionId) => {
    try {
      setCodeLoading(true);
      setModalVisible(true);
      setSelectedSubmission(null);

      const response = await submissionService.getSubmission(submissionId);
      const data = response.data || response;
      const submissionData = data._doc ? data._doc : data;
      
      setSelectedSubmission(submissionData);
    } catch (err) {
      setError('Failed to load code');
      setModalVisible(false);
    } finally {
      setCodeLoading(false);
    }
  };

  const SubmissionCard = ({ submission }) => (
    <View style={styles.submissionCard}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={() => navigation.navigate('ProblemDetail', { problemId: submission.forProblem })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
              {submission.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.problemId}>{submission.forProblem}</Text>
          <View style={styles.submissionMeta}>
            <Text style={styles.metaText}>{submission.language}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{submission.time || 0}ms</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{submission.memory || 0}KB</Text>
          </View>
        </View>
        
        <View style={styles.cardRight}>
          <Text style={styles.pointsText}>{submission.point || 0} pts</Text>
          <Text style={styles.dateText}>{formatDate(submission.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      {/* View Code Button */}
      <TouchableOpacity 
        style={styles.viewCodeButton} 
        onPress={() => handleViewCode(submission._id)}
      >
        <Text style={styles.viewCodeText}>{'</> Code'}</Text>
      </TouchableOpacity>
    </View>
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
        <Text style={styles.headerTitle}>My Submissions</Text>
      </View>

      {/* Stats */}
      {/* ... (stats container same) ... */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {submissions.filter(s => s.status === 'AC').length}
          </Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {submissions.filter(s => s.status === 'WA').length}
          </Text>
          <Text style={styles.statLabel}>Wrong</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {submissions.filter(s => s.status === 'TLE').length}
          </Text>
          <Text style={styles.statLabel}>TLE</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{submissions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        /* Submissions List */
        <FlatList
          data={submissions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <SubmissionCard submission={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No submissions yet</Text>
              <Text style={styles.emptySubtext}>Solve some problems to see your submissions here</Text>
            </View>
          }
        />
      )}

      {/* Full Screen Code Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submission Code</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {codeLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : selectedSubmission ? (
            <ScrollView style={styles.codeScrollView} contentContainerStyle={styles.codeContent}>
              <Text style={styles.codeText} selectable>{selectedSubmission.src}</Text>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  submissionCard: {
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  cardContent: {
    flex: 1,
  },
  problemId: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  submissionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  viewCodeButton: {
    padding: spacing.sm,
    backgroundColor: '#0D1117',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
    marginTop: spacing.sm,
  },
  viewCodeText: {
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    backgroundColor: '#161b22',
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  codeScrollView: {
    flex: 1,
    padding: spacing.md,
  },
  codeContent: {
    paddingBottom: spacing.xxl,
  },
  codeText: {
    color: '#e6edf3',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SubmissionsScreen;
