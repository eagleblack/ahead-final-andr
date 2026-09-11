import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTopicQuestionCountsBatch,
  fetchSubjectPracticeProgress,
  updateSubjectPracticeProgress,
} from '../../store/studySlice';
import StudyCollectionCard from './components/StudyCollectionCard';

const DEFAULT_PROGRESS = {
  mcqSequence: 0,
  fillBlankSequence: 0,
  flashcardSequence: 0,
};

const CustomTabBar = ({ activeTab, onChange }) => {
  const tabsData = [
    { key: 'TOPICS', label: 'Topic', icon: 'book-open', color: '#7C4DFF' },
    { key: 'MCQ', label: 'MCQ', icon: 'list-ol', color: '#FF8F00' },
    { key: 'FLASHCARD', label: 'Flash Card', icon: 'layer-group', color: '#E91E63' },
    { key: 'FIB', label: 'Fill in the blanks', icon: 'check-square', color: '#4CAF50' },
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


const PremiumFlashcard = ({ currentItem, colors, flipped, handleFlipCard, handleFlashcardDone, frontAnimatedStyle, backAnimatedStyle, renderEmptyState }) => {
  const [maxHeight, setMaxHeight] = useState(360);

  if (!currentItem) {
    return renderEmptyState('Flashcard section complete', 'You have already cleared the written flashcards for this subject.');
  }

  const handleLayout = (e) => {
    const h = e.nativeEvent.layout.height;
    if (h > maxHeight) setMaxHeight(h);
  };

  const frontContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
          <FontAwesome5 name="question" size={14} color={colors.primary} />
        </View>
        <Text style={[styles.cardSideText, { color: colors.primary }]}>QUESTION PROMPT</Text>
      </View>
      <View style={styles.promptContainer}>
        <Text style={[styles.cardPromptText, { color: colors.text }]}>{currentItem.front || currentItem.question}</Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color={colors.primary} />
        <Text style={[styles.flipLabelText, { color: colors.primary }]}>Tap to reveal answer</Text>
      </View>
      <Text style={[styles.watermarkText, { color: colors.primary }]}>Q</Text>
    </View>
  );

  const backContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconBadge, { backgroundColor: '#4CAF5015' }]}>
          <FontAwesome5 name="lightbulb" size={14} color="#4CAF50" solid />
        </View>
        <Text style={[styles.cardSideText, { color: '#4CAF50' }]}>CORRECT SOLUTION</Text>
      </View>
      <View style={styles.promptContainer}>
        <Text style={[styles.cardPromptText, { color: colors.text }]}>{currentItem.back || currentItem.answer}</Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color="#4CAF50" />
        <Text style={[styles.flipLabelText, { color: '#4CAF50' }]}>Tap to flip back</Text>
      </View>
      <Text style={[styles.watermarkText, { color: '#4CAF50' }]}>A</Text>
    </View>
  );

  return (
    <View style={styles.flashcardWrapper}>
      <Text style={[styles.flashcardTitleText, { color: colors.textSecondary }]}>TAP THE CARD TO FLIP</Text>

      <View style={{ opacity: 0, position: 'absolute', width: '100%', top: 50, zIndex: -1, pointerEvents: 'none' }}>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{frontContent}</View>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{backContent}</View>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={handleFlipCard} style={[styles.cardTouchTarget, { height: maxHeight }]}>
        <Animated.View
          style={[
            styles.flipCard,
            frontAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: colors.primary },
            styles.premiumShadow
          ]}
        >
          {frontContent}
        </Animated.View>

        <Animated.View
          style={[
            styles.flipCard,
            backAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: '#4CAF50' },
            styles.premiumShadow
          ]}
        >
          {backContent}
        </Animated.View>
      </TouchableOpacity>

      {flipped ? (
        <View style={styles.flashcardSelfAssessment}>
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Did you recall this correctly?</Text>
          <View style={styles.rateRow}>
            <TouchableOpacity onPress={handleFlipCard} style={[styles.rateBtn, { backgroundColor: '#FFF2F2', borderColor: '#FFCDD2' }]}>
              <FontAwesome5 name="times" size={14} color="#D32F2F" style={{ marginRight: 8 }} />
              <Text style={[styles.reviewText, { color: '#D32F2F' }]}>Review Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFlashcardDone} style={[styles.rateBtn, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
              <FontAwesome5 name="check" size={14} color="#2E7D32" style={{ marginRight: 8 }} />
              <Text style={[styles.completeText, { color: '#2E7D32' }]}>Mark Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const StudyTopicsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { mode, community, level, examType, classType, subjectId, subjectTitle } = route.params || {};

  const dispatch = useDispatch();
  const { topics, questionCounts, loadingQuestions, subjectPracticeProgress } = useSelector((state) => state.study);

  const [activeTab, setActiveTab] = useState('TOPICS');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isOptionAnswered, setIsOptionAnswered] = useState(false);
  const [fibInput, setFibInput] = useState('');
  const [fibChecked, setFibChecked] = useState(false);
  const [fibCorrect, setFibCorrect] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [hasRequestedData, setHasRequestedData] = useState(false);
  
  const [practiceItems, setPracticeItems] = useState({
    mcqs: [],
    fibs: [],
    flashcards: [],
  });
  const [loadingPracticeItems, setLoadingPracticeItems] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const subjectTopics = topics.filter((topic) => topic.subjectId === subjectId);

  useEffect(() => {
    const missingTopicIds = subjectTopics
      .filter((topic) => !questionCounts[topic.id])
      .map((topic) => topic.id);

    if (missingTopicIds.length > 0) {
      dispatch(fetchTopicQuestionCountsBatch(missingTopicIds));
    }
  }, [dispatch, subjectTopics, questionCounts]);

  useEffect(() => {
    if (subjectId) {
      setHasRequestedData(true);
      dispatch(fetchSubjectPracticeProgress({ subjectId }));
    }
  }, [dispatch, subjectId]);

  useEffect(() => {
    if (!subjectId) return undefined;

    let isActive = true;

    const normalizeInterviewDoc = (doc) => {
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

    const loadPracticeItems = async () => {
      setLoadingPracticeItems(true);

      try {
        const [mcqSnap, fibSnap, flashSnap] = await Promise.all([
          firestore().collection('interview_mcqs').get(),
          firestore().collection('interview_fill_blanks').get(),
          firestore().collection('interview_flashcards').get(),
        ]);

        if (!isActive) return;

        const matchesWrittenScope = (item) => {
          const itemTopicId = item.topicId ?? item.topicID ?? item.topic_id ?? null;
          const itemSubjectId = item.subjectId ?? item.subjectID ?? item.subject_id ?? null;

          return itemSubjectId === subjectId || itemTopicId === subjectId;
        };

        setPracticeItems({
          mcqs: mcqSnap.docs
            .map(normalizeInterviewDoc)
            .filter(matchesWrittenScope)
            .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
          fibs: fibSnap.docs
            .map(normalizeInterviewDoc)
            .filter(matchesWrittenScope)
            .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
          flashcards: flashSnap.docs
            .map(normalizeInterviewDoc)
            .filter(matchesWrittenScope)
            .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
        });
      } catch (error) {
        console.error('Error loading topic practice collections:', error);
        if (isActive) {
          setPracticeItems({ mcqs: [], fibs: [], flashcards: [] });
        }
      } finally {
        if (isActive) {
          setLoadingPracticeItems(false);
        }
      }
    };

    loadPracticeItems();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  useEffect(() => {
    setSelectedOption(null);
    setIsOptionAnswered(false);
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);
    setFlipped(false);
    flipAnim.setValue(0);
  }, [activeTab, flipAnim]);

  const progress = subjectPracticeProgress[subjectId] || DEFAULT_PROGRESS;

  const currentMcqs = useMemo(
    () =>
      practiceItems.mcqs
        .filter((item) => Number(item.sequence || 0) > Number(progress.mcqSequence || 0))
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [practiceItems.mcqs, progress.mcqSequence]
  );

  const currentFibs = useMemo(
    () =>
      practiceItems.fibs
        .filter((item) => Number(item.sequence || 0) > Number(progress.fillBlankSequence || 0))
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [practiceItems.fibs, progress.fillBlankSequence]
  );

  const currentFlashcards = useMemo(
    () =>
      practiceItems.flashcards
        .filter((item) => Number(item.sequence || 0) > Number(progress.flashcardSequence || 0))
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [practiceItems.flashcards, progress.flashcardSequence]
  );

  const currentItem =
    activeTab === 'MCQ' ? currentMcqs[0] : activeTab === 'FIB' ? currentFibs[0] : currentFlashcards[0];

  const getCorrectMcqOption = (option, index, item) => {
    if (!item) return false;

    if (option && item.answer && option.trim().toLowerCase() === item.answer.trim().toLowerCase()) {
      return true;
    }

    if (item.correctOptionNumber !== undefined && item.correctOptionNumber !== null && item.correctOptionNumber !== '') {
      const correctIndex = Number(item.correctOptionNumber);
      if (!Number.isNaN(correctIndex) && correctIndex >= 0 && index === correctIndex) {
        return true;
      }
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

  const handleFibVerify = () => {
    if (!currentItem || !fibInput.trim()) return;
    Keyboard.dismiss();

    const answer = (currentItem.answer || '').trim().toLowerCase();
    const guess = fibInput.trim().toLowerCase();
    setFibCorrect(guess === answer);
    setFibChecked(true);
  };

  const handleFibNext = () => {
    if (!currentItem) return;
    saveProgress({ fillBlankSequence: currentItem.sequence });
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);
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

  const renderEmptyState = (title, subtitle) => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="check-circle" size={56} color="#4CAF50" />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderTopics = () => {
    if (loadingQuestions && subjectTopics.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading topics...</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.introHeader}>
          <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
            Choose a topic to open syllabus questions.
          </Text>
        </View>

        {subjectTopics.length > 0 ? (
          subjectTopics.map((topic, index) => {
            const topicTitle = topic.name || topic.title || '';
            const counts = questionCounts[topic.id] || { cocCount: 0, oralCount: 0 };

            return (
              <StudyCollectionCard
                key={topic.id}
                title={topicTitle}
                subtitle={`${counts.cocCount} Question & Answers`}
                icon="book"
                colors={colors}
                badgeLabel={String(index + 1).padStart(2, '0')}
                badgeColor={colors.primary}
                trailingIcon="arrow-right"
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
                    topicTitle,
                    isOral: false,
                  })
                }
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="folder-open" size={48} color={colors.textSecondary + '50'} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No written topics available for this subject.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMcq = () => {
    if (!currentItem) {
      return renderEmptyState('MCQ section complete', 'You have already cleared the written MCQs for this subject.');
    }

    return (
      <View>
        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.questionLabel, { color: colors.primary }]}>WRITTEN MCQ</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>{currentItem.question}</Text>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CHOOSE THE CORRECT OPTION</Text>
        {currentItem.options.map((option, index) => {
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
                <View
                  style={[
                    styles.letterBadge,
                    { backgroundColor: isOptionAnswered && (isCorrect || isSelected) ? '#4CAF50' : colors.primary + '10' },
                  ]}
                >
                  <Text style={[styles.letterText, { color: isOptionAnswered && (isCorrect || isSelected) ? '#FFF' : colors.primary }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
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

  const renderFib = () => {
    if (!currentItem) {
      return renderEmptyState('Fill in the blank complete', 'You have already cleared the written fill-in-the-blank questions for this subject.');
    }
   
    return (
      <View>
        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.questionLabel, { color: colors.primary }]}>FILL IN THE BLANK</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>{currentItem.question}</Text>
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
          {fibChecked ? (
            <FontAwesome5 name={fibCorrect ? 'check-circle' : 'times-circle'} size={18} color={fibCorrect ? '#4CAF50' : '#F44336'} />
          ) : null}
        </View>

        {fibChecked ? (
          <View style={[styles.fibAnswerBox, { backgroundColor: fibCorrect ? '#E8F5E9' : '#FFEBEE', borderColor: fibCorrect ? '#4CAF50' : '#F44336' }]}>
            <Text style={[styles.fibAnswerTitle, { color: fibCorrect ? '#2E7D32' : '#C62828' }]}>
              {fibCorrect ? 'Correct answer!' : 'Incorrect answer'}
            </Text>
            <Text style={[styles.fibAnswerText, { color: colors.text }]}>
              Correct Term: <Text style={styles.boldText}>{currentItem.answer}</Text>
            </Text>
            <TouchableOpacity activeOpacity={0.8} onPress={handleFibNext} style={[styles.nextBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
              <Text style={styles.nextBtnText}>Next Question</Text>
              <FontAwesome5 name="arrow-right" size={12} color="#FFF" style={styles.btnIcon} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleFibVerify}
            disabled={!fibInput.trim()}
            style={[styles.fibSubmitBtn, { backgroundColor: fibInput.trim() ? colors.primary : colors.textSecondary + '30' }]}
          >
            <Text style={styles.fibSubmitText}>Verify Answer</Text>
            <FontAwesome5 name="check" size={12} color="#FFF" style={styles.btnIcon} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFlashcard = () => {
    if (!currentItem) {
      return renderEmptyState('Flashcard section complete', 'You have already cleared the written flashcards for this subject.');
    }

    return (
      <View style={styles.flashcardWrapper}>
        <Text style={[styles.flashcardTitleText, { color: colors.textSecondary }]}>TAP THE CARD TO FLIP</Text>

        <TouchableOpacity activeOpacity={0.95} onPress={handleFlipCard} style={styles.cardTouchTarget}>
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
            </View>
            <Text style={[styles.cardPromptText, { color: colors.text }]}>{currentItem.front || currentItem.question}</Text>
            <View style={styles.flipLabelRow}>
              <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
              <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to see answer</Text>
            </View>
          </Animated.View>

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

  const isLoading = !hasRequestedData || loadingPracticeItems;
  const hasLoadError = hasRequestedData && !loadingPracticeItems && practiceItems.mcqs.length === 0 && practiceItems.fibs.length === 0 && practiceItems.flashcards.length === 0 && activeTab !== 'TOPICS'; // Just an approximation

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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{examType} • {classType}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {subjectTitle}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      <CustomTabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab !== 'TOPICS' && isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading practice items...</Text>
        </View>
      ) : activeTab !== 'TOPICS' && hasLoadError && false ? (
        <View style={styles.loadingContainer}>
          <FontAwesome5 name="exclamation-triangle" size={42} color="#F59E0B" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load practice items</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Please try again in a moment.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'TOPICS'
            ? renderTopics()
            : activeTab === 'MCQ'
            ? renderMcq()
            : activeTab === 'FIB'
            ? renderFib()
            : renderFlashcard()}
        </ScrollView>
      )}
    </View>
  );
};

export default StudyTopicsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  customTabContainer: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 16, backgroundColor: '#FFF' },
  customTabScroll: { paddingHorizontal: 16, alignItems: 'center' },
  customTabWrapperWithDivider: { flexDirection: 'row', alignItems: 'center' },
  customTabTouchable: { alignItems: 'center', justifyContent: 'center', minWidth: 70, paddingHorizontal: 10 },
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
  introHeader: { marginVertical: 20 },
  introTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  introDesc: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, fontWeight: '500', marginTop: 12 },
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  fibInput: { flex: 1, fontSize: 15, fontWeight: '600', height: '100%', padding: 0 },
  fibSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  fibSubmitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  fibAnswerBox: { borderRadius: 14, padding: 16, borderWidth: 1 },
  fibAnswerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  fibAnswerText: { fontSize: 14, lineHeight: 22 },
  boldText: { fontWeight: 'bold' },
  flashcardWrapper: { alignItems: 'center', paddingVertical: 20 },
  flashcardTitleText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 24, opacity: 0.8 },
  cardTouchTarget: { width: '100%', perspective: 1000 },
  flipCardMeasure: { width: '100%', padding: 28 },
  cardContentLayout: { flex: 1, justifyContent: 'space-between' },
  flipCard: { width: '100%', height: '100%', borderRadius: 24, borderTopWidth: 6, padding: 28, position: 'absolute', backfaceVisibility: 'hidden', overflow: 'hidden' },
  premiumShadow: { elevation: 6, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, zIndex: 2 },
  iconBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardSideText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  promptContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20, zIndex: 2 },
  cardPromptText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  flipLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, zIndex: 2 },
  flipLabelText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  watermarkText: { position: 'absolute', fontSize: 160, fontWeight: '900', opacity: 0.04, right: -20, bottom: -20, zIndex: 1 },
  flashcardSelfAssessment: { width: '100%', marginTop: 36, alignItems: 'center' },
  rateLabel: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  rateRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  rateBtn: { flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  reviewText: { fontWeight: '800', fontSize: 14 },
  completeText: { fontWeight: '800', fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
});
