const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/screens/study/StudyTopicsScreen.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/  const tabs = \[\s+.*?key: 'TOPICS'.*?\s+.*?key: 'MCQ'.*?\s+.*?key: 'FLASHCARD'.*?\s+.*?key: 'FIB'.*?\s+\];/s, '');
content = content.replace(/<StudySegmentTabs tabs=\{tabs\} activeTab=\{activeTab\} onChange=\{setActiveTab\} colors=\{colors\} \/>/, '<CustomTabBar activeTab={activeTab} onChange={setActiveTab} />');
content = content.replace(/import StudySegmentTabs from '\.\/components\/StudySegmentTabs';\n/, '');
const customStyles = `
  customTabContainer: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 16, backgroundColor: '#FFF' },
  customTabScroll: { paddingHorizontal: 16, alignItems: 'center' },
  customTabWrapperWithDivider: { flexDirection: 'row', alignItems: 'center' },
  customTabTouchable: { alignItems: 'center', justifyContent: 'center', minWidth: 70, paddingHorizontal: 10 },
  customIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  customTabLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textAlign: 'center' },
  customActiveIndicator: { width: 20, height: 4, borderRadius: 2 },
  customTabDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
`;
content = content.replace('container: { flex: 1 },', 'container: { flex: 1 },\n' + customStyles);
fs.writeFileSync(file, content);
