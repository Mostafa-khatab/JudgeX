import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Trophy, Search, Calendar, Clock, RotateCcw, ChevronRight, Filter } from 'lucide-react-native';
import contestService from '../services/contestService';
import theme from '../theme/theme';

const { width } = Dimensions.get('window');

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
      const data = response.data || response || [];
      const sorted = data.sort((a, b) => {
        const priority = { ongoing: 3, upcoming: 2, ended: 1 };
        if (a.status === b.status) return new Date(b.startTime) - new Date(a.startTime);
        return (priority[b.status] || 0) - (priority[a.status] || 0);
      });
      setContests(sorted);
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
    if (!ms) return '0m';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  };

  const ContestCard = ({ item, index }) => {
    const startTime = new Date(item.startTime);
    const status = item.status?.toLowerCase() || 'ended';
    
    const getStatusColor = () => {
      if (status === 'ongoing') return '#22c55e';
      if (status === 'upcoming') return '#eab308';
      return '#ef4444';
    };

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ContestDetail', { contestId: item.id || item._id })}
        activeOpacity={0.7}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.trophyContainer}>
            <Trophy size={28} color="#eab308" fill="#eab30830" />
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#0ea5e9" />
              <Text style={styles.metaText}>
                {startTime.getFullYear()}-{startTime.getMonth() + 1}-{startTime.getDate()} {startTime.getHours()}:{startTime.getMinutes().toString().padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color="#0ea5e9" />
              <Text style={styles.metaText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: '#fff' }]}>
              {status.toUpperCase()}
            </Text>
          </View>
          <ChevronRight size={20} color="#3f3f46" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Title Header */}
      <View style={styles.titleHeader}>
        <View>
          <Text style={styles.mainTitle}>ALL-CONTESTS</Text>
          <Text style={styles.subtitle}>{contests.length} CONTESTS-FOUND</Text>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => {
            const filters = ['', 'ongoing', 'upcoming', 'ended'];
            const idx = filters.indexOf(statusFilter);
            setStatusFilter(filters[(idx + 1) % filters.length]);
          }}
        >
          <Text style={styles.dropdownText}>
            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'Status'}
          </Text>
          <ChevronRight size={16} color="#71717a" style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Search size={18} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="search-placeholder"
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RotateCcw size={20} color="#fff" />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={contests}
        keyExtractor={(item) => (item.id || item._id).toString()}
        renderItem={({ item, index }) => <ContestCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Trophy size={64} color="#27272a" />
              <Text style={styles.emptyText}>No Contests Found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  titleHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
    alignItems: 'center',
  },
  dropdown: {
    flex: 1,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flex: 2,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  refreshBtn: {
    height: 48,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    marginRight: 16,
  },
  trophyContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indexBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    backgroundColor: '#0ea5e9',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  indexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default ContestsScreen;
