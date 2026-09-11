
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearGpMockExamSession,
  fetchGpMcqQuestions,
  createGpMockExamSession,
} from '../../store/studySlice';

const GpMockExamResultScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { gpSubject } = route.params;
  const { gpMockExam } = useSelector((state) => state.study);

  const session = gpMockExam?.sessions?.[gpSubject.id];

  const [loading, setLoading] = useState(false);

  if (!session) {
    navigation.goBack();
    return null;
  }

  const totalQuestions = session.questions.length;

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  session.questions.forEach((question) => {
    const userAnswer = session.answers?.[question.id];

    if (userAnswer === undefined || userAnswer === null) {
      unanswered++;
    } else if (userAnswer === question.correctOptionNumber) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const percentage =
    totalQuestions > 0
      ? Math.round((correct / totalQuestions) * 100)
      : 0;

  const handleFinish = () => {
    dispatch(
      clearGpMockExamSession({
        subjectId: gpSubject.id,
      })
    );

    navigation.navigate('GpSubjectDetails', {
      gpSubject,
    });
  };

  const handleRestart = async () => {
    if (loading) return;

    setLoading(true);

    try {
      dispatch(
        clearGpMockExamSession({
          subjectId: gpSubject.id,
        })
      );

      const result = await dispatch(
        fetchGpMcqQuestions(gpSubject.id)
      );

      if (!fetchGpMcqQuestions.fulfilled.match(result)) {
        return;
      }

      const allQuestions = result.payload || [];

      const shuffledQuestions = [...allQuestions].sort(
        () => Math.random() - 0.5
      );

      const selectedQuestions = shuffledQuestions.slice(0, 30);

      if (selectedQuestions.length === 0) {
        return;
      }

      dispatch(
        createGpMockExamSession({
          subjectId: gpSubject.id,
          questions: selectedQuestions,
          durationSeconds: 1800,
        })
      );

      navigation.replace('GpMockExam', {
        gpSubject,
      });
    } catch (error) {
      console.error('Failed to restart GP mock exam:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 30,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <FontAwesome5
              name="medal"
              size={34}
              color="#F59E0B"
            />
          </View>

          <Text style={styles.mainTitle}>
            Mock Exam Complete
          </Text>

          <Text style={styles.subtitle}>
            {gpSubject.name}
          </Text>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>
            YOUR SCORE
          </Text>

          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercent}>
              {percentage}%
            </Text>

            <Text style={styles.scoreFraction}>
              {correct} / {totalQuestions}
            </Text>
          </View>

          <View style={styles.resultMessage}>
            <FontAwesome5
              name={
                percentage >= 70
                  ? 'check-circle'
                  : 'info-circle'
              }
              size={18}
              color={
                percentage >= 70
                  ? '#059669'
                  : '#1976D2'
              }
            />

            <Text style={styles.resultMessageText}>
              {percentage >= 70
                ? 'Great job! You passed this mock exam.'
                : 'Keep practicing and try the exam again.'}
            </Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View
                style={[
                  styles.statIcon,
                  styles.correctIcon,
                ]}
              >
                <FontAwesome5
                  name="check"
                  size={11}
                  color="#059669"
                />
              </View>

              <Text style={styles.statLabel}>
                Correct
              </Text>

              <Text
                style={[
                  styles.statValue,
                  styles.correctValue,
                ]}
              >
                {correct}
              </Text>
            </View>

            <View style={styles.statRow}>
              <View
                style={[
                  styles.statIcon,
                  styles.incorrectIcon,
                ]}
              >
                <FontAwesome5
                  name="times"
                  size={11}
                  color="#DC2626"
                />
              </View>

              <Text style={styles.statLabel}>
                Incorrect
              </Text>

              <Text
                style={[
                  styles.statValue,
                  styles.incorrectValue,
                ]}
              >
                {incorrect}
              </Text>
            </View>

            <View style={[styles.statRow, styles.lastStatRow]}>
              <View
                style={[
                  styles.statIcon,
                  styles.unansweredIcon,
                ]}
              >
                <FontAwesome5
                  name="minus"
                  size={11}
                  color="#6B7280"
                />
              </View>

              <Text style={styles.statLabel}>
                Unanswered
              </Text>

              <Text
                style={[
                  styles.statValue,
                  styles.unansweredValue,
                ]}
              >
                {unanswered}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>
            What would you like to do?
          </Text>

          <Text style={styles.actionsSubtitle}>
            You can leave this exam or start a fresh set
            of questions.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.restartButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRestart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <>
                <View style={styles.restartIcon}>
                  <FontAwesome5
                    name="redo-alt"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.restartButtonText}>
                  Restart Mock Exam
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.finishButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleFinish}
            disabled={loading}
          >
            <FontAwesome5
              name="arrow-left"
              size={14}
              color="#374151"
            />

            <Text style={styles.finishButtonText}>
              Finish & Leave
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>
          Restarting will create a new random set of questions.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },

  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'stretch',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 18,
    marginBottom: 28,
  },

  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  mainTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 7,
  },

  // Score
  scoreCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,
  },

  scoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },

  scoreCircle: {
    width: 145,
    height: 145,
    borderRadius: 73,

    borderWidth: 8,
    borderColor: '#1976D2',

    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',

    marginBottom: 20,
  },

  scorePercent: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },

  scoreFraction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },

  resultMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F8FAFC',
    borderRadius: 12,

    paddingHorizontal: 14,
    paddingVertical: 12,

    marginBottom: 22,
  },

  resultMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 9,
  },

  // Stats
  statsContainer: {
    width: '100%',
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 48,

    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  lastStatRow: {
    borderBottomWidth: 0,
  },

  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  correctIcon: {
    backgroundColor: '#ECFDF5',
  },

  incorrectIcon: {
    backgroundColor: '#FEF2F2',
  },

  unansweredIcon: {
    backgroundColor: '#F3F4F6',
  },

  statLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  correctValue: {
    color: '#059669',
  },

  incorrectValue: {
    color: '#DC2626',
  },

  unansweredValue: {
    color: '#6B7280',
  },

  // Actions
  actionsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,

    padding: 20,
    marginTop: 16,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  actionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 5,
  },

  actionsSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginBottom: 18,
  },

  restartButton: {
    width: '100%',
    height: 54,
    borderRadius: 15,

    backgroundColor: '#1976D2',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  restartIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,

    backgroundColor: 'rgba(255,255,255,0.16)',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 9,
  },

  restartButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  finishButton: {
    width: '100%',
    height: 52,
    borderRadius: 15,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  finishButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 9,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  footerHint: {
    fontSize: 11,
    lineHeight: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
});

export default GpMockExamResultScreen;
