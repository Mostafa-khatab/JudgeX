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
  Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import Button from '../components/Button';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [problems, setProblems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.name) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setError('');
      const response = await userService.getProfile(user.name);
      setProfile(response.data || response);
      setProblems(response.problems || {});
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      // Use local user data as fallback
      setProfile(user);
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

  const getAcceptedCount = () => {
    return Object.values(problems).filter(p => p.status === 'Accepted').length;
  };

  const getProblemsByDifficulty = (difficulty) => {
    return Object.entries(problems)
      .filter(([_, p]) => p.difficulty === difficulty && p.status === 'Accepted')
      .length;
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

  const displayUser = profile || user;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Logo size={40} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayUser?.avatar ? (
              <Image source={{ uri: displayUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {displayUser?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{displayUser?.name || 'User'}</Text>
          <Text style={styles.userFullname}>{displayUser?.fullname || ''}</Text>
          
          {displayUser?.bio && (
            <Text style={styles.userBio}>{displayUser.bio}</Text>
          )}
          
          <View style={styles.rankContainer}>
            <Text style={styles.rankLabel}>Rank</Text>
            <Text style={styles.rankValue}>#{displayUser?.top || '-'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#22C55E' }]}>
              {displayUser?.totalAC || getAcceptedCount()}
            </Text>
            <Text style={styles.statsLabel}>Solved</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>
              {displayUser?.totalAttempt || Object.keys(problems).length}
            </Text>
            <Text style={styles.statsLabel}>Attempted</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: colors.primary }]}>
              {displayUser?.totalScore || 0}
            </Text>
            <Text style={styles.statsLabel}>Score</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Contests')}
            >
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionLabel}>Contests</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Submissions')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Submissions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Difficulty Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problems Solved</Text>
          <View style={styles.difficultyContainer}>
            <View style={styles.difficultyItem}>
              <View style={[styles.difficultyDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.difficultyLabel}>Easy</Text>
              <Text style={[styles.difficultyValue, { color: '#22C55E' }]}>
                {getProblemsByDifficulty('easy')}
              </Text>
            </View>
            <View style={styles.difficultyItem}>
              <View style={[styles.difficultyDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.difficultyLabel}>Medium</Text>
              <Text style={[styles.difficultyValue, { color: '#F59E0B' }]}>
                {getProblemsByDifficulty('medium')}
              </Text>
            </View>
            <View style={styles.difficultyItem}>
              <View style={[styles.difficultyDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.difficultyLabel}>Hard</Text>
              <Text style={[styles.difficultyValue, { color: '#EF4444' }]}>
                {getProblemsByDifficulty('hard')}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{displayUser?.email || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {displayUser?.createdAt 
                  ? new Date(displayUser.createdAt).toLocaleDateString()
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={logout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.bottomPadding} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    flex: 1,
  },
  editButton: {
    padding: spacing.sm,
  },
  editButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userFullname: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userBio: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  rankLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  rankValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  difficultyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  difficultyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  difficultyLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  difficultyValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  logoutContainer: {
    marginTop: spacing.xl,
  },
  logoutButton: {
    width: '100%',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default ProfileScreen;
