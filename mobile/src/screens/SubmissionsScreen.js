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
  Platform,
} from 'react-native';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Code, 
  ArrowLeft,
  Activity
} from 'lucide-react-native';
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
    <TouchableOpacity
      style={styles.submissionCard}
      onPress={() => navigation.navigate('ProblemDetail', { problemId: submission.forProblem })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) + '15', borderColor: getStatusColor(submission.status) + '40' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
              {submission.status}
            </Text>
          </View>
          <Text style={styles.problemId}>{submission.forProblem}</Text>
        </View>
        <TouchableOpacity 
          style={styles.eyeButton} 
          onPress={() => handleViewCode(submission._id)}
        >
          <Eye size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Code size={12} color="#888" />
            <Text style={styles.metaLabel}>{submission.language}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color="#888" />
            <Text style={styles.metaLabel}>{submission.time || 0}ms</Text>
          </View>
          <View style={styles.metaItem}>
            <Activity size={12} color="#888" />
            <Text style={styles.metaLabel}>{submission.memory || 0}KB</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.pointsText}>{submission.point || 0} pts</Text>
          <Text style={styles.dateText}>{formatDate(submission.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Submissions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      {/* ... (stats container same) ... */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <CheckCircle2 size={16} color="#22C55E" />
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>
              {submissions.filter(s => s.status === 'AC').length}
            </Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <XCircle size={16} color="#EF4444" />
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {submissions.filter(s => s.status === 'WA').length}
            </Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color="#F59E0B" />
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {submissions.filter(s => s.status === 'TLE').length}
            </Text>
            <Text style={styles.statLabel}>TLE</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Activity size={16} color={colors.primary} />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
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
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
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
    backgroundColor: '#1e1e1e',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  problemId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  cardBody: {
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: 12,
    color: '#888',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dateText: {
    fontSize: 11,
    color: '#555',
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
