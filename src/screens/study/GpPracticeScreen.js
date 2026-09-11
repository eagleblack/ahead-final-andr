import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGpPracticeQuestions, fetchBookmarks, toggleBookmark } from '../../store/studySlice';

const GpPracticeScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { gpSubject } = route.params || {};
  
  // Use passed colors or fallback to a default theme structure if necessary
  const themeColors = colors || {
    background: '#F8F9FE',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#1976D2',
  };

  const dispatch = useDispatch();
  const { gpPracticeQuestions, bookmarks, loadingGpPracticeQuestions } = useSelector((state) => state.study);
  
  useEffect(() => {
    if (gpSubject?.id) {
      dispatch(fetchGpPracticeQuestions(gpSubject.id));
    }
  }, [dispatch, gpSubject?.id]);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const currentQuestions = gpPracticeQuestions[gpSubject?.id] || [];
  const isLoading = loadingGpPracticeQuestions;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: themeColors.surface, borderColor: themeColors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>GP • PRACTICE</Text>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {gpSubject?.name}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Progress / Context Banner */}
      <View style={[styles.contextBanner, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.textSecondary + '10' }]}>
        <View style={styles.bannerRow}>
          <View style={styles.modeIndicator}>
            <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.modeText, { color: themeColors.text }]}>
              GP Written Q&A
            </Text>
          </View>
          <Text style={[styles.countText, { color: themeColors.textSecondary }]}>
            {currentQuestions.length} Questions
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading questions...</Text>
        </View>
      ) : (
        <FlatList
          data={currentQuestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 130 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isBookmarked = bookmarks.some((b) => b.questionId === item.id);
            return (
              <View style={[styles.questionCard, { backgroundColor: themeColors.surface }]}>
                <View style={styles.cardHeader}>
                  {item.year ? (
                    <View style={[styles.yearBadge, { backgroundColor: themeColors.primary + '15' }]}>
                      <Text style={[styles.yearBadgeText, { color: themeColors.primary }]}>{item.year}</Text>
                    </View>
                  ) : <View />}
                  <TouchableOpacity
                    onPress={() => dispatch(toggleBookmark({
                      questionItem: item,
                      questionType: 'gp',
                      sourceCollection: 'gpQuestion',
                      topicId: gpSubject.id,
                      isBookmarked
                    }))}
                    style={styles.bookmarkBtn}
                  >
                    <FontAwesome5 name="bookmark" size={16} color={isBookmarked ? '#FF8F00' : themeColors.textSecondary + '50'} solid={isBookmarked} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('GpAnswer', {
                      topicTitle: gpSubject.name,
                      questionItem: item,
                      topicId: gpSubject.id,
                      colors: themeColors
                    })
                  }
                  style={styles.cardBody}
                >
                  <Text style={[styles.questionText, { color: themeColors.text }]}>
                    {item.question}
                  </Text>
                  
                  {item.questionImage ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.questionImage }} style={styles.questionImage} resizeMode="contain" />
                    </View>
                  ) : null}
                  
                  <View style={[styles.divider, { backgroundColor: themeColors.textSecondary + '15' }]} />

                  <View style={styles.cardFooter}>
                    <View style={[styles.readButton, { backgroundColor: themeColors.primary }]}>
                      <Text style={[styles.readButtonText, { color: '#FFF' }]}>
                        Read Answer
                      </Text>
                      <FontAwesome5 name="arrow-right" size={10} color="#FFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.instructionTitle, { color: themeColors.text }]}>
                Select a question to read standard guides
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesome5 name="question-circle" size={48} color={themeColors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No questions available in this section.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1, marginHorizontal: 16 },
  subtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  placeholderButton: { width: 40 },
  contextBanner: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeIndicator: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  modeText: { fontSize: 12, fontWeight: '600' },
  countText: { fontSize: 12, fontWeight: '500' },
  listContent: { paddingHorizontal: 20 },
  listHeader: { marginVertical: 20 },
  instructionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  questionCard: { padding: 20, marginBottom: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  yearBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  yearBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bookmarkBtn: { padding: 4 },
  cardBody: {},
  questionText: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 12 },
  imageContainer: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#F3F4F6' },
  questionImage: { width: '100%', height: '100%' },
  divider: { height: 1, width: '100%', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  readButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  readButtonText: { fontSize: 12, fontWeight: '700', marginRight: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, fontWeight: '500', marginTop: 12 },
});

export default GpPracticeScreen;
