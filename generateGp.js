const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const filesToConvert = [
  { from: 'StcwSubjectsScreen.js', to: 'GpSubjectsScreen.js' },
  { from: 'StcwSubjectDetailsScreen.js', to: 'GpSubjectDetailsScreen.js' },
  { from: 'StcwPracticeScreen.js', to: 'GpPracticeScreen.js' },
  { from: 'StcwAnswerScreen.js', to: 'GpAnswerScreen.js' },
  { from: 'StcwMockExamScreen.js', to: 'GpMockExamScreen.js' },
  { from: 'StcwMockExamResultScreen.js', to: 'GpMockExamResultScreen.js' },
];

filesToConvert.forEach(f => {
  const fromPath = path.join(srcDir, f.from);
  const toPath = path.join(srcDir, f.to);
  
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    content = content.replace(/Stcw/g, 'Gp');
    content = content.replace(/stcw/g, 'gp');
    content = content.replace(/STCW/g, 'GP');
    
    if (f.to === 'GpSubjectsScreen.js') {
      content = content.replace(/const { gpLevel } = route\.params \|\| \{\};/g, '');
      content = content.replace(/dispatch\(fetchGpSubjects\(gpLevel\.id\)\);/g, 'dispatch(fetchGpSubjects());');
      content = content.replace(/if \(gpLevel\?\.id\) \{/g, 'if (true) {');
      content = content.replace(/\[dispatch, gpLevel\]/g, '[dispatch]');
      content = content.replace(/gpLevel, gpSubject: item/g, 'gpSubject: item');
      content = content.replace(/GP • \{gpLevel\?\.name\}/g, 'GP • Subjects');
      content = content.replace(/gpLevel\?\.id/g, 'true'); // just in case
    }
    
    if (f.to === 'GpSubjectDetailsScreen.js' || f.to === 'GpPracticeScreen.js' || f.to === 'GpAnswerScreen.js' || f.to === 'GpMockExamScreen.js' || f.to === 'GpMockExamResultScreen.js') {
      content = content.replace(/const \{ gpLevel, gpSubject \} = route\.params;/g, 'const { gpSubject } = route.params;');
      content = content.replace(/gpLevel: \{ id: gpSubject\.gpLevelId \}/g, '');
    }

    fs.writeFileSync(toPath, content);
    console.log('Created', f.to);
  }
});

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('GpSubjectsScreen')) {
  const imports = `import GpSubjectsScreen from './study/GpSubjectsScreen';
import GpSubjectDetailsScreen from './study/GpSubjectDetailsScreen';
import GpMockExamScreen from './study/GpMockExamScreen';
import GpMockExamResultScreen from './study/GpMockExamResultScreen';
import GpPracticeScreen from './study/GpPracticeScreen';
import GpAnswerScreen from './study/GpAnswerScreen';
`;
  studyContent = studyContent.replace('import StcwAnswerScreen from \'./study/StcwAnswerScreen\';', 'import StcwAnswerScreen from \'./study/StcwAnswerScreen\';\n' + imports);

  const screens = `
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
  `;
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
