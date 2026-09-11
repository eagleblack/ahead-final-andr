import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleBookmark,
  fetchBookmarks,
} from '../../store/studySlice';

const getIsCorrectMcqOption = (option, index, questionItem) => {
  if (!questionItem) return false;

  // 1. Check if option text matches answer field
  if (option && questionItem.answer && option.trim().toLowerCase() === questionItem.answer.trim().toLowerCase()) {
    return true;
  }

  // 2. Check if index matches correctOptionNumber
  if (questionItem.correctOptionNumber !== undefined && questionItem.correctOptionNumber !== null && questionItem.correctOptionNumber !== '') {
    const correctIdx = Number(questionItem.correctOptionNumber);
    if (!isNaN(correctIdx) && correctIdx >= 0 && index === correctIdx) {
      return true;
    }
  }

  return false;
};

const StudyInterviewScreen = ({ navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.user);
  const isProfessional = userData?.label && userData.label.trim().toLowerCase() === 'i am a';
  const { bookmarks } = useSelector((state) => state.study);

  // Department Selection States
  const [departments, setDepartments] = useState([]);
  const [matchedDepartments, setMatchedDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null); // { id, name, slug } or null for All
  const [departmentSelectionPhase, setDepartmentSelectionPhase] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Content Phase States
  const [activeTab, setActiveTab] = useState('MCQ'); // 'MCQ' | 'FIB' | 'FLASHCARD'
  const [loadingContent, setLoadingContent] = useState(false);

  // Progress States (Sequences)
  const [progress, setProgress] = useState({
    mcqSequence: 0,
    fillBlankSequence: 0,
    flashcardSequence: 0,
  });

  // Question Arrays
  const [mcqs, setMcqs] = useState([]);
  const [fibs, setFibs] = useState([]);
  const [flashcards, setFlashcards] = useState([]);

  // Active indices
  const [mcqIndex, setMcqIndex] = useState(0);
  const [fibIndex, setFibIndex] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);

  // MCQ Interactivity
  const [selectedOption, setSelectedOption] = useState(null);
  const [isOptionAnswered, setIsOptionAnswered] = useState(false);

  // FIB Interactivity
  const [fibInput, setFibInput] = useState('');
  const [fibChecked, setFibChecked] = useState(false);
  const [fibCorrect, setFibCorrect] = useState(false);

  // Flashcard Interactivity
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const normalizeFirestoreDoc = (doc) => {
    const rawData = doc.data();
    const normalized = {};

    Object.keys(rawData).forEach((key) => {
      normalized[key.trim()] = rawData[key];
    });

    return {
      id: doc.id,
      ...normalized,
    };
  };

  const loadInterviewItems = async (collectionName, deptId, currentSequence) => {
    const collectionRef = firestore().collection(collectionName);
    const queryRef = deptId !== null && deptId !== undefined
      ? collectionRef.where('departmentId', '==', deptId)
      : collectionRef;

    const snapshot = await queryRef.get();

    return snapshot.docs
      .map((doc) => {
        const qData = normalizeFirestoreDoc(doc);
        return {
          question: qData.question || "",
          options: qData.options || [],
          correctOptionNumber: qData.correctOptionNumber !== undefined ? qData.correctOptionNumber : null,
          answer: qData.answer || (qData.options && qData.correctOptionNumber !== undefined ? qData.options[qData.correctOptionNumber] : ""),
          front: qData.front || "",
          back: qData.back || "",
          sequence: qData.sequence !== undefined ? Number(qData.sequence) : 0,
          ...qData,
        };
      })
      .filter((item) => deptId !== null && deptId !== undefined
        ? item.departmentId === deptId
        : (!item.departmentId || item.departmentId === null || item.departmentId === undefined || item.departmentId === ''))
      .filter((item) => item.sequence > currentSequence)
      .sort((a, b) => a.sequence - b.sequence)
      .slice(0, 20);
  };

  // On Mount: Load Departments & User Match
  useEffect(() => {
    const initDepartments = async () => {
      try {
        setLoadingDepts(true);
        const snapshot = await firestore().collection('departments').get();
        const deptsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDepartments(deptsList);

        const isProf = userData?.label && userData.label.trim().toLowerCase() === 'i am a';
        if (isProf) {
          // Find user matched departments where jobOptions includes user.value
          const userVal = userData?.value;
          if (userVal) {
            const matches = deptsList.filter(
              (dept) =>
                dept.jobOptions &&
                dept.jobOptions.some(
                  (opt) => opt.trim().toLowerCase() === userVal.trim().toLowerCase()
                )
            );
            setMatchedDepartments(matches);
          } else {
            setMatchedDepartments([]);
          }
        } else {
          setMatchedDepartments([]);
        }
      } catch (err) {
        console.error('❌ Error loading departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };

    initDepartments();
    dispatch(fetchBookmarks());
  }, [userData, dispatch]);

  // Load content once department is selected
  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setDepartmentSelectionPhase(false);
    loadProgressAndQuestions(dept);
  };

  const loadProgressAndQuestions = async (dept) => {
    try {
      setLoadingContent(true);
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      // 1. Get Progress Document
      const progDoc = await firestore()
        .collection('interview_progress')
        .doc(userId)
        .get();

      let currentProgress = {
        mcqSequence: 0,
        fillBlankSequence: 0,
        flashcardSequence: 0,
      };

      if (progDoc.exists) {
        currentProgress = { ...currentProgress, ...progDoc.data() };
      }
      setProgress(currentProgress);

      const deptId = dept ? dept.id : null;

      const mcqSeqKey = deptId ? `mcqSequence_${deptId}` : 'mcqSequence';
      const fibSeqKey = deptId ? `fillBlankSequence_${deptId}` : 'fillBlankSequence';
      const flashSeqKey = deptId ? `flashcardSequence_${deptId}` : 'flashcardSequence';

      const currentMcqSeq = currentProgress[mcqSeqKey] || 0;
      const currentFibSeq = currentProgress[fibSeqKey] || 0;
      const currentFlashSeq = currentProgress[flashSeqKey] || 0;

      const [mcqList, fibList, flashList] = await Promise.all([
        loadInterviewItems('interview_mcqs', deptId, currentMcqSeq),
        loadInterviewItems('interview_fill_blanks', deptId, currentFibSeq),
        loadInterviewItems('interview_flashcards', deptId, currentFlashSeq),
      ]);

      setMcqs(mcqList);
      setMcqIndex(0);
      setFibs(fibList);
      setFibIndex(0);
      setFlashcards(flashList);
      setFlashcardIndex(0);
    } catch (err) {
      console.error('❌ Error loading progress/questions:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  // Reset tab-specific states when switching tabs
  useEffect(() => {
    setSelectedOption(null);
    setIsOptionAnswered(false);

    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);

    setFlipped(false);
    flipAnim.setValue(0);
  }, [activeTab, flipAnim]);

  // BOOKMARK HANDLER
  const handleToggleBookmark = (item, type, source) => {
    const isBookmarked = bookmarks.some((b) => b.questionId === item.id);
    dispatch(
      toggleBookmark({
        questionItem: item,
        questionType: type,
        sourceCollection: source,
        topicId: null,
        isBookmarked,
      })
    );
  };

  // MCQ ANSWERS
  const handleOptionPress = (option, questionItem) => {
    if (isOptionAnswered) return;
    setSelectedOption(option);
    setIsOptionAnswered(true);
  };

  const handleNextMcq = async () => {
    const questionItem = mcqs[mcqIndex];
    if (questionItem && selectedOption) {
      // Update progress in Firestore to this question's sequence regardless of correctness
      const userId = auth().currentUser?.uid;
      if (userId) {
        try {
          const deptId = selectedDepartment ? selectedDepartment.id : null;
          const mcqSeqKey = deptId ? `mcqSequence_${deptId}` : 'mcqSequence';

          await firestore()
            .collection('interview_progress')
            .doc(userId)
            .set({ [mcqSeqKey]: questionItem.sequence, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
          setProgress((prev) => ({ ...prev, [mcqSeqKey]: questionItem.sequence }));
        } catch (err) {
          console.error('❌ Error updating MCQ progress sequence:', err);
        }
      }
    }

    setSelectedOption(null);
    setIsOptionAnswered(false);
    
    // Remove completed MCQ and check indices
    if (mcqs.length > 0) {
      const nextMcqs = mcqs.filter((_, i) => i !== mcqIndex);
      setMcqs(nextMcqs);
      if (nextMcqs.length === 0) {
        // Refetch next batch
        loadProgressAndQuestions(selectedDepartment);
      }
    }
  };

  // FIB ANSWERS
  const handleVerifyFib = (questionItem) => {
    if (!fibInput.trim()) return;
    Keyboard.dismiss();

    const correctAns = questionItem.answer.trim().toLowerCase();
    const userAns = fibInput.trim().toLowerCase();

    const isCorrect = userAns === correctAns;
    setFibCorrect(isCorrect);
    setFibChecked(true);
  };

  const handleNextFib = async () => {
    const questionItem = fibs[fibIndex];
    if (questionItem) {
      // Update progress in Firestore to this question's sequence regardless of correctness
      const userId = auth().currentUser?.uid;
      if (userId) {
        try {
          const deptId = selectedDepartment ? selectedDepartment.id : null;
          const fibSeqKey = deptId ? `fillBlankSequence_${deptId}` : 'fillBlankSequence';

          await firestore()
            .collection('interview_progress')
            .doc(userId)
            .set({ [fibSeqKey]: questionItem.sequence, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
          setProgress((prev) => ({ ...prev, [fibSeqKey]: questionItem.sequence }));
        } catch (err) {
          console.error('❌ Error updating FIB progress sequence:', err);
        }
      }
    }

    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);

    if (fibs.length > 0) {
      const nextFibs = fibs.filter((_, i) => i !== fibIndex);
      setFibs(nextFibs);
      if (nextFibs.length === 0) {
        loadProgressAndQuestions(selectedDepartment);
      }
    }
  };

  // FLASHCARD ANSWERS
  const handleFlipCard = () => {
    if (flipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setFlipped(!flipped);
  };

  const handleCompleteFlashcard = async (questionItem) => {
    const userId = auth().currentUser?.uid;
    if (userId) {
      const deptId = selectedDepartment ? selectedDepartment.id : null;
      const flashSeqKey = deptId ? `flashcardSequence_${deptId}` : 'flashcardSequence';

      await firestore()
        .collection('interview_progress')
        .doc(userId)
        .set({ [flashSeqKey]: questionItem.sequence, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
      setProgress((prev) => ({ ...prev, [flashSeqKey]: questionItem.sequence }));
    }

    setFlipped(false);
    flipAnim.setValue(0);

    if (flashcards.length > 0) {
      const nextFlash = flashcards.filter((_, i) => i !== flashcardIndex);
      setFlashcards(nextFlash);
      if (nextFlash.length === 0) {
        loadProgressAndQuestions(selectedDepartment);
      }
    }
  };

  // Flashcard interpolate
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  // RENDERING FUNCTION - SELECTOR
  if (departmentSelectionPhase) {
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
            <Text style={[styles.mainTitle, { color: colors.text }]}>Interview Prep</Text>
          </View>
          <View style={styles.placeholderButton} />
        </View>

        {loadingDepts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing departments...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.introHeader}>
              <Text style={[styles.introTitle, { color: colors.text }]}>Department Selector</Text>
              <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
                To start simulating company interview question lists, select a department.
              </Text>
            </View>

            {/* User matched departments */}
            {matchedDepartments.length > 0 && (
              <View style={styles.matchContainer}>
                <Text style={[styles.sectionHeading, { color: colors.primary }]}>RECOMMENDED BASED ON YOUR RANK</Text>
                {matchedDepartments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectDepartment(dept)}
                    style={[styles.deptCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30', borderWidth: 1, marginBottom: 10 }]}
                  >
                    <View style={[styles.deptIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                      <FontAwesome5 name="star" size={18} color={colors.primary} solid />
                    </View>
                    <View style={styles.deptInfo}>
                      <Text style={[styles.deptName, { color: colors.text }]}>{dept.name}</Text>
                      <Text style={[styles.deptMeta, { color: colors.textSecondary }]}>
                        Job match for: {userData?.value}
                      </Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: matchedDepartments.length > 0 ? 20 : 0 }]}>
              ALL DEPARTMENTS
            </Text>

            {/* All Departments selection */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectDepartment(null)}
              style={[styles.deptCard, { backgroundColor: colors.surface, marginBottom: 12 }]}
            >
              <View style={[styles.deptIconWrapper, { backgroundColor: colors.textSecondary + '10' }]}>
                <FontAwesome5 name="globe" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.deptInfo}>
                <Text style={[styles.deptName, { color: colors.text }]}>All Departments</Text>
                <Text style={[styles.deptMeta, { color: colors.textSecondary }]}>
                  General questions asked across all hiring profiles
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Display all individual departments available in the database if user is a student */}
            {!isProfessional && departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                activeOpacity={0.8}
                onPress={() => handleSelectDepartment(dept)}
                style={[styles.deptCard, { backgroundColor: colors.surface, marginBottom: 12 }]}
              >
                <View style={[styles.deptIconWrapper, { backgroundColor: colors.primary + '10' }]}>
                  <FontAwesome5 name="briefcase" size={16} color={colors.primary} />
                </View>
                <View style={styles.deptInfo}>
                  <Text style={[styles.deptName, { color: colors.text }]}>{dept.name}</Text>
                  <Text style={[styles.deptMeta, { color: colors.textSecondary }]}>
                    Simulate {dept.name} interview questions
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // RENDERING FUNCTION - QUESTIONS PORTION
  const currentMcq = mcqs[mcqIndex];
  const currentFib = fibs[fibIndex];
  const currentFlashcard = flashcards[flashcardIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => setDepartmentSelectionPhase(true)}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            SIMULATOR • {selectedDepartment ? selectedDepartment.name : 'ALL DEPARTMENTS'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Active Interview Drill</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyBookmarks')}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="bookmark" size={14} color={colors.primary} solid />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.textSecondary + '10' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('MCQ')}
          style={[styles.tabItem, activeTab === 'MCQ' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="tasks" size={12} color={activeTab === 'MCQ' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'MCQ' ? colors.primary : colors.textSecondary }]}>MCQ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('FIB')}
          style={[styles.tabItem, activeTab === 'FIB' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="pen-nib" size={12} color={activeTab === 'FIB' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'FIB' ? colors.primary : colors.textSecondary }]}>Fill Blank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('FLASHCARD')}
          style={[styles.tabItem, activeTab === 'FLASHCARD' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="copy" size={12} color={activeTab === 'FLASHCARD' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'FLASHCARD' ? colors.primary : colors.textSecondary }]}>Flashcard</Text>
        </TouchableOpacity>
      </View>

      {loadingContent ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Retrieving progress questions...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}>
          
          {/* MCQ RENDERING */}
          {activeTab === 'MCQ' && (
            <View>
              {currentMcq ? (
                <View>
                  <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.questionLabel, { color: colors.primary }]}>
                       MCQ
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggleBookmark(currentMcq, 'mcq', 'interview_mcqs')}
                        style={styles.bookmarkIconBtn}
                      >
                        <FontAwesome5
                          name="bookmark"
                          size={14}
                          color={bookmarks.some((b) => b.questionId === currentMcq.id) ? '#FF8F00' : colors.textSecondary}
                          solid={bookmarks.some((b) => b.questionId === currentMcq.id)}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.questionText, { color: colors.text }]}>{currentMcq.question}</Text>
                  </View>

                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CHOOSE THE CORRECT OPTION</Text>
                  {currentMcq.options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = getIsCorrectMcqOption(option, index, currentMcq);
                    let btnStyle = [styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }];
                    let textStyle = [styles.optionText, { color: colors.text }];
                    let iconName = null;
                    let iconColor = null;

                    if (isOptionAnswered) {
                      if (isCorrect) {
                        btnStyle = [styles.optionBtn, styles.correctBtn, { borderColor: '#4CAF50' }];
                        textStyle = [styles.optionText, styles.correctText];
                        iconName = 'check-circle';
                        iconColor = '#4CAF50';
                      } else if (isSelected) {
                        btnStyle = [styles.optionBtn, styles.incorrectBtn, { borderColor: '#F44336' }];
                        textStyle = [styles.optionText, styles.incorrectText];
                        iconName = 'times-circle';
                        iconColor = '#F44336';
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => handleOptionPress(option, currentMcq)}
                        disabled={isOptionAnswered}
                        style={btnStyle}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[styles.letterBadge, { backgroundColor: isOptionAnswered && isCorrect ? '#4CAF50' : isOptionAnswered && isSelected ? '#F44336' : colors.primary + '10' }]}>
                            <Text style={[styles.letterText, { color: isOptionAnswered && (isCorrect || isSelected) ? '#FFF' : colors.primary }]}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </View>
                          <Text style={textStyle}>{option}</Text>
                        </View>
                        {iconName && <FontAwesome5 name={iconName} size={16} color={iconColor} />}
                      </TouchableOpacity>
                    );
                  })}

                  {isOptionAnswered && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleNextMcq}
                      style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.nextBtnText}>
                        {selectedOption === currentMcq.answer || (currentMcq.correctOptionNumber !== undefined && currentMcq.options.indexOf(selectedOption) === currentMcq.correctOptionNumber)
                          ? 'Next Question'
                          : 'Try Next Question'}
                      </Text>
                      <FontAwesome5 name="arrow-right" size={12} color="#FFF" style={styles.btnIcon} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.completionContainer}>
                  <FontAwesome5 name="trophy" size={56} color="#FFD700" />
                  <Text style={[styles.completionTitle, { color: colors.text }]}>MCQ Drill Complete!</Text>
                  <Text style={[styles.completionDesc, { color: colors.textSecondary }]}>
                    Amazing work. You have mastered all available MCQs for this department configuration.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* FIB RENDERING */}
          {activeTab === 'FIB' && (
            <View>
              {currentFib ? (
                <View>
                  <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.questionLabel, { color: colors.primary }]}>
                       FILL IN BLANK
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggleBookmark(currentFib, 'fillBlank', 'interview_fill_blanks')}
                        style={styles.bookmarkIconBtn}
                      >
                        <FontAwesome5
                          name="bookmark"
                          size={14}
                          color={bookmarks.some((b) => b.questionId === currentFib.id) ? '#FF8F00' : colors.textSecondary}
                          solid={bookmarks.some((b) => b.questionId === currentFib.id)}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.questionText, { color: colors.text }]}>{currentFib.question}</Text>
                  </View>

                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TYPE YOUR ANSWER</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}>
                    <TextInput
                      style={[styles.fibInput, { color: colors.text }]}
                      placeholder="Type correct term..."
                      placeholderTextColor={colors.textSecondary + '60'}
                      value={fibInput}
                      onChangeText={setFibInput}
                      editable={!fibChecked}
                      autoCapitalize="none"
                    />
                    {fibChecked && (
                      <FontAwesome5
                        name={fibCorrect ? 'check-circle' : 'times-circle'}
                        size={18}
                        color={fibCorrect ? '#4CAF50' : '#F44336'}
                      />
                    )}
                  </View>

                  {fibChecked ? (
                    <View style={[styles.fibAnswerBox, { backgroundColor: fibCorrect ? '#E8F5E9' : '#FFEBEE', borderColor: fibCorrect ? '#4CAF50' : '#F44336' }]}>
                      <Text style={[styles.fibAnswerTitle, { color: fibCorrect ? '#2E7D32' : '#C62828' }]}>
                        {fibCorrect ? '🎉 Correct Answer!' : '❌ Incorrect answer'}
                      </Text>
                      <Text style={[styles.fibAnswerText, { color: colors.text }]}>
                        Correct Term: <Text style={{ fontWeight: 'bold' }}>{currentFib.answer}</Text>
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleNextFib}
                        style={[styles.nextBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
                      >
                        <Text style={styles.nextBtnText}>Next Question</Text>
                        <FontAwesome5 name="arrow-right" size={12} color="#FFF" style={styles.btnIcon} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleVerifyFib(currentFib)}
                      disabled={!fibInput.trim()}
                      style={[styles.fibSubmitBtn, { backgroundColor: fibInput.trim() ? colors.primary : colors.textSecondary + '30' }]}
                    >
                      <Text style={styles.fibSubmitText}>Verify Answer</Text>
                      <FontAwesome5 name="check" size={12} color="#FFF" style={styles.btnIcon} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.completionContainer}>
                  <FontAwesome5 name="trophy" size={56} color="#FFD700" />
                  <Text style={[styles.completionTitle, { color: colors.text }]}>FIB Drill Complete!</Text>
                  <Text style={[styles.completionDesc, { color: colors.textSecondary }]}>
                    All fill-in-the-blank questions for this department have been completed!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* FLASHCARD RENDERING */}
          {activeTab === 'FLASHCARD' && (
            <View style={styles.flashcardWrapper}>
              {currentFlashcard ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.flashcardTitleText, { color: colors.textSecondary }]}>TAP THE CARD TO FLIP</Text>
                  
                  <TouchableOpacity activeOpacity={0.95} onPress={handleFlipCard} style={styles.cardTouchTarget}>
                    {/* Front Card */}
                    <Animated.View
                      style={[
                        styles.flipCard,
                        styles.flipCardFront,
                        frontAnimatedStyle,
                        { backgroundColor: colors.surface, shadowColor: '#000' },
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <FontAwesome5 name="question-circle" size={16} color={colors.primary} />
                        <Text style={[styles.cardSideText, { color: colors.primary }]}>QUESTION PROMPT</Text>
                        <TouchableOpacity
                          onPress={() => handleToggleBookmark(currentFlashcard, 'flashcard', 'interview_flashcards')}
                          style={{ marginLeft: 'auto', padding: 4 }}
                        >
                          <FontAwesome5
                            name="bookmark"
                            size={14}
                            color={bookmarks.some((b) => b.questionId === currentFlashcard.id) ? '#FF8F00' : colors.textSecondary}
                            solid={bookmarks.some((b) => b.questionId === currentFlashcard.id)}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardPromptText, { color: colors.text }]}>
                        {currentFlashcard.front}
                      </Text>
                      <View style={styles.flipLabelRow}>
                        <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
                        <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to see answer</Text>
                      </View>
                    </Animated.View>

                    {/* Back Card */}
                    <Animated.View
                      style={[
                        styles.flipCard,
                        styles.flipCardBack,
                        backAnimatedStyle,
                        { backgroundColor: colors.surface, shadowColor: '#000' },
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                        <Text style={[styles.cardSideText, { color: '#4CAF50' }]}>CORRECT SOLUTION</Text>
                        <TouchableOpacity
                          onPress={() => handleToggleBookmark(currentFlashcard, 'flashcard', 'interview_flashcards')}
                          style={{ marginLeft: 'auto', padding: 4 }}
                        >
                          <FontAwesome5
                            name="bookmark"
                            size={14}
                            color={bookmarks.some((b) => b.questionId === currentFlashcard.id) ? '#FF8F00' : colors.textSecondary}
                            solid={bookmarks.some((b) => b.questionId === currentFlashcard.id)}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardPromptText, { color: colors.text }]}>
                        {currentFlashcard.back}
                      </Text>
                      <View style={styles.flipLabelRow}>
                        <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
                        <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to flip back</Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>

                  {flipped && (
                    <View style={styles.flashcardSelfAssessment}>
                      <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Did you recall this correctly?</Text>
                      <View style={styles.rateRow}>
                        <TouchableOpacity onPress={handleFlipCard} style={[styles.rateBtn, { borderColor: '#F44336', backgroundColor: '#FFEBEE' }]}>
                          <Text style={{ color: '#C62828', fontWeight: 'bold', fontSize: 13 }}>Review Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCompleteFlashcard(currentFlashcard)} style={[styles.rateBtn, { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' }]}>
                          <Text style={{ color: '#2E7D32', fontWeight: 'bold', fontSize: 13 }}>Mark Completed 👍</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.completionContainer}>
                  <FontAwesome5 name="trophy" size={56} color="#FFD700" />
                  <Text style={[styles.completionTitle, { color: colors.text }]}>Flashcard Drill Complete!</Text>
                  <Text style={[styles.completionDesc, { color: colors.textSecondary }]}>
                    All flashcard prompts for this department have been completed!
                  </Text>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
};

export default StudyInterviewScreen;

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
  iconButton: {
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
  subtitle: {
    fontSize: 9,
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
    paddingTop: 10,
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
  matchContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  deptCard: {
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
  deptIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deptInfo: {
    flex: 1,
    paddingRight: 8,
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  deptMeta: {
    fontSize: 12,
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
  questionCard: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    elevation: 3,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bookmarkIconBtn: {
    padding: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  letterText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  optionText: {
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  correctBtn: {
    backgroundColor: '#E8F5E9',
  },
  correctText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  incorrectBtn: {
    backgroundColor: '#FFEBEE',
  },
  incorrectText: {
    color: '#C62828',
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnIcon: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  fibInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  fibSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  fibSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fibAnswerBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  fibAnswerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  fibAnswerText: {
    fontSize: 14,
  },
  flashcardWrapper: {
    alignItems: 'center',
    width: '100%',
    marginTop:60,

  },
  flashcardTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardTouchTarget: {
    width: '100%',
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCard: {
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    elevation: 4,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  flipCardFront: {
    position: 'absolute',
    top: 0,
  },
  flipCardBack: {
    position: 'absolute',
    top: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSideText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 8,
  },
  cardPromptText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: 12,
  },
  flipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  flipLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  flashcardSelfAssessment: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  rateBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  completionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  completionDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
