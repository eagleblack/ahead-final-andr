const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study/StudyQuestionsScreen.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator \} from 'react-native';/, 
  'import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from \'react-native\';');

const oldCardRegex = /<View style=\{\[styles\.questionCard, \{ backgroundColor: colors\.surface \}\]\}>[\s\S]*?<\/View>\s*<\/View>\s*\);\s*\}\}/;

const newCard = `
<View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
  <View style={styles.cardHeader}>
    {item.year ? (
      <View style={[styles.yearBadge, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[styles.yearBadgeText, { color: colors.primary }]}>{item.year}</Text>
      </View>
    ) : <View />}
    <TouchableOpacity
      onPress={() => dispatch(toggleBookmark({
        questionItem: item,
        questionType: activeTab === 'COC' ? 'coc' : 'oral',
        sourceCollection: activeTab === 'COC' ? 'questions' : 'oral_questions',
        topicId,
        isBookmarked
      }))}
      style={styles.bookmarkBtn}
    >
      <FontAwesome5 name="bookmark" size={16} color={isBookmarked ? '#FF8F00' : colors.textSecondary + '50'} solid={isBookmarked} />
    </TouchableOpacity>
  </View>
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() =>
      navigation.navigate('StudyAnswer', {
        mode,
        isOral: activeTab === 'ORAL',
        community,
        level,
        examType,
        classType,
        topicTitle,
        questionItem: item,
        topicId,
      })
    }
    style={styles.cardBody}
  >
    <Text style={[styles.questionText, { color: colors.text }]}>
      {item.question}
    </Text>
    
    {item.questionImage ? (
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.questionImage }} style={styles.questionImage} resizeMode="contain" />
      </View>
    ) : null}
    
    <View style={[styles.divider, { backgroundColor: colors.textSecondary + '15' }]} />

    <View style={styles.cardFooter}>
      <View style={[styles.readButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.readButtonText, { color: '#FFF' }]}>
          Read Answer
        </Text>
        <FontAwesome5 name="arrow-right" size={10} color="#FFF" />
      </View>
    </View>
  </TouchableOpacity>
</View>
            );
          }}
`;
content = content.replace(oldCardRegex, newCard);

const stylesRegex = /questionCard: \{[\s\S]*?readButtonText: \{[\s\S]*?\},/s;

const newStyles = `
  questionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  yearBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    padding: 4,
  },
  cardBody: {},
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  questionImage: {
    width: '100%',
    height: '100%',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  readButtonText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
`;
content = content.replace(stylesRegex, newStyles);

fs.writeFileSync(file, content);
console.log('Update complete');
