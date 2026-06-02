import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookmarks, toggleBookmark } from '../../store/studySlice';

const StudyBookmarksScreen = ({ navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { bookmarks, loadingBookmarks } = useSelector((state) => state.study);

  // Active Tab: 'COC' | 'ORAL' | 'MCQ' | 'FIB' | 'FLASHCARD'
  const [activeTab, setActiveTab] = useState('COC');
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const handleToggleBookmark = (item, type, source) => {
    dispatch(
      toggleBookmark({
        questionItem: item,
        questionType: type,
        sourceCollection: source,
        topicId: null,
        isBookmarked: true, // It is currently bookmarked, so toggle will remove it
      })
    );
  };

  // Filter bookmarks by type
  const cocBookmarks = bookmarks.filter((b) => b.questionType === 'coc');
  const oralBookmarks = bookmarks.filter((b) => b.questionType === 'oral');
  const mcqBookmarks = bookmarks.filter((b) => b.questionType === 'mcq');
  const fibBookmarks = bookmarks.filter((b) => b.questionType === 'fillBlank');
  const flashcardBookmarks = bookmarks.filter((b) => b.questionType === 'flashcard');

  const getActiveList = () => {
    switch (activeTab) {
      case 'COC':
        return cocBookmarks;
      case 'ORAL':
        return oralBookmarks;
      case 'MCQ':
        return mcqBookmarks;
      case 'FIB':
        return fibBookmarks;
      case 'FLASHCARD':
        return flashcardBookmarks;
      default:
        return [];
    }
  };

  const currentList = getActiveList();

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
          <Text style={[styles.mainTitle, { color: colors.text }]}>My Bookmarks</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBarScrollWrapper, { borderBottomColor: colors.textSecondary + '10' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {[
            { id: 'COC', name: 'COC', count: cocBookmarks.length, icon: 'book' },
            { id: 'ORAL', name: 'Oral', count: oralBookmarks.length, icon: 'microphone' },
            { id: 'MCQ', name: 'MCQ', count: mcqBookmarks.length, icon: 'tasks' },
            { id: 'FIB', name: 'Fill Blank', count: fibBookmarks.length, icon: 'pen-nib' },
            { id: 'FLASHCARD', name: 'Flashcard', count: flashcardBookmarks.length, icon: 'copy' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveTab(tab.id);
                setExpandedCardId(null);
              }}
              style={[
                styles.tabItem,
                activeTab === tab.id && [styles.activeTabItem, { borderBottomColor: colors.primary }],
              ]}
            >
              <FontAwesome5 name={tab.icon} size={11} color={activeTab === tab.id ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.textSecondary }]}>
                {tab.name} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingBookmarks ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Retrieving saved items...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          {currentList.length > 0 ? (
            currentList.map((bookmark) => {
              const qItem = bookmark.questionItem;
              const isExpanded = expandedCardId === bookmark.id;

              return (
                <View key={bookmark.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '10' }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
                        {bookmark.questionType.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleBookmark(qItem, bookmark.questionType, bookmark.sourceCollection)}
                      style={styles.unbookmarkBtn}
                    >
                      <FontAwesome5 name="bookmark" size={14} color="#FF8F00" solid />
                    </TouchableOpacity>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {qItem.question || qItem.front || 'Empty question prompt'}
                    </Text>

                    {/* Reveal/Interaction Area */}
                    {activeTab === 'COC' || activeTab === 'ORAL' ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate('StudyAnswer', {
                            mode: 'COC',
                            isOral: activeTab === 'ORAL',
                            topicTitle: bookmark.questionType.toUpperCase() + ' Question',
                            questionItem: qItem,
                            topicId: bookmark.topicId,
                          })
                        }
                        style={[styles.actionButton, { backgroundColor: colors.primary + '08' }]}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                          Open Explanation Article
                        </Text>
                        <FontAwesome5 name="arrow-right" size={10} color={colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      /* Interview type reveal */
                      <View style={{ marginTop: 10 }}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setExpandedCardId(isExpanded ? null : bookmark.id)}
                          style={[styles.actionButton, { backgroundColor: colors.textSecondary + '08' }]}
                        >
                          <Text style={[styles.actionButtonText, { color: colors.text }]}>
                            {isExpanded ? 'Hide Solution' : 'Reveal Solution'}
                          </Text>
                          <FontAwesome5 name={isExpanded ? 'chevron-up' : 'chevron-down'} size={10} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={[styles.expandedContent, { borderTopColor: colors.textSecondary + '10' }]}>
                            {activeTab === 'MCQ' && (
                              <View>
                                {qItem.options && qItem.options.map((opt, idx) => {
                                  const isCorrect = opt === qItem.answer || (qItem.correctOptionNumber !== undefined && idx === qItem.correctOptionNumber);
                                  return (
                                    <View key={idx} style={[styles.optionRow, isCorrect && { backgroundColor: '#4CAF5010', borderColor: '#4CAF50', borderWidth: 1 }]}>
                                      <Text style={[styles.optionIndexText, { color: isCorrect ? '#2E7D32' : colors.textSecondary }]}>
                                        {String.fromCharCode(65 + idx)}.
                                      </Text>
                                      <Text style={[styles.optionText, { color: isCorrect ? '#2E7D32' : colors.text }]}>
                                        {opt}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            )}

                            {activeTab === 'FIB' && (
                              <View style={styles.solutionBox}>
                                <Text style={[styles.solutionLabel, { color: colors.textSecondary }]}>CORRECT TERM:</Text>
                                <Text style={[styles.solutionText, { color: colors.text }]}>{qItem.answer}</Text>
                              </View>
                            )}

                            {activeTab === 'FLASHCARD' && (
                              <View style={styles.solutionBox}>
                                <Text style={[styles.solutionLabel, { color: colors.textSecondary }]}>ANSWER KEY:</Text>
                                <Text style={[styles.solutionText, { color: colors.text }]}>{qItem.back}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="bookmark" size={54} color={colors.textSecondary + '40'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bookmarks Saved</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Questions you bookmark in COC syllabus, oral drills, and interview simulations will show up here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default StudyBookmarksScreen;

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
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
  },
  tabBarScrollWrapper: {
    height: 48,
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  unbookmarkBtn: {
    padding: 4,
  },
  cardBody: {},
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  optionIndexText: {
    fontWeight: 'bold',
    marginRight: 6,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
  },
  solutionBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#00000005',
  },
  solutionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
