import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import firestore from '@react-native-firebase/firestore';

const FlashCard = ({ item, colors }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontHeight, setFrontHeight] = useState(0);
  const [backHeight, setBackHeight] = useState(0);
  
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Track the taller face to ensure zero rendering clippings
  const cardHeight = Math.max(frontHeight, backHeight) || undefined;

  const handleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, { toValue: 0, friction: 8, tension: 12, useNativeDriver: true }).start();
    } else {
      Animated.spring(flipAnim, { toValue: 180, friction: 8, tension: 12, useNativeDriver: true }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  return (
    <Pressable onPress={handleFlip} style={[styles.cardWrapper]}>
      {/* FRONT SIDE (Question) */}
      <Animated.View
        onLayout={(e) => !isFlipped && setFrontHeight(e.nativeEvent.layout.height)}
        pointerEvents={isFlipped ? 'none' : 'auto'}
        style={[
          styles.flashCard,
          frontAnimatedStyle,
          { backgroundColor: colors.surface, backfaceVisibility: 'hidden' },
        ]}
      >
        <View style={styles.flashCardHeader}>
          <Text style={[styles.flashCardType, { color: colors.primary }]}>QUESTION</Text>
          {!!item.year && <Text style={[styles.flashCardYear, { color: colors.textSecondary }]}>{item.year}</Text>}
        </View>

        <View style={styles.flashCardBody}>
          <Text style={[styles.flashCardText, { color: colors.text }]}>{item.question}</Text>
        </View>

        <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
          Tap to reveal answer
        </Text>
      </Animated.View>

      {/* BACK SIDE (Answer) */}
      <Animated.View
        onLayout={(e) => isFlipped && setBackHeight(e.nativeEvent.layout.height)}
        pointerEvents={isFlipped ? 'auto' : 'none'}
        style={[
          styles.flashCard,
          styles.flashCardBack,
          backAnimatedStyle,
          { backgroundColor: colors.surface, backfaceVisibility: 'hidden' },
        ]}
      >
        <View style={styles.flashCardHeader}>
          <Text style={[styles.flashCardType, { color: colors.textSecondary }]}>ANSWER</Text>
        </View>

        <View style={styles.flashCardBody}>
          <Text style={[styles.flashCardText, { color: colors.text }]}>
            {item.answer || 'No answer available.'}
          </Text>
        </View>

        <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
          Tap to show question
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const StudyOralQuestionsScreen = ({ route, navigation, colors }) => {
  const insets = useSafeAreaInsets();
  
  const { examType, classType, oralSubjectId, oralSubjectTitle } = route.params || {};
  
  const [questions, setQuestions] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchBatch = useCallback(async (isNext = false) => {
    if (!oralSubjectId || (!isNext && loading) || (isNext && loadingMore) || (isNext && !hasMore)) return;

    if (isNext) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let query = firestore()
        .collection('oral')
        .where('subjectId', '==', oralSubjectId)
        .limit(20);

      if (isNext && lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        setHasMore(false);
        if (isNext) setLoadingMore(false);
        else setLoading(false);
        return;
      }

      const data = snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || '',
          answer: qData.answerHtml || qData.answer || '',
          year: qData.askedYears && qData.askedYears.length > 0
            ? `Asked in ${qData.askedYears.join(', ')}`
            : qData.year || '',
          ...qData,
        };
      });

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (isNext) {
        setQuestions((prev) => [...prev, ...data]);
      } else {
        setQuestions(data);
      }

      if (snapshot.docs.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching oral questions:', error);
    } finally {
      if (isNext) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [oralSubjectId, lastDoc, loading, loadingMore, hasMore]);

  useEffect(() => {
    if (oralSubjectId) {
      setQuestions([]);
      setLastDoc(null);
      setHasMore(true);
      fetchBatch(false);
    }
  }, [oralSubjectId]);

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchBatch(true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const isLoadingInitial = loading && questions.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.textSecondary + '20' }]}
        >
          <FontAwesome5 name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>ORAL • {examType}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {oralSubjectTitle || classType}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoadingInitial ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading flashcards...</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <FlashCard item={item} colors={colors} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome5 name="microphone-slash" size={50} color={colors.textSecondary + '40'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No oral questions available.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default StudyOralQuestionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  cardWrapper: {
    minHeight: 450,
    marginBottom: 18,
    height:'auto'
  },
  flashCard: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    padding: 22,
    
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  flashCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flashCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flashCardType: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flashCardYear: {
    fontSize: 11,
    fontWeight: '600',
  },
  flashCardBody: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  flashCardText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
  tapHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});