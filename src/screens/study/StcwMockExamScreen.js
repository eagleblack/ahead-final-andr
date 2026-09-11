import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { updateStcwMockExamAnswer, updateStcwMockExamIndex } from '../../store/studySlice';

const StcwMockExamScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { stcwSubject } = route.params;
  const { stcwMockExam } = useSelector((state) => state.study);
  const session = stcwMockExam?.sessions?.[stcwSubject.id];

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session) {
      navigation.goBack();
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleSubmit(); // Auto submit
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session, navigation]);

  if (!session) return null;

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const selectedAnswer = session.answers[currentQuestion?.id];
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;
  const isFirstQuestion = session.currentQuestionIndex === 0;

  const handleOptionSelect = (index) => {
    dispatch(updateStcwMockExamAnswer({
      subjectId: stcwSubject.id,
      questionId: currentQuestion.id,
      selectedOptionNumber: index
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      dispatch(updateStcwMockExamIndex({
        subjectId: stcwSubject.id,
        index: session.currentQuestionIndex + 1
      }));
    }
  };

  const handlePrev = () => {
    if (!isFirstQuestion) {
      dispatch(updateStcwMockExamIndex({
        subjectId: stcwSubject.id,
        index: session.currentQuestionIndex - 1
      }));
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      "Submit Exam",
      "Are you sure you want to submit your exam?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: () => {
            navigation.replace('StcwMockExamResult', { stcwSubject });
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <FontAwesome5 name="times" size={16} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerProgress}>Question {session.currentQuestionIndex + 1} of {session.questions.length}</Text>
        <View style={styles.timerBadge}>
          <FontAwesome5 name="clock" size={12} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionText}>{currentQuestion?.question}</Text>
        
        {currentQuestion?.questionImage ? (
          <Image 
            source={{ uri: currentQuestion.questionImage }} 
            style={styles.questionImage} 
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.optionsContainer}>
          {currentQuestion?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleOptionSelect(index)}
              style={[
                styles.optionCard,
                selectedAnswer === index && styles.optionCardSelected
              ]}
            >
              <View style={[styles.radio, selectedAnswer === index && styles.radioSelected]}>
                {selectedAnswer === index && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.optionText, selectedAnswer === index && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.footerBtn, styles.footerBtnOutline, isFirstQuestion && { opacity: 0.5 }]} 
            onPress={handlePrev}
            disabled={isFirstQuestion}
          >
            <Text style={styles.footerBtnOutlineText}>Previous</Text>
          </TouchableOpacity>

          {isLastQuestion ? (
            <TouchableOpacity style={[styles.footerBtn, styles.footerBtnSubmit]} onPress={handleSubmit}>
              <Text style={styles.footerBtnText}>Submit Exam</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.footerBtn, styles.footerBtnPrimary]} onPress={handleNext}>
              <Text style={styles.footerBtnText}>Next Question</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  headerProgress: { fontSize: 15, fontWeight: '700', color: '#111827' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  timerText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  content: { flex: 1, paddingHorizontal: 20 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 28, marginBottom: 20 },
  questionImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20, backgroundColor: '#E5E7EB' },
  optionsContainer: { paddingBottom: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  optionCardSelected: { borderColor: '#1976D2', backgroundColor: '#EFF6FF' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9CA3AF', marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#1976D2' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1976D2' },
  optionText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500', lineHeight: 22 },
  optionTextSelected: { color: '#1976D2', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, marginTop: 10, paddingBottom: 40 },
  footerBtn: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  footerBtnOutline: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF' },
  footerBtnOutlineText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  footerBtnPrimary: { backgroundColor: '#1976D2' },
  footerBtnSubmit: { backgroundColor: '#059669' },
  footerBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' }
});

export default StcwMockExamScreen;
