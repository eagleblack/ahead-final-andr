import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Import newly created study screens
import StudyHomeScreen from './study/StudyHomeScreen';
import StudySubjectsScreen from './study/StudySubjectsScreen';
import StudyTopicsScreen from './study/StudyTopicsScreen';
import StudyOralQuestionsScreen from './study/StudyOralQuestionsScreen';
import StudyQuestionsScreen from './study/StudyQuestionsScreen';
import StudyAnswerScreen from './study/StudyAnswerScreen';
import StudyInterviewScreen from './study/StudyInterviewScreen';
import StudyBookmarksScreen from './study/StudyBookmarksScreen';
import StcwSubjectsScreen from './study/StcwSubjectsScreen';
import StcwSubjectDetailsScreen from './study/StcwSubjectDetailsScreen';
import StcwMockExamScreen from './study/StcwMockExamScreen';
import StcwMockExamResultScreen from './study/StcwMockExamResultScreen';
import StcwPracticeScreen from './study/StcwPracticeScreen';
import StcwAnswerScreen from './study/StcwAnswerScreen';
import GpSubjectsScreen from './study/GpSubjectsScreen';
import GpSubjectDetailsScreen from './study/GpSubjectDetailsScreen';
import GpMockExamScreen from './study/GpMockExamScreen';
import GpMockExamResultScreen from './study/GpMockExamResultScreen';
import GpPracticeScreen from './study/GpPracticeScreen';
import GpAnswerScreen from './study/GpAnswerScreen';
import DnsSubjectsScreen from './study/DnsSubjectsScreen';
import DnsSubjectDetailsScreen from './study/DnsSubjectDetailsScreen';
import DnsAnswerScreen from './study/DnsAnswerScreen';
import BtechSubjectsScreen from './study/BtechSubjectsScreen';
import BtechSubjectDetailsScreen from './study/BtechSubjectDetailsScreen';
import BtechAnswerScreen from './study/BtechAnswerScreen';
import GmeSubjectsScreen from './study/GmeSubjectsScreen';
import GmeSubjectDetailsScreen from './study/GmeSubjectDetailsScreen';
import GmeAnswerScreen from './study/GmeAnswerScreen';
import EtoSubjectsScreen from './study/EtoSubjectsScreen';
import EtoSubjectDetailsScreen from './study/EtoSubjectDetailsScreen';
import EtoAnswerScreen from './study/EtoAnswerScreen';
import StudyGuideSubjectsScreen from './study/StudyGuideSubjectsScreen';
import StudyGuideNotesListScreen from './study/StudyGuideNotesListScreen';
import StudyandGuidesNotesScreen from './study/StudyandGuidesNotesScreen';







const Stack = createStackNavigator();

const StudyScreen = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="StudyHome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="StudyHome">
        {(props) => <StudyHomeScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudySubjects">
        {(props) => <StudySubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyTopics">
        {(props) => <StudyTopicsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyOralQuestions">
        {(props) => <StudyOralQuestionsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyQuestions">
        {(props) => <StudyQuestionsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyAnswer">
        {(props) => <StudyAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyInterview">
        {(props) => <StudyInterviewScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyBookmarks">
        {(props) => <StudyBookmarksScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwSubjects">
        {(props) => <StcwSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwSubjectDetails">
        {(props) => <StcwSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwMockExam">
        {(props) => <StcwMockExamScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwMockExamResult">
        {(props) => <StcwMockExamResultScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwPractice">
        {(props) => <StcwPracticeScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StcwAnswer">
        {(props) => <StcwAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
    
      <Stack.Screen name="GpSubjects">
        {(props) => <GpSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GpSubjectDetails">
        {(props) => <GpSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GpMockExam">
        {(props) => <GpMockExamScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GpMockExamResult">
        {(props) => <GpMockExamResultScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GpPractice">
        {(props) => <GpPracticeScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GpAnswer">
        {(props) => <GpAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
        <Stack.Screen name="DnsSubjects">
        {(props) => <DnsSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="DnsSubjectDetails">
        {(props) => <DnsSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="DnsAnswer">
        {(props) => <DnsAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  
      <Stack.Screen name="BtechSubjects">
        {(props) => <BtechSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="BtechSubjectDetails">
        {(props) => <BtechSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="BtechAnswer">
        {(props) => <BtechAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  
      <Stack.Screen name="GmeSubjects">
        {(props) => <GmeSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GmeSubjectDetails">
        {(props) => <GmeSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GmeAnswer">
        {(props) => <GmeAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  
      <Stack.Screen name="EtoSubjects">
        {(props) => <EtoSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="EtoSubjectDetails">
        {(props) => <EtoSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="EtoAnswer">
        {(props) => <EtoAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  
      <Stack.Screen name="StudyGuideSubjects">
        {(props) => <StudyGuideSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyGuideNotesList">
        {(props) => <StudyGuideNotesListScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyandGuidesNotes">
        {(props) => <StudyandGuidesNotesScreen {...props} colors={colors} />}
      </Stack.Screen>
  </Stack.Navigator>
  );
};

export default StudyScreen;
