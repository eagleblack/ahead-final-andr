
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
