import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  fetchOralSubjects,
  fetchSubjectsAndTopics,
  fetchTopicQuestionCountsBatch,
} from '../../store/studySlice';
import StudySegmentTabs from './components/StudySegmentTabs';
import StudyCollectionCard from './components/StudyCollectionCard';

const StudySubjectsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { mode, community, level } = route.params || {};

  const examType = community?.name || route.params?.examType || 'Exam';
  const classType = level?.name || route.params?.classType || 'Class';

  const dispatch = useDispatch();
  const {
    subjects,
    topics,
    oralSubjects,
    loadingSubjectsAndTopics,
    loadingOralSubjects,
    questionCounts,
  } = useSelector((state) => state.study);

  const [activeTab, setActiveTab] = useState('WRITTEN');

  useEffect(() => {
    if (community?.id && level?.id) {
      dispatch(fetchSubjectsAndTopics({ communityId: community.id, examLevelId: level.id }));
      dispatch(fetchOralSubjects({ communityId: community.id, examLevelId: level.id }));
    }
  }, [dispatch, community?.id, level?.id]);

  const writtenTopics = useMemo(
    () => topics.filter((topic) => topic.subjectId),
    [topics]
  );

  useEffect(() => {
    const missingTopicIds = writtenTopics
      .filter((topic) => !questionCounts[topic.id])
      .map((topic) => topic.id);

    if (missingTopicIds.length > 0) {
      dispatch(fetchTopicQuestionCountsBatch(missingTopicIds));
    }
  }, [dispatch, writtenTopics, questionCounts]);

  const getSubjectIcon = (title) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('motor') || lower.includes('engine')) return 'cogs';
    if (lower.includes('auxiliary') || lower.includes('pump') || lower.includes('system')) return 'tools';
    if (lower.includes('boiler') || lower.includes('steam') || lower.includes('turbine')) return 'hot-tub';
    if (lower.includes('safety') || lower.includes('environment') || lower.includes('shield')) return 'shield-alt';
    return 'book';
  };

  const tabs = [
    { key: 'WRITTEN', label: 'Written', icon: 'book-reader' },
    { key: 'ORAL', label: 'Oral', icon: 'microphone' },
  ];

  const isLoading = activeTab === 'WRITTEN' ? loadingSubjectsAndTopics : loadingOralSubjects;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode} • {examType}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{classType}</Text>
        </View>
      </View>

      <StudySegmentTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} colors={colors} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {activeTab === 'WRITTEN' ? 'Loading written subjects...' : 'Loading oral subjects...'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introHeader}>
            
            <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
              {activeTab === 'WRITTEN'
                ? 'Pick a syllabus subject to open its topics and practice sections.'
                : 'Pick an oral subject to explore the oral preparation flow.'}
            </Text>
          </View>

          {activeTab === 'WRITTEN' ? (
            subjects.length > 0 ? (
              subjects.map((subject) => {
                const currentTopics = writtenTopics.filter((topic) => topic.subjectId === subject.id);
                const topicsCount = currentTopics.length;
                const subjectTitle = subject.name || subject.title || '';

                return (
                  <StudyCollectionCard
                    key={subject.id}
                    title={subjectTitle}
                    subtitle={`${topicsCount} core study topics`}
                    icon={subject.icon || getSubjectIcon(subjectTitle)}
                    colors={colors}
                    badgeLabel="WRITTEN"
                    badgeColor={colors.primary}
                    onPress={() =>
                      navigation.navigate('StudyTopics', {
                        mode,
                        community,
                        level,
                        examType,
                        classType,
                        subjectId: subject.id,
                        subjectTitle,
                      })
                    }
                  />
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5 name="book-open" size={48} color={colors.textSecondary + '50'} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No written subjects available for this class type.
                </Text>
              </View>
            )
          ) : oralSubjects.length > 0 ? (
            oralSubjects.map((subject) => {
              const subjectTitle = subject.name || subject.title || '';

              return (
                <StudyCollectionCard
                  key={subject.id}
                  title={subjectTitle}
                  subtitle="Explore oral preparation content"
                  icon="microphone"
                  colors={colors}
                  badgeLabel="ORAL"
                  badgeColor="#4CAF50"
                  trailingIcon="arrow-right"
                  onPress={() =>
                    navigation.navigate('StudyOralQuestions', {
                      mode: 'ORAL',
                      community,
                      level,
                      examType,
                      classType,
                      oralSubjectId: subject.id,
                      oralSubjectTitle: subjectTitle,
                    })
                  }
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="microphone-slash" size={48} color={colors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                No oral subjects available.
              </Text>
            </View>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
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
