const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const filesToConvert = [
  { from: 'DnsSubjectsScreen.js', to: 'EtoSubjectsScreen.js' },
  { from: 'DnsSubjectDetailsScreen.js', to: 'EtoSubjectDetailsScreen.js' },
  { from: 'DnsAnswerScreen.js', to: 'EtoAnswerScreen.js' },
];

filesToConvert.forEach(f => {
  const fromPath = path.join(srcDir, f.from);
  const toPath = path.join(srcDir, f.to);
  
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    content = content.replace(/Dns/g, 'Eto');
    content = content.replace(/dns/g, 'eto');
    content = content.replace(/DNS/g, 'ETO');
    
    fs.writeFileSync(toPath, content);
    console.log(`Created ${f.to}`);
  }
});

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('EtoSubjectsScreen')) {
  const imports = `import EtoSubjectsScreen from './study/EtoSubjectsScreen';
import EtoSubjectDetailsScreen from './study/EtoSubjectDetailsScreen';
import EtoAnswerScreen from './study/EtoAnswerScreen';
`;
  studyContent = studyContent.replace("import GmeAnswerScreen from './study/GmeAnswerScreen';", "import GmeAnswerScreen from './study/GmeAnswerScreen';\n" + imports);

  const screens = `
      <Stack.Screen name="EtoSubjects">
        {(props) => <EtoSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="EtoSubjectDetails">
        {(props) => <EtoSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="EtoAnswer">
        {(props) => <EtoAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  `;
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
