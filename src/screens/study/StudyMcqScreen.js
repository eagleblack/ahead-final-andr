import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Animated, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const StudyMcqScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const { examType, classType, topicTitle, questionItem } = route.params || {};

  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' | 'fib' | 'flashcard'

  // MCQ State
  const [selectedOption, setSelectedOption] = useState(null);
  const [isOptionAnswered, setIsOptionAnswered] = useState(false);

  // Fill in the Blank State
  const [fibInput, setFibInput] = useState('');
  const [fibChecked, setFibChecked] = useState(false);
  const [fibCorrect, setFibCorrect] = useState(false);

  // Flashcard State (3D Rotation Animation)
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Reset states when changing tabs
  useEffect(() => {
    // Reset MCQ
    setSelectedOption(null);
    setIsOptionAnswered(false);
    // Reset FIB
    setFibInput('');
    setFibChecked(false);
    setFibCorrect(false);
    // Reset Flashcard
    setFlipped(false);
    flipAnim.setValue(0);
  }, [activeTab]);

  const handleOptionPress = (option) => {
    if (isOptionAnswered) return;
    setSelectedOption(option);
    setIsOptionAnswered(true);
  };

  const handleCheckFib = () => {
    if (!fibInput.trim()) return;
    Keyboard.dismiss();
    const correctAns = questionItem.fibAnswer.trim().toLowerCase();
    const userAns = fibInput.trim().toLowerCase();
    
    setFibCorrect(userAns === correctAns);
    setFibChecked(true);
  };

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

  // 3D Rotations Interpolation
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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {examType} • {classType}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {topicTitle}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Segmented Tab Controls */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '10' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('mcq')}
          style={[styles.tabItem, activeTab === 'mcq' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="tasks" size={12} color={activeTab === 'mcq' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'mcq' ? colors.primary : colors.textSecondary }]}>MCQ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('fib')}
          style={[styles.tabItem, activeTab === 'fib' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="pen-nib" size={12} color={activeTab === 'fib' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'fib' ? colors.primary : colors.textSecondary }]}>Fill Blank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('flashcard')}
          style={[styles.tabItem, activeTab === 'flashcard' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
        >
          <FontAwesome5 name="copy" size={12} color={activeTab === 'flashcard' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'flashcard' ? colors.primary : colors.textSecondary }]}>Flashcard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}>
        
        {/* MCQ Tab Rendering */}
        {activeTab === 'mcq' && (
          <View>
            {/* Question Card */}
            <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.questionLabel, { color: colors.primary }]}>INTERVIEW QUESTION</Text>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {questionItem.question}
              </Text>
            </View>

            {/* Options list */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CHOOSE THE CORRECT OPTION</Text>
            {questionItem.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === questionItem.answer;
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
                  onPress={() => handleOptionPress(option)}
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
          </View>
        )}

        {/* Fill in the Blank Tab Rendering */}
        {activeTab === 'fib' && (
          <View>
            {/* Instruction Banner */}
            <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.questionLabel, { color: colors.primary }]}>FILL IN THE BLANK</Text>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {questionItem.fibQuestion || "No FIB question formulated for this item."}
              </Text>
            </View>

            {/* Input Form */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TYPE YOUR ANSWER</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}>
              <TextInput
                style={[styles.fibInput, { color: colors.text }]}
                placeholder="e.g. valve, 30, deflection"
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
                  style={styles.fibFeedbackIcon}
                />
              )}
            </View>

            {fibChecked ? (
              <View style={[styles.fibAnswerBox, { backgroundColor: fibCorrect ? '#E8F5E9' : '#FFEBEE', borderColor: fibCorrect ? '#4CAF50' : '#F44336' }]}>
                <Text style={[styles.fibAnswerTitle, { color: fibCorrect ? '#2E7D32' : '#C62828' }]}>
                  {fibCorrect ? '🎉 Brilliant! Correct Answer' : '❌ Ah, incorrect answer'}
                </Text>
                <Text style={[styles.fibAnswerText, { color: colors.text }]}>
                  Correct Term: <Text style={{ fontWeight: 'bold' }}>{questionItem.fibAnswer}</Text>
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCheckFib}
                disabled={!fibInput.trim()}
                style={[styles.fibSubmitBtn, { backgroundColor: fibInput.trim() ? colors.primary : colors.textSecondary + '30' }]}
              >
                <Text style={styles.fibSubmitText}>Verify Answer</Text>
                <FontAwesome5 name="check" size={12} color="#FFF" style={styles.btnIcon} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Flashcard Tab Rendering */}
        {activeTab === 'flashcard' && (
          <View style={styles.flashcardWrapper}>
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
                </View>
                <Text style={[styles.cardPromptText, { color: colors.text }]}>
                  {questionItem.flashcardFront || questionItem.question}
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
                </View>
                <Text style={[styles.cardPromptText, { color: colors.text }]}>
                  {questionItem.flashcardBack || questionItem.answer}
                </Text>
                <View style={styles.flipLabelRow}>
                  <FontAwesome5 name="redo" size={10} color={colors.textSecondary} />
                  <Text style={[styles.flipLabelText, { color: colors.textSecondary }]}>Tap to flip back</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>

            {flipped && (
              <View style={styles.flashcardSelfAssessment}>
                <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Rate your recall:</Text>
                <View style={styles.rateRow}>
                  <TouchableOpacity onPress={() => handleFlipCard()} style={[styles.rateBtn, { borderColor: '#F44336', backgroundColor: '#FFEBEE' }]}>
                    <Text style={{ color: '#C62828', fontWeight: 'bold', fontSize: 13 }}>Review Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleFlipCard()} style={[styles.rateBtn, { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' }]}>
                    <Text style={{ color: '#2E7D32', fontWeight: 'bold', fontSize: 13 }}>Got It! 👍</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

export default StudyMcqScreen;

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
    paddingTop: 20,
  },
  questionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 12,
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
  fibFeedbackIcon: {
    marginLeft: 10,
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
  btnIcon: {
    marginLeft: 8,
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
  },
  flashcardTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 20,
  },
  cardTouchTarget: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCard: {
    width: '100%',
    height: 240,
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
});
