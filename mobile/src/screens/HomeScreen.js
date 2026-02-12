import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { logout, user } = useAuth();

  const MenuCard = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Logo size={40} />
        <Text style={styles.headerTitle}>JudgeX</Text>
      </View>

      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'User'} 👋</Text>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        <MenuCard 
          title="Contests" 
          icon="🏆" 
          onPress={() => navigation.navigate('Contests')} 
        />
        <MenuCard 
          title="Problems" 
          icon="📝" 
          onPress={() => navigation.navigate('Problems')} 
        />
        <MenuCard 
          title="Submissions" 
          icon="📊" 
          onPress={() => navigation.navigate('Submissions')} 
        />
        <MenuCard 
          title="Profile" 
          icon="👤" 
          onPress={() => navigation.navigate('Profile')} 
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalAC || 0}</Text>
          <Text style={styles.statLabel}>Solved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalAttempt || 0}</Text>
          <Text style={styles.statLabel}>Attempts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalScore || 0}</Text>
          <Text style={styles.statLabel}>Score</Text>
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
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  welcomeSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  menuCard: {
    width: '47%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  menuIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  menuTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
  },
  logoutButton: {
    width: '100%',
  },
});

export default HomeScreen;
