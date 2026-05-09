import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  StatusBar,
  RefreshControl
} from 'react-native';
import {
  Trophy, 
  Target, 
  Users, 
  BarChart3, 
  Clock, 
  ChevronRight, 
  Flame, 
  Zap,
  CheckCircle2,
  Calendar,
  Timer,
  LayoutGrid,
  FileCode,
  Settings,
  Moon,
  Languages,
  LogOut,
  FileText,
  Send
} from 'lucide-react-native';
import { Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAuth } from '../context/AuthContext';
import { useHomeData } from '../hooks/useHomeData';
import userService from '../services/userService';

const LogoImg = require('../../assets/logo.png');

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { loading, stats, contests, leaderboard, refresh } = useHomeData();
  const [profile, setProfile] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    if (user?.name) {
      fetchUserProfile();
    }
  }, [user?.name]);

  const fetchUserProfile = async () => {
    try {
      const res = await userService.getProfile(user.name);
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.log('Failed to fetch latest profile', err);
    }
  };

  const displayUser = profile || user;

  const formatSubmissions = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const userData = {
    name: displayUser?.name || 'Soldier',
    email: displayUser?.email || 'user@example.com',
    rank: displayUser?.top ? `RANK #${displayUser.top}` : 'NOVICE COMPETITOR',
    profilePic: displayUser?.avatar,
    permission: displayUser?.permission || 'user',
    solved: displayUser?.totalAC || 0,
    stats: {
      problemsSolved: stats.problemsSolved || 842,
      totalSubmissions: formatSubmissions(stats.totalSubmissions || 15200),
      newUsers: stats.newUsers || 124,
      globalActivity: stats.globalActivity || 'ACTIVE'
    }
  };

  const renderAvatar = (size = 40) => {
    if (userData.profilePic) {
      return (
        <Image 
          source={{ uri: userData.profilePic }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      );
    }
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#333' }, styles.avatarFallback]}>
        <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
          {userData.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderProfileMenu = () => (
    <Modal
      visible={isMenuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsMenuVisible(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setIsMenuVisible(false)}
      >
        <View style={styles.menuContent}>
          {/* User Header */}
          <View style={styles.menuHeader}>
            {renderAvatar(60)}
            <View style={styles.menuHeaderText}>
              <View style={styles.nameRow}>
                <Text style={styles.rankBadgeMini}>AD</Text>
                <Text style={styles.menuName}>{userData.name}</Text>
              </View>
              <Text style={styles.menuEmail}>{userData.email}</Text>
            </View>
          </View>

          {/* Icon Grid */}
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('ProblemsTab'); }}>
              <View style={[styles.gridIconBox, { backgroundColor: '#333' }]}>
                <FileText size={24} color="#0ea5e9" />
              </View>
              <Text style={styles.gridLabel}>problem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('Submissions'); }}>
              <View style={[styles.gridIconBox, { backgroundColor: '#333' }]}>
                <Send size={24} color="#eab308" />
              </View>
              <Text style={styles.gridLabel}>submission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('ContestsTab'); }}>
              <View style={[styles.gridIconBox, { backgroundColor: '#333' }]}>
                <Trophy size={24} color="#ef4444" />
              </View>
              <Text style={styles.gridLabel}>contest</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Dashboard Button */}
          {userData.permission === 'admin' && (
            <TouchableOpacity style={styles.adminBtn} onPress={() => { setIsMenuVisible(false); alert('Admin Dashboard Coming Soon'); }}>
              <LinearGradient
                colors={['#0ea5e9', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.adminGradient}
              >
                <LayoutGrid size={20} color="#fff" />
                <Text style={styles.adminText}>admin-dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Menu List */}
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuListItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('ProblemsTab'); }}>
              <View style={styles.listItemLeft}>
                <FileCode size={20} color="#71717a" />
                <Text style={styles.listItemText}>editor</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuListItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('EditProfile'); }}>
              <View style={styles.listItemLeft}>
                <Settings size={20} color="#71717a" />
                <Text style={styles.listItemText}>setting</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuListItem} onPress={() => { alert('Appearance Settings Coming Soon'); }}>
              <View style={styles.listItemLeft}>
                <Moon size={20} color="#71717a" />
                <Text style={styles.listItemText}>appearance</Text>
              </View>
              <ChevronRight size={16} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuListItem} onPress={() => { alert('Language Settings Coming Soon'); }}>
              <View style={styles.listItemLeft}>
                <Languages size={20} color="#71717a" />
                <Text style={styles.listItemText}>language</Text>
              </View>
              <ChevronRight size={16} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuListItem, { borderBottomWidth: 0 }]} onPress={() => { setIsMenuVisible(false); logout(); }}>
              <View style={styles.listItemLeft}>
                <LogOut size={20} color="#ef4444" />
                <Text style={[styles.listItemText, { color: '#ef4444' }]}>log-out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const platformStats = [
    { id: 1, label: 'Problems Solved', value: userData.stats.problemsSolved, icon: CheckCircle2, color: '#22C55E' },
    { id: 2, label: 'Total Submissions', value: userData.stats.totalSubmissions, icon: BarChart3, color: '#0ea5e9' },
    { id: 3, label: 'New Users', value: userData.stats.newUsers, icon: Users, color: '#A855F7' },
    { id: 4, label: 'Global Activity', value: userData.stats.globalActivity, icon: Target, color: '#F97316' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderProfileMenu()}
      
      {/* Header Bar */}
      <View style={styles.topNav}>
        <Image 
          source={LogoImg} 
          style={styles.miniLogo} 
          resizeMode="contain"
        />
        <View style={styles.topNavRight}>
           <TouchableOpacity>
              <Text style={{color: '#FFF', fontSize: 20}}>☆</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
              {renderAvatar()}
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#0ea5e9" />
        }
      >
        <View style={styles.contentWrapper}>
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.statusBadge}>
               <Text style={styles.statusText}>STATUS: ACTIVE & READY</Text>
            </View>
            <View style={styles.titleRow}>
               <Text style={styles.welcomeText}>Welcome back, </Text>
                <MaskedView
                  maskElement={
                    <Text style={[styles.brandBlue, { width: '100%' }]}>Soldier!</Text>
                  }
                  style={styles.maskedGradient}
                >
                  <LinearGradient
                    colors={['#0ea5e9', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  >
                    <Text style={[styles.brandBlue, { opacity: 0 }]}>Soldier!</Text>
                  </LinearGradient>
                </MaskedView>
               <Text style={styles.rocket}> 🚀</Text>
             </View>
            <Text style={styles.description}>
               Your command center is fully operational. Continue your journey through the roadmap or experiment with the latest neural tools in the AI Lab.
            </Text>

            <View style={styles.quickStats}>
               <View style={styles.quickBox}>
                  <Text style={styles.label}>CURRENT RANK</Text>
                  <Text style={styles.value}>{userData.rank}</Text>
               </View>
               <View style={styles.quickBox}>
                  <Text style={styles.label}>MISSIONS DONE</Text>
                  <Text style={styles.value}>{user?.totalAC || 12} SOLVED</Text>
               </View>
            </View>
          </View>

          {/* Daily Challenge - Full Width */}
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Zap size={18} color="#0ea5e9" />
                <Text style={styles.sectionTitle}>Daily Challenge</Text>
             </View>

             <TouchableOpacity style={styles.challengeCard}>
                <LinearGradient
                   colors={['#8B5CF6', '#EC4899']}
                   style={styles.gradientLine}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                />
                <View style={styles.cardBody}>
                   <View style={styles.cardHeader}>
                      <View>
                         <Text style={styles.cardTitle}>Three Decks</Text>
                         <View style={styles.badgeRow}>
                            <View style={styles.badgeGreen}>
                               <Text style={styles.badgeTextGreen}>Easy</Text>
                            </View>
                            <View style={styles.badgeBlue}>
                               <Text style={styles.badgeTextBlue}>math</Text>
                            </View>
                         </View>
                      </View>
                      <ChevronRight size={18} color="#666" />
                   </View>

                   <View style={styles.progressArea}>
                      <View style={styles.progressLabels}>
                         <Text style={styles.progressLabel}>AI Match Score</Text>
                         <Text style={styles.progressPercent}>50%</Text>
                      </View>
                      <View style={styles.barBg}>
                         <View style={styles.barFill} />
                      </View>
                   </View>

                   <View style={styles.footerRow}>
                      <View style={styles.infoBox}>
                         <Flame size={14} color="#F97316" />
                         <Text style={styles.infoText}>Not solved yet</Text>
                      </View>
                      <View style={styles.infoBox}>
                         <Clock size={14} color="#666" />
                         <Text style={styles.infoText}>03:46:46</Text>
                      </View>
                   </View>
                </View>
             </TouchableOpacity>
          </View>

          {/* Today Statistics - PERFECT 2-COLUMN GRID */}
          <View style={styles.section}>
             <Text style={styles.mainTitle}>Today Statistics</Text>
             <View style={styles.bentoGrid}>
                {platformStats.map((stat) => (
                  <View key={stat.id} style={styles.bentoBox}>
                     <View style={styles.bentoTop}>
                        <stat.icon size={16} color={stat.color} />
                        <Text style={styles.bentoValue}>{stat.value}</Text>
                     </View>
                     <Text style={styles.bentoLabel}>{stat.label}</Text>
                  </View>
                ))}
             </View>
          </View>

          {/* Contests */}
          <View style={styles.section}>
             <View style={styles.rowBetween}>
                <Text style={styles.mainTitle}>Contests</Text>
                <TouchableOpacity>
                   <Text style={styles.brandBlueLink}>View All</Text>
                </TouchableOpacity>
             </View>

             <View style={styles.contestGrid}>
                 {contests.slice(0, 3).map((contest) => {
                   const durationHrs = Math.round((new Date(contest.endTime) - new Date(contest.startTime)) / (1000 * 60 * 60));
                   return (
                     <View key={contest._id || contest.id} style={styles.contestCard}>
                        <Text style={styles.contestName}>{contest.title}</Text>
                        <View style={styles.metaRow}>
                           <Calendar size={12} color="#0ea5e9" />
                           <Text style={styles.metaText}>{new Date(contest.startTime).toLocaleDateString()}</Text>
                           <Timer size={12} color="#0ea5e9" style={{ marginLeft: 12 }} />
                           <Text style={styles.metaText}>{durationHrs}h</Text>
                        </View>
                     </View>
                   );
                 })}
             </View>
          </View>

          {/* Top Users */}
          <View style={styles.section}>
             <View style={styles.rowBetween}>
                <Text style={styles.mainTitle}>Top Users</Text>
                <TouchableOpacity>
                   <Text style={styles.brandBlueLink}>View All</Text>
                </TouchableOpacity>
             </View>

             <View style={styles.leaderboard}>
                 {leaderboard.map((u, index) => (
                   <View key={u._id || u.name} style={styles.userRow}>
                      <View style={styles.userLeft}>
                         <Text style={[styles.userRank, { color: index < 3 ? '#0ea5e9' : '#666' }]}>{index + 1}</Text>
                         <View style={styles.listAvatarContainer}>
                            {u.avatar ? (
                              <Image source={{ uri: u.avatar }} style={styles.listAvatar} />
                            ) : (
                              <View style={[styles.listAvatar, styles.listAvatarFallback]}>
                                 <Text style={styles.avatarInitialSmall}>{u.name.charAt(0).toUpperCase()}</Text>
                              </View>
                            )}
                         </View>
                         <Text style={styles.userName}>{u.name}</Text>
                      </View>
                      <Text style={styles.userPoints}>{u.totalScore || 0} pts</Text>
                   </View>
                 ))}
             </View>
          </View>
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
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#171717',
  },
  miniLogo: {
    width: 30,
    height: 30,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentWrapper: {
    alignItems: 'center',
    paddingTop: 20,
  },
  welcomeCard: {
    width: '90%',
    backgroundColor: '#0d1117',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#171717',
  },
  statusBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  brandBlue: {
    color: '#0ea5e9',
    fontSize: 26,
    fontWeight: '900',
  },
  maskedGradient: {
    height: 35,
    minWidth: 120,
    justifyContent: 'center',
  },
  avatarFallback: {
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rocket: {
    fontSize: 22,
  },
  description: {
    color: '#8b949e',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBox: {
    flex: 1,
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  label: {
    color: '#666',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  value: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  section: {
    width: '90%',
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  challengeCard: {
    backgroundColor: '#171717',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  gradientLine: {
    height: 4,
  },
  cardBody: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTextGreen: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeBlue: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTextBlue: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '700',
  },
  progressArea: {
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '900',
  },
  barBg: {
    height: 6,
    backgroundColor: '#30363d',
    borderRadius: 3,
  },
  barFill: {
    height: '100%',
    width: '50%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  bentoBox: {
    width: '48%',
    backgroundColor: '#171717',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  bentoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  bentoValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  bentoLabel: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandBlueLink: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '700',
  },
  contestGrid: {
    gap: 12,
  },
  contestCard: {
    backgroundColor: '#171717',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  contestName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  leaderboard: {
    backgroundColor: '#171717',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363d',
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userRank: {
    fontSize: 14,
    fontWeight: '900',
    width: 20,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  listAvatarContainer: {
    width: 36,
    height: 36,
  },
  listAvatarFallback: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#30363d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialSmall: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '900',
  },
  userName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userPoints: {
    color: '#666',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menuContent: {
    width: 280,
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  menuHeaderText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rankBadgeMini: {
    backgroundColor: '#d63384',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  menuName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuEmail: {
    color: '#71717a',
    fontSize: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  gridIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  gridLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  adminBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  adminGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adminText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuList: {
    gap: 4,
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;
