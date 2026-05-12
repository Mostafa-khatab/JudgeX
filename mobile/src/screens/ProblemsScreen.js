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
import { Search, Filter, RotateCcw, CheckCircle2, ChevronRight, Hash, Award } from 'lucide-react-native';
import problemService from '../services/problemService';
import theme from '../theme/theme';

const { width } = Dimensions.get('window');

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
        size: 100,
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

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#eab308';
      case 'hard': return '#ef4444';
      default: return '#71717a';
    }
  };

  const ProblemCard = ({ item }) => {
    const color = getDifficultyColor(item.difficulty);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProblemDetail', { problemId: item.id || item._id })}
        activeOpacity={0.7}
        style={styles.card}
      >
        <View style={styles.statusIcon}>
          {item.solve ? (
            <CheckCircle2 size={24} color="#22c55e" />
          ) : (
            <View style={styles.unsolvedCircle}>
              <Hash size={12} color="#444" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.diffPill}>
              <View style={[styles.diffDot, { backgroundColor: color }]} />
              <Text style={[styles.diffText, { color }]}>{item.difficulty?.toUpperCase()}</Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.pointsText}>{item.point || 0} POINTS</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
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
          <Text style={styles.mainTitle}>ALL PROBLEMS</Text>
          <Text style={styles.subtitle}>{problems.length} CHALLENGES AVAILABLE</Text>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => {
            const filters = ['', 'easy', 'medium', 'hard'];
            const idx = filters.indexOf(difficultyFilter);
            setDifficultyFilter(filters[(idx + 1) % filters.length]);
          }}
        >
          <Text style={styles.dropdownText}>
            {difficultyFilter ? difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1) : 'Difficulty'}
          </Text>
          <ChevronRight size={16} color="#71717a" style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Search size={18} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search problems..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RotateCcw size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={problems}
        keyExtractor={(item) => (item.id || item._id).toString()}
        renderItem={({ item }) => <ProblemCard item={item} />}
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
              <Award size={64} color="#27272a" />
              <Text style={styles.emptyText}>No Problems Available</Text>
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
    flex: 1.2,
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
    width: 48,
    height: 48,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusIcon: {
    marginRight: 16,
  },
  unsolvedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaDivider: {
    color: '#333',
    marginHorizontal: 8,
  },
  pointsText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardRight: {
    marginLeft: 10,
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
  errorBanner: {
    backgroundColor: '#ef444420',
    padding: 10,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default ProblemsScreen;

