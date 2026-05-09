import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { MessageSquare, Plus, User, Clock, ChevronDown, Image as ImageIcon, Star, Heart, Share2, Send, X, Type, Tag, AlignLeft, MessageCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import blogService from '../services/blogService';
import theme, { colors } from '../theme/theme';

const { width } = Dimensions.get('window');
const LOCAL_IP = '192.168.1.2';
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:8080' : `http://${LOCAL_IP}:8080`;

const getImgUri = (uri) => {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  return `${BASE_URL}${uri.startsWith('/') ? '' : '/'}${uri}`;
};

const BlogCard = ({ item, onLike, onOpenComments }) => {
  const publishDate = new Date(item.createdAt || Date.now());
  const imageUrl = getImgUri(item.image || item.imageUrl);
  const avatarUrl = getImgUri(item.user?.avatar || item.author?.avatar);
  
  return (
    <View style={styles.blogCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTop}>
          <View style={styles.authorAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <User size={20} color="#888" />
            )}
          </View>
          <View style={styles.authorTextInfo}>
            <Text style={styles.authorName}>{item.user?.name || item.author?.name || 'khattab'}</Text>
            <Text style={styles.metaDate}>{publishDate.toLocaleDateString()}</Text>
          </View>
        </View>
        <Text style={styles.blogTitle}>{item.title}</Text>
        <View style={styles.tagsContainer}>
          {(item.tags || ['Tech']).map((tag, idx) => (
            <View key={idx} style={styles.tagPill}><Text style={styles.tagPillText}>{tag}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.blogImg} resizeMode="cover" />
        ) : (
          <View style={[styles.blogImg, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
             <ImageIcon size={40} color="#333" />
          </View>
        )}
      </View>

      <Text style={styles.blogExcerpt} numberOfLines={3}>
         {item.content?.replace(/<[^>]*>?/gm, '').replace(/[#*]/g, '').trim() || "No content available."}
      </Text>

      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item._id)}>
            <Heart size={18} color={item.isLiked ? "#ef4444" : "#fff"} fill={item.isLiked ? "#ef4444" : "transparent"} />
            <Text style={[styles.actionLabel, item.isLiked && { color: '#ef4444' }]}>
              {item.likesCount !== undefined ? item.likesCount : (item.likes?.length || 0)}
            </Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(item)}>
            <MessageCircle size={18} color="#fff" />
            <Text style={styles.actionLabel}>
              {item.commentsCount || 0}
            </Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
            <Share2 size={18} color="#fff" />
         </TouchableOpacity>
      </View>
    </View>
  );
};

const BlogsScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', tags: '', imageUrl: '', content: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  const [selectedBlogForComments, setSelectedBlogForComments] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const fetchBlogs = useCallback(async (currentPage = 1) => {
    try {
      setLoading(currentPage === 1);
      const res = await blogService.getBlogs({ page: currentPage, limit: 10 });
      const newBlogs = res.data || [];
      if (currentPage === 1) setBlogs(newBlogs);
      else setBlogs(prev => [...prev, ...newBlogs]);
      setHasMore(newBlogs.length === 10);
    } catch (err) {
      console.error('Failed to load blogs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) setCurrentUser(JSON.parse(userJson));
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
    fetchBlogs(1);
  }, [fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBlogs(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBlogs(nextPage);
    }
  };

  const handlePublish = async () => {
    if (!newBlog.title || !newBlog.content) {
      alert('Title and Content are required!');
      return;
    }
    setIsPublishing(true);
    try {
      const blogData = {
        title: newBlog.title,
        content: newBlog.content,
        tags: newBlog.tags.split(',').map(t => t.trim()).filter(t => t),
        image: newBlog.imageUrl || null,
      };
      const res = await blogService.createBlog(blogData);
      const createdBlog = res.data || res;
      setBlogs(prev => [createdBlog, ...prev]);
      setIsCreateModalOpen(false);
      setNewBlog({ title: '', tags: '', imageUrl: '', content: '' });
    } catch (err) {
      alert('Failed to publish: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await blogService.likeBlog(id);
      if (res.success) {
        setBlogs(prev => prev.map(blog => {
          if (blog._id === id) {
            return {
              ...blog,
              likesCount: res.likesCount,
              isLiked: res.isLiked,
              likes: res.isLiked ? [...(blog.likes || []), 'me'] : (blog.likes || []).filter(l => l !== 'me')
            };
          }
          return blog;
        }));
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const fetchComments = async (blogId) => {
    setIsCommentsLoading(true);
    try {
      const res = await blogService.getComments(blogId);
      setComments(res.data || []);
    } catch (err) {
      console.error('Fetch comments failed:', err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleOpenComments = (blog) => {
    setSelectedBlogForComments(blog);
    setIsCommentModalOpen(true);
    setComments([]);
    fetchComments(blog._id);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedBlogForComments) return;
    setIsPostingComment(true);
    try {
      const res = await blogService.addComment(selectedBlogForComments._id, newCommentText);
      const commentData = res.comment || res.data?.comment || res.data;
      if (commentData) {
        // Enrich comment with current user info if missing
        const enrichedComment = {
          ...commentData,
          user: commentData.user && typeof commentData.user === 'object' 
            ? commentData.user 
            : currentUser || { name: 'You' }
        };
        setComments(prev => [enrichedComment, ...prev]);
        setNewCommentText('');
        setBlogs(prev => prev.map(b => b._id === selectedBlogForComments._id ? { ...b, commentsCount: (b.commentsCount || 0) + 1 } : b));
      }
    } catch (err) {
       console.error('Post comment failed:', err);
       alert('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <View style={styles.scoreBadge}>
          <Star size={16} color="#eab308" fill="#eab308" />
          <Text style={styles.scoreText}>500</Text>
        </View>
        <View style={styles.topAvatar}>
          <User size={20} color="#fff" />
        </View>
      </View>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Community Feed</Text>
          <Text style={styles.headerSub}>Join the discussion and share your expertise</Text>
        </View>
        <TouchableOpacity style={styles.writeButton} onPress={() => setIsCreateModalOpen(true)}>
           <Plus size={20} color="white" />
           <Text style={styles.writeButtonText}>Write a Blog</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {loading && page === 1 ? (
          <View style={styles.centerLoader}><ActivityIndicator size="large" color="#3b82f6" /></View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item) => (item._id || item.externalId || Math.random()).toString()}
            renderItem={({ item }) => <BlogCard item={item} onLike={handleLike} onOpenComments={handleOpenComments} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={hasMore && loading ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
            ListEmptyComponent={<View style={styles.emptyContainer}><MessageSquare size={64} color="#27272a" strokeWidth={1} /><Text style={styles.emptyText}>No Community Posts Yet</Text></View>}
          />
        )}
      </View>

      <Modal visible={isCreateModalOpen} animationType="fade" transparent>
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.planeIcon}><Send size={20} color="#fff" /></View>
                <View><Text style={styles.modalTitle}>Create New Blog</Text><Text style={styles.modalSub}>Share your knowledge with the community</Text></View>
              </View>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}><X size={24} color="#71717a" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}><View style={styles.labelRow}><Type size={14} color="#3b82f6" /><Text style={styles.inputLabel}>Blog Title</Text></View>
              <TextInput style={styles.modalInput} placeholder="Enter a catchy title..." placeholderTextColor="#52525b" value={newBlog.title} onChangeText={t => setNewBlog({...newBlog, title: t})} /></View>
              <View style={styles.inputGroup}><View style={styles.labelRow}><Tag size={14} color="#8b5cf6" /><Text style={styles.inputLabel}>Tags (comma separated)</Text></View>
              <TextInput style={styles.modalInput} placeholder="e.g. React, JavaScript, AI" placeholderTextColor="#52525b" value={newBlog.tags} onChangeText={t => setNewBlog({...newBlog, tags: t})} /></View>
              <View style={styles.inputGroup}><View style={styles.labelRow}><ImageIcon size={14} color="#f59e0b" /><Text style={styles.inputLabel}>Cover Image URL (optional)</Text></View>
              <TextInput style={styles.modalInput} placeholder="https://example.com/image.jpg" placeholderTextColor="#52525b" value={newBlog.imageUrl} onChangeText={t => setNewBlog({...newBlog, imageUrl: t})} /></View>
              <View style={styles.inputGroup}><View style={styles.labelRow}><AlignLeft size={14} color="#10b981" /><Text style={styles.inputLabel}>Content</Text></View>
              <TextInput style={[styles.modalInput, styles.textArea]} multiline placeholder="Write your blog content here... (Markdown supported)" placeholderTextColor="#52525b" textAlignVertical="top" value={newBlog.content} onChangeText={t => setNewBlog({...newBlog, content: t})} /></View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={isPublishing}>{isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.publishText}>Publish Blog</Text></>}</TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={isCommentModalOpen} transparent animationType="slide">
        <View style={styles.commentModalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.commentModalContent}>
            <View style={styles.commentHeader}>
              <View style={styles.commentHeaderLine} />
              <View style={styles.commentTitleRow}>
                <Text style={styles.commentModalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setIsCommentModalOpen(false)} style={styles.closeBtnSmall}><X size={20} color="#fff" /></TouchableOpacity>
              </View>
            </View>
            {isCommentsLoading ? (
              <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item, index) => item._id || index.toString()}
                renderItem={({ item }) => {
                  const commenter = item.user || item.author;
                  const commenterName = commenter?.name || commenter?.username || 'User';
                  const commenterAvatar = commenter?.avatar;
                  
                  return (
                    <View style={styles.commentItem}>
                      <View style={styles.commentAuthorRow}>
                        <Image source={{ uri: getImgUri(commenterAvatar) }} style={styles.commentAvatarSmall} />
                        <View>
                          <Text style={styles.commentAuthorName}>{commenterName}</Text>
                          <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  );
                }}
                ListEmptyComponent={() => <View style={styles.emptyComments}><MessageSquare size={40} color="#333" /><Text style={styles.emptyCommentsText}>No comments yet.</Text></View>}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
            <View style={styles.commentInputRow}>
              <TextInput style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor="#71717a" value={newCommentText} onChangeText={setNewCommentText} multiline />
              <TouchableOpacity style={[styles.commentSendBtn, !newCommentText.trim() && { opacity: 0.5 }]} onPress={handleAddComment} disabled={isPostingComment || !newCommentText.trim()}>
                {isPostingComment ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4 },
  scoreText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  writeButton: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8, elevation: 5, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  writeButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  listContainer: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 100 },
  blogCard: { backgroundColor: '#161b22', borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#30363d', overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardHeader: { padding: 16 },
  cardHeaderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', borderWidth: 1, borderColor: '#444', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  authorTextInfo: { flex: 1 },
  authorName: { color: '#3b82f6', fontSize: 15, fontWeight: '700' },
  metaDate: { color: '#71717a', fontSize: 12 },
  blogTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10, lineHeight: 26 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  tagPillText: { color: '#60a5fa', fontSize: 11, fontWeight: '700' },
  imageWrapper: { height: 220, width: '100%', backgroundColor: '#0d1117' },
  blogImg: { flex: 1 },
  blogExcerpt: { color: '#9ca3af', fontSize: 14, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
  cardDivider: { height: 1, backgroundColor: '#30363d', marginHorizontal: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#8B949E', fontSize: 16, fontWeight: '700', marginTop: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161b22', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#30363d', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalHeaderLeft: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  planeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  modalSub: { color: '#71717a', fontSize: 13 },
  modalForm: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalInput: { backgroundColor: '#0d1117', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#30363d' },
  textArea: { height: 150 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  cancelText: { color: '#71717a', fontSize: 15, fontWeight: '600' },
  publishButton: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, gap: 8 },
  publishText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  commentModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentModalContent: { backgroundColor: '#161b22', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', borderWidth: 1, borderColor: '#30363d' },
  commentHeader: { alignItems: 'center', paddingVertical: 12 },
  commentHeaderLine: { width: 40, height: 4, backgroundColor: '#30363d', borderRadius: 2, marginBottom: 12 },
  commentTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  commentModalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  commentItem: { marginBottom: 20, backgroundColor: '#0d1117', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#30363d', marginHorizontal: 16 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commentAvatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' },
  commentAuthorName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  commentTime: { color: '#71717a', fontSize: 11 },
  commentText: { color: '#d1d5db', fontSize: 14, lineHeight: 20 },
  emptyComments: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.5 },
  emptyCommentsText: { color: '#fff', fontSize: 14, textAlign: 'center', marginTop: 12, paddingHorizontal: 40 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#30363d', backgroundColor: '#0d1117' },
  commentInput: { flex: 1, backgroundColor: '#161b22', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: '#fff', fontSize: 14, maxHeight: 100 },
  commentSendBtn: { backgroundColor: '#0ea5e9', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeBtnSmall: { padding: 4 },
});

export default BlogsScreen;
