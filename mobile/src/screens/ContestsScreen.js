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
import contestService from '../services/contestService';

const ContestsScreen = ({ navigation }) => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchContests = useCallback(async () => {
    try {
      setError('');
      const response = await contestService.getContests({
        q: searchQuery,
        status: statusFilter,
      });
      setContests(response.data || response || []);
    } catch (err) {
      setError(err.message || 'Failed to load contests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContests();
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ended':
        return '#EF4444';
      case 'ongoing':
        return '#F59E0B';
      case 'upcoming':
        return '#22C55E';
      default:
        return colors.textSecondary;
    }
  };

  const StatusBadge = ({ status }) => (
    <View style={[styles.statusBadge, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
      <Text style={styles.statusText}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );

  const ContestCard = ({ contest }) => (
    <TouchableOpacity
      style={styles.contestCard}
      onPress={() => navigation.navigate('ContestDetail', { contestId: contest.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.trophyIcon}>🏆</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.contestTitle}>{contest.title}</Text>
        <View style={styles.contestMeta}>
          <Text style={styles.metaText}>📅 {formatDate(contest.startTime)}</Text>
          <Text style={styles.metaText}>⏱️ {formatDuration(contest.duration)}</Text>
        </View>
      </View>
      <StatusBadge status={contest.status} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Logo size={40} />
        <Text style={styles.headerTitle}>All Contests</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.statusDropdown}
          onPress={() => {
            // Cycle through filters
            const filters = ['', 'upcoming', 'ongoing', 'ended'];
            const currentIndex = filters.indexOf(statusFilter);
            setStatusFilter(filters[(currentIndex + 1) % filters.length]);
          }}
        >
          <Text style={styles.dropdownText}>
            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'Status'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchContests}
        />

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
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
        /* Contest List */
        <FlatList
          data={contests}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => <ContestCard contest={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contests found</Text>
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
    gap: spacing.lg,
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
  statusDropdown: {
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: colors.background,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
  contestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardLeft: {
    marginRight: spacing.md,
  },
  trophyIcon: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  contestTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contestMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl,
    fontSize: typography.sizes.md,
  },
});

export default ContestsScreen;
