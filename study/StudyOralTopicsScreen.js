import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOralTopics, fetchTopicQuestionCountsBatch } from '../../store/studySlice';
import StudyCollectionCard from './components/StudyCollectionCard';

const StudyOralTopicsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {
    community,
    level,
    examType,
    classType,
    oralSubjectId,
    oralSubjectTitle,
  } = route.params || {};

  const { oralTopics, loadingOralTopics, questionCounts } = useSelector((state) => state.study);

  useEffect(() => {
    dispatch(fetchOralTopics());
  }, [dispatch]);

  const filteredTopics = useMemo(() => {
    if (!oralSubjectId) {
      return oralTopics;
    }

    const scopedTopics = oralTopics.filter((topic) => {
      const topicScope =
        topic.oralSubjectId ||
        topic.subjectId ||
        topic.oralSubject ||
        topic.subject ||
        topic.categoryId;

      return topicScope === oralSubjectId || topicScope === oralSubjectTitle;
    });

    return scopedTopics.length > 0 ? scopedTopics : oralTopics;
  }, [oralTopics, oralSubjectId, oralSubjectTitle]);

  useEffect(() => {
    const missingTopicIds = filteredTopics
      .filter((topic) => !questionCounts[topic.id])
      .map((topic) => topic.id);

    if (missingTopicIds.length > 0) {
      dispatch(fetchTopicQuestionCountsBatch(missingTopicIds));
    }
  }, [dispatch, filteredTopics, questionCounts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            ORAL • {examType}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {oralSubjectTitle || classType}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {loadingOralTopics ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading oral topics...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introHeader}>
            <Text style={[styles.introTitle, { color: colors.text }]}>Oral Topics</Text>
            <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
              Open a topic to review oral question guides and explanations.
            </Text>
          </View>

          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic, index) => {
              const topicTitle = topic.name || topic.title || '';
              const counts = questionCounts[topic.id] || { cocCount: 0, oralCount: 0 };

              return (
                <StudyCollectionCard
                  key={topic.id}
                  title={topicTitle}
                  subtitle={`${counts.oralCount} oral questions`}
                  icon="microphone"
                  colors={colors}
                  badgeLabel={String(index + 1).padStart(2, '0')}
                  badgeColor="#4CAF50"
                  trailingIcon="arrow-right"
                  onPress={() =>
                    navigation.navigate('StudyQuestions', {
                      mode: 'COC',
                      isOral: true,
                      community,
                      level,
                      examType,
                      classType,
                      topicId: topic.id,
                      topicTitle,
                    })
                  }
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="microphone-slash" size={48} color={colors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>
                No oral topics available for this subject.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default StudyOralTopicsScreen;

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
    textAlign: 'center',
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
