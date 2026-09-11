import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStcwSubjects } from '../../store/studySlice';

const StcwSubjectsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { stcwLevel } = route.params;
  const { stcwSubjects, loadingStcwSubjects } = useSelector((state) => state.study);
  
  useEffect(() => {
    if (stcwLevel?.id) {
      dispatch(fetchStcwSubjects(stcwLevel.id));
    }
  }, [dispatch, stcwLevel]);

  const renderSubject = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => navigation.navigate('StcwSubjectDetails', { stcwLevel, stcwSubject: item })}
      activeOpacity={0.8}
    >
      <View style={styles.subjectContent}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="book" size={16} color="#1976D2" />
        </View>
        <Text style={styles.subjectName}>{item.name}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={14} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.subtitle}>STCW • {stcwLevel?.name}</Text>
          <Text style={styles.title}>Select Subject</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loadingStcwSubjects ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      ) : stcwSubjects.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No subjects available for this level.</Text>
        </View>
      ) : (
        <FlatList
          data={stcwSubjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubject}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  headerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  subtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#6B7280' },
  title: { fontSize: 20, fontWeight: '800', marginTop: 4, color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14 },
  listContainer: { paddingHorizontal: 20 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  subjectContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, paddingRight: 10 },
});

export default StcwSubjectsScreen;
