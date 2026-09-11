const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const subjectsContent = `
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudySubjects } from '../../store/studySlice';

const StudyGuideSubjectsScreen = ({ route, navigation, colors = { background: '#F8F9FE', surface: '#FFF', text: '#111827', textSecondary: '#6B7280', primary: '#1976D2' } }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { studyLevel } = route.params || {};
  
  const { studyGuideSubjects, loadingStudyGuideSubjects } = useSelector((state) => state.study);
  const subjects = studyGuideSubjects[studyLevel?.id] || [];

  useEffect(() => {
    if (studyLevel?.id) {
      dispatch(fetchStudySubjects(studyLevel.id));
    }
  }, [dispatch, studyLevel]);

  const renderSubjectCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('StudyGuideNotesList', { subject: item })}
      style={[styles.subjectCard, { backgroundColor: colors.surface, shadowColor: '#000' }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '12' }]}>
        <FontAwesome5 name="book" size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.subjectName, { color: colors.text }]}>{item.name}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={14} color={colors.textSecondary + '80'} />
    </TouchableOpacity>
  );

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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>STUDY & GUIDE</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{studyLevel?.name} Subjects</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {loadingStudyGuideSubjects && subjects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubjectCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesome5 name="folder-open" size={48} color={colors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No subjects available.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1, marginHorizontal: 16 },
  subtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  placeholderButton: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, marginTop: 12 },
});

export default StudyGuideSubjectsScreen;
`;

const notesListContent = `
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudyNotes } from '../../store/studySlice';

const StudyGuideNotesListScreen = ({ route, navigation, colors = { background: '#F8F9FE', surface: '#FFF', text: '#111827', textSecondary: '#6B7280', primary: '#1976D2' } }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { subject } = route.params || {};
  
  const { studyNotes, loadingStudyNotes } = useSelector((state) => state.study);
  const notes = studyNotes[subject?.id] || [];

  useEffect(() => {
    if (subject?.id) {
      dispatch(fetchStudyNotes(subject.id));
    }
  }, [dispatch, subject]);

  const renderNoteCard = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('StudyandGuidesNotes', { note: item, subjectName: subject?.name, noteIndex: index + 1 })}
      style={[styles.noteCard, { backgroundColor: colors.surface, shadowColor: '#000' }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '12' }]}>
        <FontAwesome5 name="file-alt" size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.noteName, { color: colors.text }]}>NOTES {index + 1}</Text>
        <Text style={[styles.noteDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.question || 'Study Material'}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={14} color={colors.textSecondary + '80'} />
    </TouchableOpacity>
  );

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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subject?.name}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Study Notes</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {loadingStudyNotes && notes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesome5 name="folder-open" size={48} color={colors.textSecondary + '50'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notes available.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1, marginHorizontal: 16 },
  subtitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  placeholderButton: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  noteCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  noteName: { fontSize: 15, fontWeight: '700' },
  noteDesc: { fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, marginTop: 12 },
});

export default StudyGuideNotesListScreen;
`;

const answerContent = `
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RenderHtml from 'react-native-render-html';

const StudyandGuidesNotesScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  const { note, subjectName, noteIndex, colors: passedColors } = route.params || {};
  
  const colors = passedColors || {
    background: '#F8F9FE',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#1976D2',
  };

  const [fontScale] = useState(1);
  const premiumTextProps = Platform.select({ android: { textBreakStrategy: 'highQuality' }, ios: {} });

  const htmlContent = (note?.answerHtml || note?.answer || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&shy;/g, '')
    .replace(/&#8203;/g, '')
    .replace(/\\u200B/g, '')
    .replace(/\\u00AD/g, '')
    .trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.textSecondary + '08' }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '10' }]}
        >
          <FontAwesome5 name="chevron-left" size={13} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subjectName}
          </Text>
          <Text numberOfLines={1} allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            NOTES {noteIndex}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: insets.bottom + 70 }}
      >
        <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}>
          
          <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.questionLabel, { color: colors.primary }]}>TOPIC</Text>
            <Text {...premiumTextProps} style={[styles.questionText, { color: colors.text, fontSize: 17 * fontScale, lineHeight: 28 * fontScale }]}>
              {note?.question || 'Study Material'}
            </Text>
          </View>

          <View style={[styles.answerContainer, { borderTopColor: colors.textSecondary + '08' }]}>
            <View style={[styles.answerCard, { backgroundColor: colors.surface }]}>
              <RenderHtml
                contentWidth={width - 64}
                source={{ html: htmlContent }}
                enableExperimentalMarginCollapsing
                systemFonts={['System']}
                defaultTextProps={{ selectable: true, allowFontScaling: false }}
                baseStyle={{
                  color: colors.text,
                  fontSize: 16 * fontScale,
                  lineHeight: 26 * fontScale,
                  fontWeight: '400',
                  textAlign: 'left',
                  includeFontPadding: false,
                  ...Platform.select({ android: { textBreakStrategy: 'highQuality' } }),
                }}
                tagsStyles={{
                  body: { margin: 0, padding: 0, color: colors.text },
                  p: { marginTop: 0, marginBottom: 12, lineHeight: 22 * fontScale },
                  h1: { fontSize: 22 * fontScale, fontWeight: '700', lineHeight: 30 * fontScale, marginTop: 20, marginBottom: 10, color: colors.text },
                  h2: { fontSize: 20 * fontScale, fontWeight: '700', lineHeight: 28 * fontScale, marginTop: 20, marginBottom: 10, color: colors.text },
                  h3: { fontSize: 18 * fontScale, fontWeight: '700', lineHeight: 26 * fontScale, marginTop: 18, marginBottom: 8, color: colors.text },
                  ul: { marginTop: 4, marginBottom: 10, paddingLeft: 20 },
                  ol: { marginTop: 4, marginBottom:10, paddingLeft: 20 },
                  li: { marginBottom:2, lineHeight: 22 * fontScale },
                  blockquote: {
                    borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12, paddingVertical: 8,
                    paddingRight: 10, marginVertical: 12, backgroundColor: colors.primary + '08', borderRadius: 6,
                  },
                }}
                renderersProps={{
                  ol: { enableExperimentalRtl: false },
                  li: { markerTextStyle: { color: colors.text, fontWeight: '700' } },
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StudyandGuidesNotesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, marginHorizontal: 12 },
  subtitle: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 17, fontWeight: '700', marginTop: 4, letterSpacing: -0.2 },
  questionCard: {
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 18, marginBottom: 22,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 0 } }),
  },
  questionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  questionText: { fontWeight: '700', letterSpacing: -0.15 },
  answerContainer: { borderTopWidth: 1, paddingTop: 16 },
  answerCard: {
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 18,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 0 } }),
  }
});
`;

fs.writeFileSync(path.join(srcDir, 'StudyGuideSubjectsScreen.js'), subjectsContent);
fs.writeFileSync(path.join(srcDir, 'StudyGuideNotesListScreen.js'), notesListContent);
fs.writeFileSync(path.join(srcDir, 'StudyandGuidesNotesScreen.js'), answerContent);
console.log('Created StudyGuide files');

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('StudyGuideSubjectsScreen')) {
  const imports = `import StudyGuideSubjectsScreen from './study/StudyGuideSubjectsScreen';
import StudyGuideNotesListScreen from './study/StudyGuideNotesListScreen';
import StudyandGuidesNotesScreen from './study/StudyandGuidesNotesScreen';
`;
  studyContent = studyContent.replace("import EtoAnswerScreen from './study/EtoAnswerScreen';", "import EtoAnswerScreen from './study/EtoAnswerScreen';\n" + imports);

  const screens = `
      <Stack.Screen name="StudyGuideSubjects">
        {(props) => <StudyGuideSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyGuideNotesList">
        {(props) => <StudyGuideNotesListScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyandGuidesNotes">
        {(props) => <StudyandGuidesNotesScreen {...props} colors={colors} />}
      </Stack.Screen>
  `;
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
