const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const filesToConvert = [
  { from: 'DnsSubjectsScreen.js', to: 'GmeSubjectsScreen.js' },
  { from: 'DnsSubjectDetailsScreen.js', to: 'GmeSubjectDetailsScreen.js' },
  { from: 'DnsAnswerScreen.js', to: 'GmeAnswerScreen.js' },
];

filesToConvert.forEach(f => {
  const fromPath = path.join(srcDir, f.from);
  const toPath = path.join(srcDir, f.to);
  
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    content = content.replace(/Dns/g, 'Gme');
    content = content.replace(/dns/g, 'gme');
    content = content.replace(/DNS/g, 'GME');
    
    fs.writeFileSync(toPath, content);
    console.log(`Created ${f.to}`);
  }
});

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('GmeSubjectsScreen')) {
  const imports = `import GmeSubjectsScreen from './study/GmeSubjectsScreen';
import GmeSubjectDetailsScreen from './study/GmeSubjectDetailsScreen';
import GmeAnswerScreen from './study/GmeAnswerScreen';
`;
  studyContent = studyContent.replace("import BtechAnswerScreen from './study/BtechAnswerScreen';", "import BtechAnswerScreen from './study/BtechAnswerScreen';\n" + imports);

  const screens = `
      <Stack.Screen name="GmeSubjects">
        {(props) => <GmeSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GmeSubjectDetails">
        {(props) => <GmeSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="GmeAnswer">
        {(props) => <GmeAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  `;
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
