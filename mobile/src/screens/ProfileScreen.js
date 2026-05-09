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
import { LinearGradient } from 'expo-linear-gradient';
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
    // If we have a user name, fetch full profile details
    if (user?.name) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getProfile(user.name);
      
      // Handle standardized response structure { success, data: user, problems }
      const userData = response.data || (response.id ? response : null);
      if (userData) {
        setProfile(userData);
      }
      if (response.problems) {
        setProblems(response.problems);
      }
    } catch (err) {
      console.log('Failed to fetch profile:', err);
      setError('Could not sync latest stats');
      // Fallback is already handled by displayUser using auth context user
    } finally {
      setLoading(false);
    }
  };

  const displayUser = profile || user;
  const userName = displayUser?.name || 'Soldier';
  const userFullname = displayUser?.fullname || '';
  const userRank = displayUser?.top ? `#${displayUser.top}` : 'N/A';
  
  const stats = [
    { label: 'Solved', value: displayUser?.totalAC || 0, color: '#22C55E' },
    { label: 'Attempted', value: displayUser?.totalAttempt || 0, color: '#0ea5e9' },
    { label: 'Score', value: displayUser?.totalScore || 0, color: '#A855F7' }
  ];

  const getProblemsByDifficulty = (difficulty) => {
    return Object.values(problems)
      .filter(p => p.difficulty?.toLowerCase() === difficulty.toLowerCase() && p.status === 'Accepted')
      .length;
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const renderAvatar = () => {
    if (displayUser?.avatar) {
      return <Image source={{ uri: displayUser.avatar }} style={styles.avatar} />;
    }
    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Text style={styles.avatarInitial}>
          {userName.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Background Gradient */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.12)', 'transparent']}
            style={styles.headerGradient}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#0ea5e9', '#22C55E']}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  {renderAvatar()}
                </View>
              </LinearGradient>
              <View style={styles.statusDot} />
            </View>

            <Text style={styles.userNameText}>{userName}</Text>
            {userFullname ? <Text style={styles.fullNameText}>{userFullname}</Text> : null}
            
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>RANK {userRank}</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Stats Bento Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Progress Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.difficultyContainer}>
              {[
                { label: 'Easy', color: '#22C55E', count: getProblemsByDifficulty('easy') },
                { label: 'Medium', color: '#F59E0B', count: getProblemsByDifficulty('medium') },
                { label: 'Hard', color: '#EF4444', count: getProblemsByDifficulty('hard') }
              ].map((item, idx) => (
                <View key={idx} style={styles.difficultyRow}>
                  <View style={[styles.difficultyDot, { backgroundColor: item.color }]} />
                  <Text style={styles.difficultyLabel}>{item.label}</Text>
                  <Text style={[styles.difficultyValue, { color: item.color }]}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {[
                { label: 'Contests', icon: '🏆', screen: 'Contests' },
                { label: 'Submissions', icon: '📊', screen: 'Submissions' },
                { label: 'Edit Profile', icon: '⚙️', screen: 'EditProfile' }
              ].map((action, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.actionItem}
                  onPress={() => navigation.navigate(action.screen)}
                >
                  <Text style={styles.actionIconText}>{action.icon}</Text>
                  <Text style={styles.actionLabelText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout Session</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#0ea5e9',
    fontSize: 40,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: '#0a0a0a',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  fullNameText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  rankBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0ea5e920',
    borderWidth: 1,
    borderColor: '#0ea5e940',
  },
  rankBadgeText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff05',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  difficultyContainer: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff05',
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 15,
  },
  difficultyLabel: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 16,
  },
  difficultyValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff05',
  },
  actionIconText: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 10,
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef444440',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef444405',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
