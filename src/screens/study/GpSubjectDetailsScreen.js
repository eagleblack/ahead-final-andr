import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGpMcqQuestions, createGpMockExamSession } from '../../store/studySlice';

const GpSubjectDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { gpSubject } = route.params;
  const { gpMockExam } = useSelector((state) => state.study);
  
  const activeSession = gpMockExam?.sessions?.[gpSubject.id];
  const [loading, setLoading] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkQuestions = async () => {
      if (activeSession) {
        setChecking(false);
        return;
      }
      const result = await dispatch(fetchGpMcqQuestions(gpSubject.id));
      if (fetchGpMcqQuestions.fulfilled.match(result)) {
        if (result.payload.length === 0) {
          setIsComingSoon(true);
        }
      }
      setChecking(false);
    };
    checkQuestions();
  }, [dispatch, gpSubject.id, activeSession]);

  const startMockExam = async () => {
    if (activeSession) {
      navigation.navigate('GpMockExam', { gpSubject });
      return;
    }

    setLoading(true);
    const result = await dispatch(fetchGpMcqQuestions(gpSubject.id));
    if (fetchGpMcqQuestions.fulfilled.match(result)) {
      const allQuestions = result.payload;
      
      if (allQuestions.length === 0) {
        setIsComingSoon(true);
        setLoading(false);
        return;
      }

      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 30);
      
      dispatch(createGpMockExamSession({
        subjectId: gpSubject.id,
        questions: selectedQuestions,
        durationSeconds: 1800
      }));
      
      navigation.navigate('GpMockExam', { gpSubject });
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={14} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={2}>{gpSubject.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeading}>PRACTICE</Text>
        <View style={[styles.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              <FontAwesome5 name="dumbbell" size={16} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Practice Questions</Text>
              <Text style={styles.cardDesc}>Improve your knowledge</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#9333EA' }]} 
            onPress={() => navigation.navigate('GpPractice', { gpSubject })}
          >
            <Text style={styles.btnText}>Start Practice</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>EXAM SIMULATOR</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
              <FontAwesome5 name="stopwatch" size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Mock Exam</Text>
              <Text style={styles.cardDesc}>30 Questions • 30 Minutes</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.btn, 
              { backgroundColor: isComingSoon ? '#9CA3AF' : (activeSession ? '#F59E0B' : '#0284C7') }
            ]} 
            onPress={startMockExam}
            disabled={loading || checking || isComingSoon}
          >
            {(loading || checking) ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.btnText}>
                {isComingSoon ? 'Coming Soon' : (activeSession ? 'Resume Exam' : 'Start Mock Exam')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  headerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeading: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#6B7280', marginBottom: 12 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  btn: { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

export default GpSubjectDetailsScreen;
