import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QuestionAccordion = ({ item, isMcq, colors }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleOptionPress = (option) => {
    if (isAnswered) return; // Prevent changing after selection
    setSelectedOption(option);
    setIsAnswered(true);
  };

  const renderMCQOptions = () => {
    return (
      <View style={styles.mcqContainer}>
        {item.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === item.answer;
          let optionStyle = [styles.optionButton, { borderColor: colors.textSecondary + '30', backgroundColor: colors.surface }];
          let optionTextStyle = [styles.optionText, { color: colors.text }];
          let iconName = null;
          let iconColor = null;

          if (isAnswered) {
            if (isCorrect) {
              // Highlight correct answer in green
              optionStyle = [styles.optionButton, styles.correctOption, { borderColor: '#4CAF50' }];
              optionTextStyle = [styles.optionText, styles.correctOptionText];
              iconName = 'check-circle';
              iconColor = '#4CAF50';
            } else if (isSelected && !isCorrect) {
              // Highlight user incorrect selection in red
              optionStyle = [styles.optionButton, styles.incorrectOption, { borderColor: '#F44336' }];
              optionTextStyle = [styles.optionText, styles.incorrectOptionText];
              iconName = 'times-circle';
              iconColor = '#F44336';
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.7}
              disabled={isAnswered}
            >
              <View style={styles.optionContent}>
                <View style={[styles.letterBadge, { backgroundColor: isAnswered && isCorrect ? '#4CAF50' : isAnswered && isSelected ? '#F44336' : colors.primary + '15' }]}>
                  <Text style={[styles.letterText, { color: isAnswered && (isCorrect || isSelected) ? '#FFF' : colors.primary }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={optionTextStyle}>{option}</Text>
              </View>
              {iconName && <FontAwesome5 name={iconName} size={16} color={iconColor} style={styles.optionIcon} />}
            </TouchableOpacity>
          );
        })}

        {isAnswered && (
          <View style={[styles.explanationBox, { backgroundColor: colors.primary + '08', borderLeftColor: colors.primary }]}>
            <Text style={[styles.explanationTitle, { color: colors.primary }]}>
              {selectedOption === item.answer ? '🎉 Correct Answer!' : '❌ Incorrect Answer'}
            </Text>
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
              The correct option is: <Text style={{ fontWeight: 'bold', color: colors.text }}>{item.answer}</Text>.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            {item.year && (
              <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{item.year}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.questionText, { color: colors.text }]}>{item.question}</Text>
        </View>
        <View style={[styles.iconWrapper, { backgroundColor: expanded ? colors.primary + '15' : 'transparent' }]}>
          <FontAwesome5
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={expanded ? colors.primary : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.textSecondary + '15' }]}>
          {isMcq ? (
            renderMCQOptions()
          ) : (
            <View>
              <Text style={[styles.answerHeader, { color: colors.primary }]}>Suggested Answer:</Text>
              <Text style={[styles.answerText, { color: colors.text }]}>{item.answer}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default QuestionAccordion;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 16,
    borderTopWidth: 1,
  },
  answerHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  mcqContainer: {
    marginTop: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  letterText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  optionIcon: {
    marginLeft: 8,
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
  },
  correctOptionText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  incorrectOption: {
    backgroundColor: '#FFEBEE',
  },
  incorrectOptionText: {
    color: '#C62828',
    fontWeight: '600',
  },
  explanationBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
