const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study';

const filesToConvert = [
  { from: 'DnsSubjectsScreen.js', to: 'BtechSubjectsScreen.js' },
  { from: 'DnsSubjectDetailsScreen.js', to: 'BtechSubjectDetailsScreen.js' },
  { from: 'DnsAnswerScreen.js', to: 'BtechAnswerScreen.js' },
];

filesToConvert.forEach(f => {
  const fromPath = path.join(srcDir, f.from);
  const toPath = path.join(srcDir, f.to);
  
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    content = content.replace(/Dns/g, 'Btech');
    content = content.replace(/dns/g, 'btech');
    content = content.replace(/DNS/g, 'B.Tech');
    
    fs.writeFileSync(toPath, content);
    console.log(`Created ${f.to}`);
  }
});

const studyScreenPath = path.join(srcDir, '../StudyScreen.js');
let studyContent = fs.readFileSync(studyScreenPath, 'utf8');

if (!studyContent.includes('BtechSubjectsScreen')) {
  const imports = `import BtechSubjectsScreen from './study/BtechSubjectsScreen';
import BtechSubjectDetailsScreen from './study/BtechSubjectDetailsScreen';
import BtechAnswerScreen from './study/BtechAnswerScreen';
`;
  studyContent = studyContent.replace("import DnsAnswerScreen from './study/DnsAnswerScreen';", "import DnsAnswerScreen from './study/DnsAnswerScreen';\n" + imports);

  const screens = `
      <Stack.Screen name="BtechSubjects">
        {(props) => <BtechSubjectsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="BtechSubjectDetails">
        {(props) => <BtechSubjectDetailsScreen {...props} colors={colors} />}
      </Stack.Screen>
      <Stack.Screen name="BtechAnswer">
        {(props) => <BtechAnswerScreen {...props} colors={colors} />}
      </Stack.Screen>
  `;
  studyContent = studyContent.replace('</Stack.Navigator>', screens + '</Stack.Navigator>');
  fs.writeFileSync(studyScreenPath, studyContent);
  console.log('Updated StudyScreen.js');
}
