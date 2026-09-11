import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const PAGE_SIZE = 20;

const AiSection = ({ colors }) => {
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const sortMessages = (msgsList) => {
    return [...msgsList].sort((a, b) => {
      const aTime = a.sentOn?.toMillis ? a.sentOn.toMillis() : (a.sentOn?.seconds ? a.sentOn.seconds * 1000 : a.createdAt || Date.now());
      const bTime = b.sentOn?.toMillis ? b.sentOn.toMillis() : (b.sentOn?.seconds ? b.sentOn.seconds * 1000 : b.createdAt || Date.now());

      if (Math.abs(aTime - bTime) < 10000) {
        if (a.isUser && !b.isUser) return 1;
        if (!a.isUser && b.isUser) return -1;
      }
      return bTime - aTime;
    });
  };

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
          createdAt: Date.now()
        });
    } catch (err) {
      console.error("Error writing message to Firestore:", err);
    }
  };

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

  const handleSendMessageInModal = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatInput('');
    await sendMessageToDb(text, true);
    setIsReplying(true);

    try {
      const idToken = await auth().currentUser?.getIdToken();

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
    <>
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

      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={[styles.chatContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
    </>
  );
};

export default AiSection;

const styles = StyleSheet.create({
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
});
