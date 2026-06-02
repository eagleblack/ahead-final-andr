import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Import newly created study screens
import StudyHomeScreen from './study/StudyHomeScreen';
import StudySubjectsScreen from './study/StudySubjectsScreen';
import StudyTopicsScreen from './study/StudyTopicsScreen';
import StudyQuestionsScreen from './study/StudyQuestionsScreen';
import StudyAnswerScreen from './study/StudyAnswerScreen';
import StudyMcqScreen from './study/StudyMcqScreen';
import StudyInterviewScreen from './study/StudyInterviewScreen';
import StudyBookmarksScreen from './study/StudyBookmarksScreen';

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
      <Stack.Screen name="StudyQuestions">
        {(props) => <StudyQuestionsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyAnswer">
        {(props) => <StudyAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyMcq">
        {(props) => <StudyMcqScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyInterview">
        {(props) => <StudyInterviewScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="StudyBookmarks">
        {(props) => <StudyBookmarksScreen {...props} colors={colors} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default StudyScreen;