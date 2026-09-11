const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study/StudyTopicsScreen.js';
let content = fs.readFileSync(file, 'utf8');

const premiumComponentCode = `
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

const StudyTopicsScreen`;

content = content.replace(/const StudyTopicsScreen/, premiumComponentCode);

const oldRenderFlashcardRegex = /const renderFlashcard = \(\) => \{[\s\S]*?\}\s*:\s*null\}\s*<\/View>\s*\);\s*\};/s;
const newRenderFlashcard = `const renderFlashcard = () => {
    return <PremiumFlashcard 
      currentItem={currentItem} 
      colors={colors} 
      flipped={flipped} 
      handleFlipCard={handleFlipCard} 
      handleFlashcardDone={handleFlashcardDone} 
      frontAnimatedStyle={frontAnimatedStyle} 
      backAnimatedStyle={backAnimatedStyle} 
      renderEmptyState={renderEmptyState} 
    />;
  };`;

content = content.replace(oldRenderFlashcardRegex, newRenderFlashcard);

const oldFlashcardStylesRegex = /flashcardWrapper: \{[\s\S]*?emptyDesc: \{/s;

const newFlashcardStyles = `flashcardWrapper: { alignItems: 'center', paddingVertical: 20 },
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
  cardPromptText: { fontSize: 22, fontWeight: '700', lineHeight: 32, textAlign: 'center' },
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
  emptyDesc: {`;

content = content.replace(oldFlashcardStylesRegex, newFlashcardStyles);

fs.writeFileSync(file, content);
console.log('Update complete');
