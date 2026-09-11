const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const detailsContent = `
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchDnsQuestions,
  fetchSubjectPracticeProgress,
  updateSubjectPracticeProgress,
  fetchBookmarks,
  toggleBookmark,
} from '../../store/studySlice';

const DEFAULT_PROGRESS = {
  mcqSequence: 0,
  flashcardSequence: 0,
};

const CustomTabBar = ({ activeTab, onChange }) => {
  const tabsData = [
    { key: 'QUESTIONS', label: 'Questions', icon: 'book-open', color: '#7C4DFF' },
    { key: 'MCQ', label: 'MCQ', icon: 'list-ol', color: '#FF8F00' },
    { key: 'FLASHCARD', label: 'Flash Card', icon: 'layer-group', color: '#E91E63' },
  ];

  return (
    <View style={styles.customTabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customTabScroll}>
        {tabsData.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <View key={tab.key} style={styles.customTabWrapperWithDivider}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => onChange(tab.key)} style={styles.customTabTouchable}>
                <View style={[styles.customIconCircle, { backgroundColor: tab.color + '15' }]}>
                  <FontAwesome5 name={tab.icon} size={24} color={tab.color} />
                </View>
                <Text style={[styles.customTabLabel, isActive && { color: '#111827', fontWeight: '800' }]}>{tab.label}</Text>
                <View style={[styles.customActiveIndicator, { backgroundColor: isActive ? tab.color : 'transparent' }]} />
              </TouchableOpacity>
              {index < tabsData.length - 1 && <View style={styles.customTabDivider} />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const DnsSubjectDetailsScreen = ({ route, navigation, colors = { background: '#F8F9FE', surface: '#FFF', text: '#111827', textSecondary: '#6B7280', primary: '#1976D2' } }) => {
  const insets = useSafeAreaInsets();
  const { dnsSubject } = route.params || {};
  const subjectId = dnsSubject?.id;

  const dispatch = useDispatch();
  const { dnsQuestions, loadingDnsQuestions, subjectPracticeProgress, bookmarks } = useSelector((state) => state.study);

  const [activeTab, setActiveTab] = useState('QUESTIONS');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isOptionAnswered, setIsOptionAnswered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  
  const [practiceItems, setPracticeItems] = useState({
    mcqs: [],
    flashcards: [],
  });
  const [loadingPracticeItems, setLoadingPracticeItems] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  useEffect(() => {
    if (subjectId) {
      dispatch(fetchDnsQuestions(subjectId));
      dispatch(fetchSubjectPracticeProgress({ subjectId }));
    }
  }, [dispatch, subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    let isActive = true;

    const normalizeInterviewDoc = (doc) => {
      const rawData = doc.data();
      return { id: doc.id, ...rawData };
    };

    const loadPracticeItems = async () => {
      setLoadingPracticeItems(true);
      try {
        const [mcqSnap, flashSnap] = await Promise.all([
          firestore().collection('dns_interview').where('subjectId', '==', subjectId).get(),
          firestore().collection('dns_flashcard').where('subjectId', '==', subjectId).get(),
        ]);

        if (!isActive) return;

        setPracticeItems({
          mcqs: mcqSnap.docs.map(normalizeInterviewDoc).sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
          flashcards: flashSnap.docs.map(normalizeInterviewDoc).sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
        });
      } catch (error) {
        console.error('Error loading DNS practice collections:', error);
      } finally {
        if (isActive) setLoadingPracticeItems(false);
      }
    };

    loadPracticeItems();
    return () => { isActive = false; };
  }, [subjectId]);

  useEffect(() => {
    setSelectedOption(null);
    setIsOptionAnswered(false);
    setFlipped(false);
    flipAnim.setValue(0);
  }, [activeTab, flipAnim]);

  const progress = subjectPracticeProgress[subjectId] || DEFAULT_PROGRESS;

  const currentMcqs = useMemo(
    () => practiceItems.mcqs.filter((item) => Number(item.sequence || 0) > Number(progress.mcqSequence || 0)),
    [practiceItems.mcqs, progress.mcqSequence]
  );

  const currentFlashcards = useMemo(
    () => practiceItems.flashcards.filter((item) => Number(item.sequence || 0) > Number(progress.flashcardSequence || 0)),
    [practiceItems.flashcards, progress.flashcardSequence]
  );

  const currentItem = activeTab === 'MCQ' ? currentMcqs[0] : activeTab === 'FLASHCARD' ? currentFlashcards[0] : null;

  const getCorrectMcqOption = (option, index, item) => {
    if (!item) return false;
    if (option && item.answer && option.trim().toLowerCase() === item.answer.trim().toLowerCase()) return true;
    if (item.correctOptionNumber !== undefined && item.correctOptionNumber !== null && item.correctOptionNumber !== '') {
      const correctIndex = Number(item.correctOptionNumber);
      if (!Number.isNaN(correctIndex) && correctIndex >= 0 && index === correctIndex) return true;
    }
    return false;
  };

  const saveProgress = (updates) => {
    if (!subjectId) return;
    dispatch(updateSubjectPracticeProgress({ subjectId, ...updates }));
  };

  const handleMcqNext = () => {
    if (!currentItem) return;
    saveProgress({ mcqSequence: currentItem.sequence });
    setSelectedOption(null);
    setIsOptionAnswered(false);
  };

  const handleFlipCard = () => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped((prev) => !prev);
  };

  const handleFlashcardDone = () => {
    if (!currentItem) return;
    saveProgress({ flashcardSequence: currentItem.sequence });
    setFlipped(false);
    flipAnim.setValue(0);
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const renderEmptyState = (title, subtitle) => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="check-circle" size={56} color="#4CAF50" />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderQuestions = () => {
    const qList = dnsQuestions[subjectId] || [];
    if (loadingDnsQuestions && qList.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading questions...</Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={qList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isBookmarked = bookmarks.some((b) => b.questionId === item.id);
          return (
            <View style={[styles.questionCardList, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <View />
                <TouchableOpacity
                  onPress={() => dispatch(toggleBookmark({
                    questionItem: item,
                    questionType: 'dns',
                    sourceCollection: 'dnsQuestions',
                    topicId: subjectId,
                    isBookmarked
                  }))}
                  style={{ padding: 4 }}
                >
                  <FontAwesome5 name="bookmark" size={16} color={isBookmarked ? '#FF8F00' : colors.textSecondary + '50'} solid={isBookmarked} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('DnsAnswer', {
                    topicTitle: dnsSubject.name,
                    questionItem: item,
                    topicId: subjectId,
                    colors
                  })
                }
              >
                <Text style={[styles.questionTextList, { color: colors.text }]}>{item.question}</Text>
                {item.questionImage ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.questionImage }} style={styles.questionImage} resizeMode="contain" />
                  </View>
                ) : null}
                <View style={[styles.divider, { backgroundColor: colors.textSecondary + '15' }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.readButton, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700', marginRight: 8 }}>Read Answer</Text>
                    <FontAwesome5 name="arrow-right" size={10} color="#FFF" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <FontAwesome5 name="question-circle" size={48} color={colors.textSecondary + '50'} />
            <Text style={{ fontSize: 14, marginTop: 12, color: colors.textSecondary }}>No questions available.</Text>
          </View>
        )}
      />
    );
  };

  const renderMcq = () => {
    if (!currentItem) return renderEmptyState('MCQ section complete', 'You have cleared all MCQs for this subject.');
    return (
      <View>
        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.questionLabel, { color: colors.primary }]}>MCQ</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>{currentItem.question}</Text>
        </View>
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CHOOSE THE CORRECT OPTION</Text>
        {currentItem.options?.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrect = getCorrectMcqOption(option, index, currentItem);
          let buttonStyle = [styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }];
          let textStyle = [styles.optionText, { color: colors.text }];
          let iconName = null;
          let iconColor = null;

          if (isOptionAnswered) {
            if (isCorrect) {
              buttonStyle = [styles.optionBtn, styles.correctBtn, { borderColor: '#4CAF50' }];
              textStyle = [styles.optionText, styles.correctText];
              iconName = 'check-circle';
              iconColor = '#4CAF50';
            } else if (isSelected) {
              buttonStyle = [styles.optionBtn, styles.incorrectBtn, { borderColor: '#F44336' }];
              textStyle = [styles.optionText, styles.incorrectText];
              iconName = 'times-circle';
              iconColor = '#F44336';
            }
          }
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.75}
              onPress={() => {
                if (isOptionAnswered) return;
                setSelectedOption(option);
                setIsOptionAnswered(true);
              }}
              disabled={isOptionAnswered}
              style={buttonStyle}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.letterBadge, { backgroundColor: isOptionAnswered && (isCorrect || isSelected) ? '#4CAF50' : colors.primary + '10' }]}>
                  <Text style={[styles.letterText, { color: isOptionAnswered && (isCorrect || isSelected) ? '#FFF' : colors.primary }]}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={textStyle}>{option}</Text>
              </View>
              {iconName ? <FontAwesome5 name={iconName} size={16} color={iconColor} /> : null}
            </TouchableOpacity>
          );
        })}
        {isOptionAnswered ? (
          <TouchableOpacity activeOpacity={0.8} onPress={handleMcqNext} style={[styles.nextBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.nextBtnText}>Next Question</Text>
            <FontAwesome5 name="arrow-right" size={12} color="#FFF" style={styles.btnIcon} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderFlashcard = () => {
    if (!currentItem) return renderEmptyState('Flashcard section complete', 'You have cleared all flashcards for this subject.');
    return (
      <View style={styles.flashcardWrapper}>
        <Text style={[styles.flashcardTitleText, { color: colors.textSecondary }]}>TAP THE CARD TO FLIP</Text>
        <TouchableOpacity activeOpacity={0.95} onPress={handleFlipCard} style={styles.cardTouchTarget}>
          <Animated.View style={[styles.flipCard, styles.flipCardFront, frontAnimatedStyle, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
            <View style={styles.cardHeaderRow}>
              <FontAwesome5 name="question-circle" size={16} color={colors.primary} />
              <Text style={[styles.cardSideText, { color: colors.primary }]}>QUESTION</Text>
            </View>
            <Text style={[styles.cardPromptText, { color: colors.text }]}>{currentItem.front || currentItem.question}</Text>
            <View style={styles.flipLabelRow}>
              <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
              <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to see answer</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.flipCard, styles.flipCardBack, backAnimatedStyle, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
            <View style={styles.cardHeaderRow}>
              <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
              <Text style={[styles.cardSideText, { color: '#4CAF50' }]}>ANSWER</Text>
            </View>
            <Text style={[styles.cardPromptText, { color: colors.text }]}>{currentItem.back || currentItem.answer}</Text>
            <View style={styles.flipLabelRow}>
              <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
              <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to flip back</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
        {flipped ? (
          <View style={styles.flashcardSelfAssessment}>
            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Did you recall this correctly?</Text>
            <View style={styles.rateRow}>
              <TouchableOpacity onPress={handleFlipCard} style={[styles.rateBtn, { borderColor: '#F44336', backgroundColor: '#FFEBEE' }]}>
                <Text style={styles.reviewText}>Review Again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFlashcardDone} style={[styles.rateBtn, { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.completeText}>Mark Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}>
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>DNS</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{dnsSubject?.name}</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      <CustomTabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'QUESTIONS' ? (
        <View style={styles.scrollContentList}>{renderQuestions()}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingPracticeItems ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : activeTab === 'MCQ' ? renderMcq() : renderFlashcard()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customTabContainer: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 16, backgroundColor: '#FFF' },
  customTabScroll: { paddingHorizontal: 16, alignItems: 'center' },
  customTabWrapperWithDivider: { flexDirection: 'row', alignItems: 'center' },
  customTabTouchable: { alignItems: 'center', justifyContent: 'center', minWidth: 80, paddingHorizontal: 10 },
  customIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  customTabLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textAlign: 'center' },
  customActiveIndicator: { width: 20, height: 4, borderRadius: 2 },
  customTabDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1, marginHorizontal: 16 },
  subtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  placeholderButton: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 130 },
  scrollContentList: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, fontWeight: '500', marginTop: 12 },
  questionCardList: { padding: 20, marginBottom: 16, borderRadius: 16, elevation: 2, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  questionTextList: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 12 },
  imageContainer: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#F3F4F6' },
  questionImage: { width: '100%', height: '100%' },
  divider: { height: 1, width: '100%', marginVertical: 12 },
  readButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  questionCard: { borderRadius: 20, padding: 20, marginBottom: 24, elevation: 3, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  questionLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  questionText: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  sectionHeading: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.8, marginBottom: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, elevation: 1 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  letterBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  letterText: { fontSize: 13, fontWeight: 'bold' },
  optionText: { fontWeight: '500', flex: 1, lineHeight: 20 },
  correctBtn: { backgroundColor: '#E8F5E9' },
  correctText: { color: '#2E7D32', fontWeight: '600' },
  incorrectBtn: { backgroundColor: '#FFEBEE' },
  incorrectText: { color: '#C62828', fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnIcon: { marginLeft: 8 },
  flashcardWrapper: { alignItems: 'center', paddingVertical: 20 },
  flashcardTitleText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 24, opacity: 0.8 },
  cardTouchTarget: { width: '100%', perspective: 1000 },
  flipCard: { width: '100%', borderRadius: 24, padding: 28, backfaceVisibility: 'hidden', minHeight: 250 },
  flipCardFront: { position: 'absolute', top: 0 },
  flipCardBack: {},
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardSideText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginLeft: 8 },
  cardPromptText: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginVertical: 20 },
  flipLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  flipLabelText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  flashcardSelfAssessment: { width: '100%', marginTop: 36, alignItems: 'center' },
  rateLabel: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  rateRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  rateBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  reviewText: { fontWeight: '800', fontSize: 14, color: '#D32F2F' },
  completeText: { fontWeight: '800', fontSize: 14, color: '#2E7D32' },
});

export default DnsSubjectDetailsScreen;
`;

fs.writeFileSync(path.join(srcDir, 'DnsSubjectDetailsScreen.js'), detailsContent);
console.log('Created DnsSubjectDetailsScreen.js');

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('DnsSubjectsScreen')) {
  const imports = "import DnsSubjectsScreen from './study/DnsSubjectsScreen';\nimport DnsSubjectDetailsScreen from './study/DnsSubjectDetailsScreen';\nimport DnsAnswerScreen from './study/DnsAnswerScreen';\n";
  studyContent = studyContent.replace("import GpAnswerScreen from './study/GpAnswerScreen';", "import GpAnswerScreen from './study/GpAnswerScreen';\n" + imports);

  const screens = "      <Stack.Screen name=\"DnsSubjects\">\n        {(props) => <DnsSubjectsScreen {...props} colors={colors} />}\n      </Stack.Screen>\n      <Stack.Screen name=\"DnsSubjectDetails\">\n        {(props) => <DnsSubjectDetailsScreen {...props} colors={colors} />}\n      </Stack.Screen>\n      <Stack.Screen name=\"DnsAnswer\">\n        {(props) => <DnsAnswerScreen {...props} colors={colors} />}\n      </Stack.Screen>\n  ";
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
