import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RenderHtml from 'react-native-render-html';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark, fetchBookmarks } from '../../store/studySlice';

const StudyAnswerScreen = ({
  route,
  navigation,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();

  const {
    mode,
    isOral,
    community,
    level,
    examType,
    classType,
    topicTitle,
    questionItem,
    topicId,
  } = route.params || {};

  const { bookmarks } = useSelector((state) => state.study);
  const isBookmarked = bookmarks.some((b) => b.questionId === questionItem?.id);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const handleBookmarkToggle = () => {
    dispatch(toggleBookmark({
      questionItem,
      questionType: isOral ? 'oral' : 'coc',
      sourceCollection: isOral ? 'oral_questions' : 'questions',
      topicId,
      isBookmarked,
    }));
  };

  const isMcq = mode === 'Interview';

  const [fontScale, setFontScale] = useState(1);
  const [selectedOption, setSelectedOption] =
    useState(null);
  const [isAnswered, setIsAnswered] =
    useState(false);

  const premiumTextProps = Platform.select({
    android: {
      textBreakStrategy: 'highQuality',
    },
    ios: {},
  });

  const increaseFontSize = () => {
    setFontScale(prev =>
      Math.min(
        1.3,
        Number((prev + 0.08).toFixed(2)),
      ),
    );
  };

  const decreaseFontSize = () => {
    setFontScale(prev =>
      Math.max(
        0.9,
        Number((prev - 0.08).toFixed(2)),
      ),
    );
  };

  const handleOptionPress = option => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);
  };

  const htmlContent = (
    questionItem?.answer || ''
  )
    .replace(/&nbsp;/g, ' ')
    .replace(/&shy;/g, '')
    .replace(/&#8203;/g, '')
    .replace(/\u200B/g, '')
    .replace(/\u00AD/g, '')
    .trim();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            borderBottomColor:
              colors.textSecondary + '08',
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor:
                colors.textSecondary + '10',
            },
          ]}
        >
          <FontAwesome5
            name="chevron-left"
            size={13}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            allowFontScaling={false}
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {examType} • {classType}
          </Text>

          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {topicTitle}
          </Text>
        </View>

        <View style={styles.readabilityRow}>
          <TouchableOpacity
            onPress={handleBookmarkToggle}
            style={[
              styles.readabilityBtn,
              {
                backgroundColor: colors.surface,
                borderColor:
                  colors.textSecondary + '12',
              },
            ]}
          >
           <FontAwesome5 name="bookmark" size={15} color={isBookmarked ? '#FF8F00' : colors.text} solid={isBookmarked} />
          </TouchableOpacity>

        
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 16,
          paddingBottom: insets.bottom + 70,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 760,
            alignSelf: 'center',
          }}
        >
          {/* META */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaBadge,
                {
                  backgroundColor:
                    colors.primary + '12',
                },
              ]}
            >
              <FontAwesome5
                name={
                  isMcq
                    ? 'tasks'
                    : 'book-reader'
                }
                size={9}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {isMcq
                  ? 'INTERVIEW'
                  : 'EXAM GUIDE'}
              </Text>
            </View>

            {!!questionItem?.year && (
              <View
                style={[
                  styles.yearBadge,
                  {
                    backgroundColor:
                      colors.textSecondary +
                      '10',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.yearText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  {questionItem?.year}
                </Text>
              </View>
            )}
          </View>

          {/* QUESTION */}
          <View
            style={[
              styles.questionCard,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.questionLabel,
                {
                  color: colors.primary,
                },
              ]}
            >
              QUESTION
            </Text>

            <Text
              {...premiumTextProps}
              style={[
                styles.questionText,
                {
                  color: colors.text,
                  fontSize: 17 * fontScale,
                  lineHeight: 28 * fontScale,
                },
              ]}
            >
              {questionItem?.question}
            </Text>
          </View>

          {/* MCQ */}
          {isMcq && (
            <View style={styles.mcqSection}>
              {questionItem?.options?.map(
                (option, index) => {
                  const isSelected =
                    selectedOption === option;

                  const isCorrect =
                    option ===
                    questionItem?.answer;

                  const answeredWrong =
                    isAnswered &&
                    isSelected &&
                    !isCorrect;

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.9}
                      disabled={isAnswered}
                      onPress={() =>
                        handleOptionPress(
                          option,
                        )
                      }
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor:
                            isCorrect
                              ? '#EAF8EE'
                              : answeredWrong
                              ? '#FFF2F2'
                              : colors.surface,

                          borderColor: isCorrect
                            ? '#4CAF50'
                            : answeredWrong
                            ? '#F44336'
                            : colors.textSecondary +
                              '10',
                        },
                      ]}
                    >
                      <View
                        style={
                          styles.optionLeft
                        }
                      >
                        <View
                          style={[
                            styles.optionBadge,
                            {
                              backgroundColor:
                                isCorrect
                                  ? '#4CAF50'
                                  : answeredWrong
                                  ? '#F44336'
                                  : colors.primary +
                                    '12',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionBadgeText,
                              {
                                color:
                                  isCorrect ||
                                  answeredWrong
                                    ? '#FFF'
                                    : colors.primary,
                              },
                            ]}
                          >
                            {String.fromCharCode(
                              65 + index,
                            )}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: colors.text,
                              fontSize:
                                14.5 *
                                fontScale,
                              lineHeight:
                                23 *
                                fontScale,
                            },
                          ]}
                        >
                          {option}
                        </Text>
                      </View>

                      {isCorrect && (
                        <FontAwesome5
                          name="check-circle"
                          size={16}
                          color="#4CAF50"
                        />
                      )}

                      {answeredWrong && (
                        <FontAwesome5
                          name="times-circle"
                          size={16}
                          color="#F44336"
                        />
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          )}

          {/* ANSWER */}
          {(!isMcq || isAnswered) && (
            <View
              style={[
                styles.answerContainer,
                {
                  borderTopColor:
                    colors.textSecondary +
                    '08',
                },
              ]}
            >
              <View
                style={[
                  styles.answerCard,
                  {
                    backgroundColor:
                      colors.surface,
                  },
                ]}
              >
                {isMcq ? (
                  <Text
                    style={[
                      styles.answerText,
                      {
                        color: colors.text,
                        fontSize:
                          15 * fontScale,
                        lineHeight:
                          26 * fontScale,
                      },
                    ]}
                  >
                    The correct answer is "
                    {questionItem?.answer}"
                  </Text>
                ) : (
                  
                  <RenderHtml
                    contentWidth={width - 64}
                    source={{
                      html: htmlContent,
                    }}
                    enableExperimentalMarginCollapsing
                    systemFonts={['System']}
                    defaultTextProps={{
                      selectable: true,
                      allowFontScaling: false,
                    }}
                    baseStyle={{
  color: colors.text,
  fontSize: 16 * fontScale,
  lineHeight: 26 * fontScale,
  fontWeight: '400',
  textAlign: 'left',
  includeFontPadding: false,

  ...Platform.select({
    android: {
      textBreakStrategy: 'highQuality',
    },
  }),
}}
tagsStyles={{
  body: {
    margin: 0,
    padding: 0,
    color: colors.text,
  },

  p: {
    marginTop: 0,
    marginBottom: 12,
    lineHeight: 22 * fontScale,
  },

  h1: {
    fontSize: 22 * fontScale,
    fontWeight: '700',
    lineHeight: 30 * fontScale,
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },

  h2: {
    fontSize: 20 * fontScale,
    fontWeight: '700',
    lineHeight: 28 * fontScale,
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },

  h3: {
    fontSize: 18 * fontScale,
    fontWeight: '700',
    lineHeight: 26 * fontScale,
    marginTop: 18,
    marginBottom: 8,
    color: colors.text,
  },

  ul: {
    marginTop: 4,
    marginBottom: 10,
    paddingLeft: 20,
  },

  ol: {
    marginTop: 4,
    marginBottom:10,
    paddingLeft: 20,
  },

  li: {
    marginBottom:2,
    lineHeight: 22 * fontScale,
  },

  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    paddingRight: 10,
    marginVertical: 12,
    backgroundColor: colors.primary + '08',
    borderRadius: 6,
  },
}}
                    renderersProps={{
                      ol: {
                        enableExperimentalRtl:
                          false,
                      },

                      li: {
                        markerTextStyle: {
                          color: colors.text,
                          fontWeight: '700',
                        },
                      },
                    }}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StudyAnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },

  subtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.2,
  },

  readabilityRow: {
    flexDirection: 'row',
  },

  readabilityBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
  },

  readabilityText: {
    fontSize: 11,
    fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  metaText: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.8,
  },

  yearBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  yearText: {
    fontSize: 9,
    fontWeight: '700',
  },

  questionCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 0,
      },
    }),
  },

  questionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  questionText: {
    fontWeight: '700',
    letterSpacing: -0.15,
  },

  mcqSection: {
    marginBottom: 20,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    paddingHorizontal: 14,
    paddingVertical: 14,

    borderRadius: 18,
    borderWidth: 1,

    marginBottom: 10,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.01,
        shadowRadius: 4,
        shadowOffset: {
          width: 0,
          height: 1,
        },
      },

      android: {
        elevation: 0,
      },
    }),
  },

  optionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 10,
  },

  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  optionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },

  optionText: {
    flex: 1,
    flexShrink: 1,
    fontWeight: '500',
  },

  answerContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
  },

  answerCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 0,
      },
    }),
  },

  answerText: {
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});