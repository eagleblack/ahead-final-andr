import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTopicQuestionCounts } from '../../store/studySlice';

const StudyTopicsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { mode, community, level, examType, classType, subjectId, subjectTitle } = route.params || {};

  const dispatch = useDispatch();

  // Retrieve topics from centralized store
  const { topics, questionCounts } = useSelector((state) => state.study);

  // Filter topics for this subject 
  const subjectTopics = topics.filter((t) => t.subjectId === subjectId);

  // Fetch counts when topics load
  useEffect(() => {
    subjectTopics.forEach((topic) => {
      if (!questionCounts[topic.id]) {
        dispatch(fetchTopicQuestionCounts(topic.id));
      }
    });
  }, [subjectTopics]);

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
            {subjectTitle}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introHeader}>
          <Text style={[styles.introTitle, { color: colors.text }]}>Study Topics</Text>
         
        </View>

        {/* Topics List */}
        {subjectTopics.length > 0 ? (
          subjectTopics.map((topic, index) => {
           
            const topicTitle = topic.name || topic.title || '';
            const counts = questionCounts[topic.id] || { cocCount: 0, oralCount: 0 };

            return (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('StudyQuestions', {
                    mode,
                    community,
                    level,
                    examType,
                    classType,
                    subjectId,
                    subjectTitle,
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
                        <FontAwesome5 name="question-circle" size={10} color={colors.primary} />
                        <Text style={[styles.tagText, { color: colors.primary }]}>
                           {counts.cocCount} COC
                        </Text>
                      </View>
                      <View style={[styles.tag, { backgroundColor: '#4CAF50' + '08' }]}>
                        <FontAwesome5 name="microphone" size={10} color="#4CAF50" />
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
            <FontAwesome5 name="folder-open" size={48} color={colors.textSecondary + '50'} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No topics available for this subject.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StudyTopicsScreen;

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
    marginLeft: 4,
  },
  arrowWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
});
