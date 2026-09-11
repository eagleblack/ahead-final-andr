import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Keyboard, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommunities, fetchLevels } from '../../store/studySlice';
import StudyBottomSheet from './components/StudyBottomSheet';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAGE_SIZE = 20;

const StudyHomeScreen = ({ navigation, colors }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { communities, levels } = useSelector((state) => state.study);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // 'COC' or 'Interview'
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunities());
    dispatch(fetchLevels());
  }, [dispatch]);
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [mainSearchInput, setMainSearchInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [savedCommunity, setSavedCommunity] = useState(null);
  const [savedLevel, setSavedLevel] = useState(null);

  const openSelection = (mode) => {
    if (savedCommunity && savedLevel) {
      navigation.navigate('StudySubjects', {
        mode,
        community: savedCommunity,
        level: savedLevel
      });
    } else {
      setSelectedMode(mode);
      setSheetVisible(true);
    }
  };

  const handleEditSelection = () => {
    setSelectedMode('COC');
    setSheetVisible(true);
  };

  const handleContinueStudy = async (selection) => {
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
  };

  // Load persisted exam selection on startup
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

  const sortMessages = (msgsList) => {
    return [...msgsList].sort((a, b) => {
      const aTime = a.sentOn?.toMillis ? a.sentOn.toMillis() : (a.sentOn?.seconds ? a.sentOn.seconds * 1000 : a.createdAt || Date.now());
      const bTime = b.sentOn?.toMillis ? b.sentOn.toMillis() : (b.sentOn?.seconds ? b.sentOn.seconds * 1000 : b.createdAt || Date.now());

      // If the timestamps are very close (within 10 seconds), ensure the bot reply (isUser: false) is sorted as NEWER
      // (so it renders below the user's query at index 0 in our inverted FlatList)
      if (Math.abs(aTime - bTime) < 10000) {
        if (a.isUser && !b.isUser) return 1;   // b is newer
        if (!a.isUser && b.isUser) return -1;  // a is newer
      }

      return bTime - aTime;
    });
  };

  // Set up real-time listener and load initial messages
  useEffect(() => {
    if (!chatVisible) {
      setMessages([]);
      setLastVisible(null);
      setHasMore(true);
      return;
    }

    const userId = auth().currentUser?.uid;
    if (!userId) return;

    let isMounted = true;

    // 1. Fetch initial paginated messages
    const fetchInit = async () => {
      try {
        const snap = await firestore()
          .collection('aiChats')
          .doc(userId)
          .collection('messages')
          .orderBy('sentOn', 'desc')
          .limit(PAGE_SIZE)
          .get();

        if (!isMounted) return;

        const initialMsgs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMessages(sortMessages(initialMsgs));
        setLastVisible(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.size === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching initial AI messages:", err);
      }
    };

    fetchInit();

    // 2. Set up real-time listener for new messages
    const unsubscribe = firestore()
      .collection('aiChats')
      .doc(userId)
      .collection('messages')
      .orderBy('sentOn', 'desc')
      .onSnapshot(snapshot => {
        if (!snapshot) return;

        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const newMsg = {
              id: change.doc.id,
              ...change.doc.data()
            };

            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;

              const updated = [newMsg, ...prev];
              return sortMessages(updated);
            });
          }
        });
      }, err => {
        console.error("AI Chat listener error:", err);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [chatVisible]);

  // Pagination: load older messages
  const loadOlderMessages = async () => {
    if (!hasMore || loadingOlder || !lastVisible) return;

    const userId = auth().currentUser?.uid;
    if (!userId) return;

    setLoadingOlder(true);
    try {
      const snap = await firestore()
        .collection('aiChats')
        .doc(userId)
        .collection('messages')
        .orderBy('sentOn', 'desc')
        .startAfter(lastVisible)
        .limit(PAGE_SIZE)
        .get();

      const olderMsgs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(prev => {
        const merged = [...prev];
        olderMsgs.forEach(m => {
          if (!merged.some(existing => existing.id === m.id)) {
            merged.push(m);
          }
        });
        return sortMessages(merged);
      });

      setLastVisible(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading older AI messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Helper to send message to Firestore
  const sendMessageToDb = async (text, isUser = true) => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    try {
      await firestore()
        .collection('aiChats')
        .doc(userId)
        .collection('messages')
        .add({
          text,
          isUser,
          sentOn: firestore.FieldValue.serverTimestamp(),
          createdAt: Date.now() // Precise local timestamp for perfect fallbacks
        });
    } catch (err) {
      console.error("Error writing message to Firestore:", err);
    }
  };

  // Clear entire AI chat history in database
  const clearChatHistory = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    try {
      const snap = await firestore()
        .collection('aiChats')
        .doc(userId)
        .collection('messages')
        .get();

      const batch = firestore().batch();
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setMessages([]);
    } catch (err) {
      console.error("Error clearing AI chat history:", err);
    }
  };
 
  const openAiChatWithQuery = () => {
    setChatVisible(true);
  };

  const handleSendMessageInModal = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatInput('');

    // 1. Save user query to Firestore
    await sendMessageToDb(text, true);

    // 2. Show replying indicator
    setIsReplying(true);

    try {
      // 3. Get Firebase ID token
      const idToken = await auth().currentUser?.getIdToken();

      // 4. Send request to localhost backend
    const response = await fetch('https://learn.aurameter.in/api/ai/chat', {
        method: 'POST',
        headers: {  
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: idToken || '',
          question: text,
        }),
      });

      const data = await response.json();
   

      const botText = data.reply || data.answer || data.response || data.message || data.text;
      if (botText) {
        // Double-check if the message already exists in state (written by backend)
        const alreadySavedByBackend = messages.some(m => !m.isUser && m.text === botText);
        if (!alreadySavedByBackend) {
          //await sendMessageToDb(botText, false);
        }
      }
    } catch (err) {
      console.error("Error calling AI API:", err);
      await sendMessageToDb("Sorry, I am having trouble connecting to my brain right now. Please try again later.", false);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
        
          <Text style={[styles.mainTitle, { color: colors.text }]}>Ai Learning</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyBookmarks')}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="bookmark" size={14} color={colors.primary} solid />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Direct AI Search Bar (triggers modal launch) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setChatVisible(true)}
          style={[styles.searchSection, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Talk to Ahead AI..."
            placeholderTextColor={colors.textSecondary + '70'}
            editable={false}
            pointerEvents="none"
          />
          <View style={[styles.searchSendBtn, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="paper-plane" size={12} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Persisted Selection Card */}
        {savedCommunity && savedLevel && (
          <View style={[styles.selectionPersistCard, { backgroundColor: colors.surface, borderColor: colors.primary + '15' }]}>
            <View style={styles.selectionInfoRow}>
              <View style={[styles.selectionIconBg, { backgroundColor: colors.primary + '12' }]}>
                <FontAwesome5 name="graduation-cap" size={14} color={colors.primary} />
              </View>
              <View style={styles.selectionTextContainer}>
                <Text style={[styles.selectionLabel, { color: colors.textSecondary }]}>CURRENT PREPARATION</Text>
                <Text style={[styles.selectionValue, { color: colors.text }]} numberOfLines={1}>
                  {savedCommunity.name} • {savedLevel.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleEditSelection}
              style={[styles.editSelectionBtn, { borderColor: colors.primary + '40' }]}
            >
              <FontAwesome5 name="pen" size={10} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.editSelectionText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Simplified Study Options */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Study Modes</Text>

        {/* COC Mode Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openSelection('COC')}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={['rgba(25, 118, 210, 0.1)', 'rgba(25, 118, 210, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={[styles.cardIconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <FontAwesome5 name="book-reader" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>COC Prep</Text>
                
              </View>
              <View style={[styles.modeBadge, { backgroundColor: '#4CAF50' + '15' }]}>
                  <Text style={[styles.modeBadgeText, { color: '#4CAF50' }]}>SYLLABUS & ORALS</Text>
                </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Review past oral exam questions, structural topics, and structured model answers.
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
 
        {/* Interview MCQ Mode Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('StudyInterview')}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={['rgba(124, 77, 255, 0.1)', 'rgba(124, 77, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={[styles.cardIconWrapper, { backgroundColor: '#7C4DFF' + '15' }]}>
              <FontAwesome5 name="tasks" size={24} color="#7C4DFF" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Interview Simulator</Text>
               
              </View>
               <View style={[styles.modeBadge, { backgroundColor: '#7C4DFF' + '15' }]}>
                  <Text style={[styles.modeBadgeText, { color: '#7C4DFF' }]}>MCQ & FLASHCARDS</Text>
                </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Practice hiring company MCQs, fill-in-the-blanks, and flashcards with sequence progress.
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bookmarks Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('StudyBookmarks')}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={['rgba(255, 143, 0, 0.1)', 'rgba(255, 143, 0, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={[styles.cardIconWrapper, { backgroundColor: '#FF8F00' + '15' }]}>
              <FontAwesome5 name="bookmark" size={22} color="#FF8F00" solid />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Saved Bookmarks</Text>
                
              </View>
              <View style={[styles.modeBadge, { backgroundColor: '#FF8F00' + '15' }]}>
                  <Text style={[styles.modeBadgeText, { color: '#FF8F00' }]}>SAVED Q&A</Text>
                </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Review your bookmarked study questions, MCQs, fill-in-the-blanks, and flashcards.
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Selector Bottom Sheet */}
      <StudyBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        colors={colors}
        mode={selectedMode}
        onContinue={handleContinueStudy}
        communities={communities}
        levels={levels}
      />

      {/* Mock Chatbot Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={[styles.chatContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: colors.textSecondary + '20' }]}>
            <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.chatClose}>
              <FontAwesome5 name="chevron-down" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.chatTitleWrapper}>
              <Text style={[styles.chatTitle, { color: colors.text }]}>Study AI Copilot</Text>
              <View style={styles.onlineBadge}>
               
              </View>
            </View>
            <TouchableOpacity onPress={clearChatHistory}>
            
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <FlatList
            data={[
              ...messages,
              { id: 'welcome', text: 'Hey! I am your Ahead AI Study Assistant. Ask me anything about marine engineering or your upcoming MEO examinations!', isUser: false }
            ]}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatMessages}
            inverted
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              isReplying ? (
                <View style={[
                  styles.messageBubble,
                  styles.botBubble,
                  { backgroundColor: colors.surface, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }
                ]}>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.messageText, { color: colors.textSecondary }]}>Ahead AI is replying...</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              loadingOlder ? (
                <View style={{ paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble,
                item.isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.botBubble, { backgroundColor: colors.surface }]
              ]}>
                <Text style={[
                  styles.messageText,
                  item.isUser ? { color: '#FFF' } : { color: colors.text }
                ]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          {/* Input Box */}
          <View style={[styles.chatInputRow, { borderTopColor: colors.textSecondary + '20', paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.textSecondary + '20' }]}
              placeholder="Type your question..."
              placeholderTextColor={colors.textSecondary + '70'}
              value={chatInput}
              onChangeText={setChatInput}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={handleSendMessageInModal}
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
            >
              <FontAwesome5 name="paper-plane" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {},
  appTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  searchSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 14,
  }, 
  card: {
    borderRadius: 18,
    marginBottom: 16,
    elevation: 3,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 18,
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  chatClose: {
    padding: 4,
  },
  chatTitleWrapper: {
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  chatMessages: {
    padding: 20,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionPersistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  selectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectionTextContainer: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectionValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  editSelectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editSelectionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
