import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommunities, fetchLevels, fetchStcwLevels, fetchStudyLevels } from '../../store/studySlice';
import StudyBottomSheet from './components/StudyBottomSheet';
import AiSection from './components/AiSection';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExamCard = ({ title, subtitle, icon, color, onPress, isLast }) => (
  <View style={styles.examCardContainer}>
    <TouchableOpacity style={styles.examCard} onPress={onPress} activeOpacity={0.7}>
      <Image source={icon} style={styles.examIcon} resizeMode="contain" />
      <Text style={styles.examTitle}>{title}</Text>
      <Text style={[styles.examSubtitle, { color }]}>{subtitle}</Text>
    </TouchableOpacity>
    {!isLast && <View style={styles.examDivider} />}
  </View>
);

const InterviewCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.interviewCard} onPress={onPress} activeOpacity={0.7}>
    <Image source={icon} style={styles.interviewIcon} resizeMode="contain" />
    <Text style={styles.interviewTitle}>{title}</Text>
    <Text style={[styles.interviewSubtitle, { color }]}>{subtitle}</Text>
  </TouchableOpacity>
);

const StudyGuideCard = ({ title, desc, linkText, linkColor, icon, onPress }) => (
  <TouchableOpacity style={styles.studyGuideCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.studyGuideContent}>
      <Image source={icon} style={styles.studyGuideIcon} resizeMode="contain" />
      <View style={styles.studyGuideTextContainer}>
        <Text style={styles.studyGuideTitle}>{title}</Text>
        <Text style={styles.studyGuideDesc}>{desc}</Text>
        <Text style={[styles.studyGuideLink, { color: linkColor }]}>{linkText}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const StudyHomeScreen = ({ navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { communities, levels, stcwLevels, studyLevels } = useSelector((state) => state.study);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [savedCommunity, setSavedCommunity] = useState(null);
  const [savedLevel, setSavedLevel] = useState(null);

  useEffect(() => {
    dispatch(fetchCommunities());
    dispatch(fetchLevels());
    dispatch(fetchStcwLevels());
    dispatch(fetchStudyLevels());
  }, [dispatch]);

  const openSelection = (mode) => {
    setSelectedMode(mode);
    setSheetVisible(true);
  };

  const handleContinueStudy = async (selection) => {
    if (selectedMode === 'STCW') {
      navigation.navigate('StcwSubjects', {
        mode: selectedMode,
        stcwLevel: selection.stcwLevel,
      });
      setSheetVisible(false);
      return;
    }

    if (selectedMode === 'GUIDE') {
      navigation.navigate('StudyGuideSubjects', {
        studyLevel: selection.studyLevel,
      });
      setSheetVisible(false);
      return;
    }

    try {
      await AsyncStorage.setItem('saved_community', JSON.stringify(selection.community));
      await AsyncStorage.setItem('saved_level', JSON.stringify(selection.level));
      setSavedCommunity(selection.community);
      setSavedLevel(selection.level);
    } catch (err) {
      console.error("Error persisting exam selection:", err);
    }
    navigation.navigate('StudySubjects', {
      mode: selectedMode,
      ...selection
    });
    setSheetVisible(false);
  };

  useEffect(() => {
    const loadPersistedSelection = async () => {
      try {
        const commStr = await AsyncStorage.getItem('saved_community');
        const lvlStr = await AsyncStorage.getItem('saved_level');
        if (commStr && lvlStr) {
          setSavedCommunity(JSON.parse(commStr));
          setSavedLevel(JSON.parse(lvlStr));
        }
      } catch (err) {
        console.error("Error loading persisted exam selection:", err);
      }
    };
    loadPersistedSelection();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FE' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.mainTitle}>AI Assistant <Text style={styles.sparkle}>✨</Text></Text>
          <Text style={styles.subtitle}>Your smart companion for exam & interview prep</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyBookmarks')}
          style={styles.savedButton}
        >
          <FontAwesome5 name="bookmark" size={18} color="#000" />
          <Text style={styles.savedText}>Saved</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <AiSection colors={colors} />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>EXAMS PREPARATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            <ExamCard title="STCW" subtitle="Exams" icon={require('../../assets/stcw.png')} color="#1976D2" onPress={() => openSelection('STCW')} />
            <ExamCard title="COC" subtitle="Exams" icon={require('../../assets/coc.png')} color="#4CAF50" onPress={() => openSelection('COC')} />
            <ExamCard title="GP" subtitle="Exams" icon={require('../../assets/gp.png')} color="#9C27B0" onPress={() => navigation.navigate('GpSubjects')} />
            <ExamCard title="DNS" subtitle="Exams" icon={require('../../assets/dns.png')} color="#FF9800" onPress={() => navigation.navigate('DnsSubjects')} />
            <ExamCard title="B.Tech" subtitle="Exams" icon={require('../../assets/engine.png')} color="#1915ef" onPress={() => navigation.navigate('BtechSubjects')}  />
            <ExamCard title="GME" subtitle="Exams" icon={require('../../assets/btech.png')} color="#4CAF50" onPress={() => navigation.navigate('GmeSubjects')}  />
              
              <ExamCard title="ETO" subtitle="Exams" icon={require('../../assets/guide.png')} color="#02420458" onPress={() => navigation.navigate('EtoSubjects')} isLast={true} />
        
          </ScrollView>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>INTERVIEW SIMULATOR</Text>
          <View style={styles.gridContainer}>
            <InterviewCard title={"My Rank\nInterview"} subtitle="Personalized" icon={require('../../assets/my-rank-interview.png')} color="#1976D2" onPress={() => navigation.navigate('StudyInterview')} />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>STUDY & GUIDE</Text>
          <View style={styles.rowContainer}>
            <StudyGuideCard title="Study & Guide" desc={"Concepts, lessons\nand explanations"} linkText="Start Learning >" linkColor="#1976D2" icon={require('../../assets/study.png')} onPress={() => openSelection('GUIDE')} />
          </View>
        </View>
      </ScrollView>

      <StudyBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        colors={colors}
        mode={selectedMode}
        onContinue={handleContinueStudy}
        communities={communities}
        levels={levels}
        stcwLevels={stcwLevels}
        studyLevels={studyLevels}
      />
    </View>
  );
};

export default StudyHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D1326',
    marginBottom: 4,
  },
  sparkle: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  savedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  savedText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    color: '#0D1326',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,

  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  examCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  examDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },  
  examIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  examSubtitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interviewCard: {
    alignItems: 'center',
    marginRight: 32,
    marginBottom: 20,
  },
  interviewIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  interviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  interviewSubtitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  studyGuideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    maxWidth: '48%',
  },
  studyGuideContent: {
    alignItems: 'flex-start',
  },
  studyGuideIcon: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
  studyGuideTextContainer: {
  },
  studyGuideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  studyGuideDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  studyGuideLink: {
    fontSize: 12,
    fontWeight: '700',
  },
});
