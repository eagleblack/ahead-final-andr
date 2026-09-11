const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study/StudyOralQuestionsScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldFlashCardRegex = /const FlashCard = \(\{ item, colors \}\) => \{[\s\S]*?const StudyOralQuestionsScreen =/s;

const newFlashCard = `const FlashCard = ({ item, colors }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [maxHeight, setMaxHeight] = useState(360);
  
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, { toValue: 0, friction: 8, tension: 12, useNativeDriver: true }).start();
    } else {
      Animated.spring(flipAnim, { toValue: 180, friction: 8, tension: 12, useNativeDriver: true }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleLayout = (e) => {
    const h = e.nativeEvent.layout.height;
    if (h > maxHeight) setMaxHeight(h);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const frontContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.flashCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
            <FontAwesome5 name="question" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.flashCardType, { color: colors.primary }]}>QUESTION</Text>
        </View>
        {!!item.year && <Text style={[styles.flashCardYear, { color: colors.textSecondary }]}>{item.year}</Text>}
      </View>
      <View style={styles.flashCardBody}>
        <Text style={[styles.flashCardText, { color: colors.text }]}>{item.question}</Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color={colors.primary} />
        <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to reveal answer</Text>
      </View>
      <Text style={[styles.watermarkText, { color: colors.primary }]}>Q</Text>
    </View>
  );

  const backContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.flashCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBadge, { backgroundColor: '#4CAF5015' }]}>
            <FontAwesome5 name="lightbulb" size={14} color="#4CAF50" solid />
          </View>
          <Text style={[styles.flashCardType, { color: '#4CAF50' }]}>ANSWER</Text>
        </View>
      </View>
      <View style={styles.flashCardBody}>
        <Text style={[styles.flashCardText, { color: colors.text }]}>
          {item.answer || 'No answer available.'}
        </Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color="#4CAF50" />
        <Text style={[styles.tapHint, { color: '#4CAF50' }]}>Tap to show question</Text>
      </View>
      <Text style={[styles.watermarkText, { color: '#4CAF50' }]}>A</Text>
    </View>
  );

  return (
    <View style={styles.cardWrapper}>
      <View style={{ opacity: 0, position: 'absolute', width: '100%', top: 50, zIndex: -1, pointerEvents: 'none' }}>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{frontContent}</View>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{backContent}</View>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={[styles.cardTouchTarget, { height: maxHeight }]}>
        <Animated.View
          pointerEvents={isFlipped ? 'none' : 'auto'}
          style={[
            styles.flashCard,
            frontAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: colors.primary },
            styles.premiumShadow
          ]}
        >
          {frontContent}
        </Animated.View>

        <Animated.View
          pointerEvents={isFlipped ? 'auto' : 'none'}
          style={[
            styles.flashCard,
            styles.flashCardBack,
            backAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: '#4CAF50' },
            styles.premiumShadow
          ]}
        >
          {backContent}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const StudyOralQuestionsScreen =`;

content = content.replace(oldFlashCardRegex, newFlashCard);

const oldStylesRegex = /cardWrapper: \{[\s\S]*?emptyText: \{/s;

const newStyles = `cardWrapper: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  cardTouchTarget: {
    width: '100%',
    perspective: 1000,
  },
  flipCardMeasure: {
    width: '100%',
    padding: 28,
  },
  cardContentLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  flashCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderTopWidth: 6,
    padding: 28,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  flashCardBack: {},
  premiumShadow: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  flashCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flashCardType: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flashCardYear: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  flashCardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 2,
  },
  flashCardText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  flipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  watermarkText: {
    position: 'absolute',
    fontSize: 160,
    fontWeight: '900',
    opacity: 0.04,
    right: -20,
    bottom: -20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {`;

content = content.replace(oldStylesRegex, newStyles);

fs.writeFileSync(file, content);
console.log('Update complete for Oral Questions FlashCard');
