import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuestions, fetchOralQuestions, fetchBookmarks, toggleBookmark } from '../../store/studySlice';

const StudyQuestionsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { mode, community, level, examType, classType, topicId, topicTitle } = route.params || {};

  const dispatch = useDispatch();
  const { questions: questionsMap, oralQuestions: oralQuestionsMap, bookmarks, loadingQuestions, loadingOralQuestions, questionCounts } = useSelector((state) => state.study);
  const [activeTab, setActiveTab] = useState(route.params?.isOral ? 'ORAL' : 'COC');

  useEffect(() => {
    if (topicId) {
      if (activeTab === 'COC') {
        dispatch(fetchQuestions(topicId));
      } else {
        dispatch(fetchOralQuestions(topicId));
      }
    }
  }, [dispatch, topicId, activeTab]);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const counts = questionCounts[topicId] || { cocCount: 0, oralCount: 0 };
  const currentQuestions = activeTab === 'COC' ? (questionsMap[topicId] || []) : (oralQuestionsMap[topicId] || []);
  const isLoading = activeTab === 'COC' ? loadingQuestions : loadingOralQuestions;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{examType} • {classType}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {topicTitle}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Segmented Tab Controls */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.textSecondary + '10' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('COC')}
          style={[styles.tabItem, activeTab === 'COC' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="book" size={12} color={activeTab === 'COC' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'COC' ? colors.primary : colors.textSecondary }]}>
            Written ({counts.cocCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('ORAL')}
          style={[styles.tabItem, activeTab === 'ORAL' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="microphone" size={12} color={activeTab === 'ORAL' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'ORAL' ? colors.primary : colors.textSecondary }]}>
            Oral({counts.oralCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress / Context Banner */}
      <View style={[styles.contextBanner, { backgroundColor: colors.surface, borderBottomColor: colors.textSecondary + '10' }]}>
        <View style={styles.bannerRow}>
          <View style={styles.modeIndicator}>
            <View style={[styles.dot, { backgroundColor: activeTab === 'ORAL' ? '#4CAF50' : '#2196F3' }]} />
            <Text style={[styles.modeText, { color: colors.text }]}>
              {activeTab === 'ORAL' ? 'Oral Syllabus Q&A' : 'COC Oral Q&A Syllabus'}
            </Text>
          </View>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {activeTab === 'ORAL' ? counts.oralCount : counts.cocCount} Questions
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading questions...</Text>
        </View>
      ) : (
        /* Questions list */
        <FlatList
          data={currentQuestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 130 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isBookmarked = bookmarks.some((b) => b.questionId === item.id);
            return (
              <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                  {item.year ? (
                    <View style={[styles.yearBadge, { backgroundColor: colors.primary + '10' }]}>
                      <Text style={[styles.yearBadgeText, { color: colors.primary }]}>{item.year}</Text>
                    </View>
                  ) : <View />}
                  <TouchableOpacity
                    onPress={() => dispatch(toggleBookmark({
                      questionItem: item,
                      questionType: activeTab === 'COC' ? 'coc' : 'oral',
                      sourceCollection: activeTab === 'COC' ? 'questions' : 'oral_questions',
                      topicId,
                      isBookmarked
                    }))}
                    style={styles.bookmarkBtn}
                  >
                    <FontAwesome5 name="bookmark" size={14} color={isBookmarked ? '#FF8F00' : colors.textSecondary} solid={isBookmarked} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('StudyAnswer', {
                      mode,
                      isOral: activeTab === 'ORAL',
                      community,
                      level,
                      examType,
                      classType,
                      topicTitle,
                      questionItem: item,
                      topicId,
                    })
                  }
                  style={styles.cardBody}
                >
                  <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={3}>
                    {item.question}
                  </Text>
                  <View style={[styles.readButton, { backgroundColor: colors.primary + '08' }]}>
                    <Text style={[styles.readButtonText, { color: colors.primary }]}>
                      Read Answer
                    </Text>
                    <FontAwesome5 name="arrow-right" size={10} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.instructionTitle, { color: colors.text }]}>
                Select a question to read standard guides
              </Text>
              <Text style={[styles.instructionDesc, { color: colors.textSecondary }]}>
                {activeTab === 'ORAL'
                  ? 'Click any oral question below to open its verified detailed explanation formatted as an article.'
                  : 'Click any syllabus question below to open its verified detailed explanation formatted as an article.'}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesome5 name="question-circle" size={48} color={colors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No questions available in this section.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default StudyQuestionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  contextBanner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listHeader: {
    marginVertical: 20,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  questionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  yearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  yearBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bookmarkBtn: {
    padding: 6,
  },
  cardBody: {},
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});
