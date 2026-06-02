import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubjectsAndTopics, fetchOralTopics, fetchTopicQuestionCounts } from '../../store/studySlice';

const StudySubjectsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { mode, community, level } = route.params || {};

  const examType = community?.name || route.params?.examType || 'Exam';
  const classType = level?.name || route.params?.classType || 'Class';

  const dispatch = useDispatch();
  const { subjects, topics, loadingSubjectsAndTopics, oralTopics, loadingOralTopics, questionCounts } = useSelector((state) => state.study);
  const [activeTab, setActiveTab] = useState('COC'); // 'COC' | 'ORAL'

  useEffect(() => {
    if (community?.id && level?.id) {
      dispatch(fetchSubjectsAndTopics({ communityId: community.id, examLevelId: level.id }));
    }
    dispatch(fetchOralTopics());
  }, [dispatch, community?.id, level?.id]);

  // Fetch question counts when topics or oralTopics load
  useEffect(() => {
    topics.forEach((topic) => {
      if (!questionCounts[topic.id]) {
        dispatch(fetchTopicQuestionCounts(topic.id));
      }
    });
  }, [topics]);

  useEffect(() => {
    oralTopics.forEach((topic) => {
      if (!questionCounts[topic.id]) {
        dispatch(fetchTopicQuestionCounts(topic.id));
      }
    });
  }, [oralTopics]);

  const getSubjectIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('motor') || t.includes('engine')) return 'cogs';
    if (t.includes('auxiliary') || t.includes('pump') || t.includes('system')) return 'tools';
    if (t.includes('boiler') || t.includes('steam') || t.includes('turbine')) return 'hot-tub';
    if (t.includes('safety') || t.includes('environment') || t.includes('shield')) return 'shield-alt';
    return 'book';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode} • {examType}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{classType}</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Segmented Tab Controls */}
      

      {activeTab === 'COC' && loadingSubjectsAndTopics ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading syllabus subjects...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introHeader}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              {activeTab === 'COC' ? 'Syllabus Subjects' : 'Oral Study Topics'}
            </Text>
           
          </View>

          {/* Render Tab Contents */}
          {activeTab === 'COC' ? (
            subjects.length > 0 ? (
              subjects.map((subject) => {
                const currentTopics = topics.filter((t) => t.subjectId === subject.id);
                const topicsCount = currentTopics.length;
                const subjectTitle = subject.name || subject.title || '';
                const icon = subject.icon || getSubjectIcon(subjectTitle);

                return (
                  <TouchableOpacity
                    key={subject.id}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('StudyTopics', {
                        mode,
                        community,
                        level,
                        examType,
                        classType,
                        subjectId: subject.id,
                        subjectTitle: subjectTitle,
                      })
                    }
                    style={[styles.subjectCard, { backgroundColor: colors.surface }]}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '10' }]}>
                      <FontAwesome5 name={icon} size={20} color={colors.primary} />
                    </View>

                    <View style={styles.subjectInfo}>
                      <Text style={[styles.subjectTitle, { color: colors.text }]}>{subjectTitle}</Text>
                      <Text style={[styles.subjectTopics, { color: colors.textSecondary }]}>
                        {topicsCount} core study topics
                      </Text>
                    </View>

                    <View style={[styles.arrowWrapper, { backgroundColor: colors.textSecondary + '08' }]}>
                      <FontAwesome5 name="chevron-right" size={12} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5 name="book-open" size={48} color={colors.textSecondary + '50'} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No subjects available for this class type.
                </Text>
              </View>
            )
          ) : (
            /* ORAL TAB */
            loadingOralTopics ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
            ) : oralTopics.length > 0 ? (
              oralTopics.map((topic, index) => {
                const topicTitle = topic.name || topic.title || '';
                const counts = questionCounts[topic.id] || { cocCount: 0, oralCount: 0 };

                return (
                  <TouchableOpacity
                    key={topic.id}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('StudyQuestions', {
                        mode: 'COC',
                        isOral: true,
                        community,
                        level,
                        examType,
                        classType,
                        topicId: topic.id,
                        topicTitle: topicTitle,
                      })
                    }
                    style={[styles.topicCard, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.topicHeader}>
                      <View style={[styles.numberBadge, { backgroundColor: colors.primary + '12' }]}>
                        <Text style={[styles.numberText, { color: colors.primary }]}>
                          {String(index + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={styles.topicInfo}>
                        <Text style={[styles.topicTitle, { color: colors.text }]}>{topicTitle}</Text>
                        <View style={styles.metaRow}>
                          <View style={[styles.tag, { backgroundColor: colors.primary + '08', marginRight: 8 }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>
                              {counts.cocCount} COC
                            </Text>
                          </View>
                          <View style={[styles.tag, { backgroundColor: '#4CAF50' + '08' }]}>
                            <Text style={[styles.tagText, { color: '#4CAF50' }]}>
                              {counts.oralCount} Oral
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.arrowWrapper, { backgroundColor: colors.textSecondary + '08' }]}>
                        <FontAwesome5 name="arrow-right" size={10} color={colors.textSecondary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5 name="microphone-slash" size={48} color={colors.textSecondary + '50'} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No oral topics available.
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default StudySubjectsScreen;

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
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  introHeader: {
    marginVertical: 20,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  introDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
    paddingRight: 8,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  subjectTopics: {
    fontSize: 12,
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
  },
  topicCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  numberText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  topicInfo: {
    flex: 1,
    paddingRight: 8,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
