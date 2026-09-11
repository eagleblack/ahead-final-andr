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
  const [maxHeight, setMaxHeight] = useState(360);
  
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, { toValue: 0, friction: 8, tension: 12, useNativeDriver: true }).start();
    } else {
      Animated.spring(flipAnim, { toValue: 180, friction: 8, tension: 12, useNativeDriver: true }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleLayout = (e) => {
  const h = Math.ceil(e.nativeEvent.layout.height);

  if (h + 12 > maxHeight) {
    setMaxHeight(h + 12);
  }
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

  const frontContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.flashCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
            <FontAwesome5 name="question" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.flashCardType, { color: colors.primary }]}>QUESTION</Text>
        </View>
        {!!item.year && <Text style={[styles.flashCardYear, { color: colors.textSecondary }]}>{item.year}</Text>}
      </View>
      <View style={styles.flashCardBody}>
        <Text style={[styles.flashCardText, { color: colors.text }]}>{item.question}</Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color={colors.primary} />
        <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to reveal answer</Text>
      </View>
     
    </View>
  );

  const backContent = (
    <View style={styles.cardContentLayout}>
      <View style={styles.flashCardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconBadge, { backgroundColor: '#4CAF5015' }]}>
            <FontAwesome5 name="lightbulb" size={14} color="#4CAF50" solid />
          </View>
          <Text style={[styles.flashCardType, { color: '#4CAF50' }]}>ANSWER</Text>
        </View>
      </View>
      <View style={styles.flashCardBody}>
        <Text style={[styles.flashCardText, { color: colors.text }]}>
          {item.answer || 'No answer available.'}
        </Text>
      </View>
      <View style={styles.flipLabelRow}>
        <FontAwesome5 name="sync-alt" size={12} color="#4CAF50" />
        <Text style={[styles.tapHint, { color: '#4CAF50' }]}>Tap to show question</Text>
      </View>
    
    </View>
  );

  return (
    <View style={styles.cardWrapper}>
      <View style={{ opacity: 0, position: 'absolute', width: '100%', top: 50, zIndex: -1, pointerEvents: 'none' }}>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{frontContent}</View>
        <View onLayout={handleLayout} style={styles.flipCardMeasure}>{backContent}</View>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={[styles.cardTouchTarget, { height: maxHeight }]}>
        <Animated.View
          pointerEvents={isFlipped ? 'none' : 'auto'}
          style={[
            styles.flashCard,
            frontAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: colors.primary },
            styles.premiumShadow
          ]}
        >
          {frontContent}
        </Animated.View>

        <Animated.View
          pointerEvents={isFlipped ? 'auto' : 'none'}
          style={[
            styles.flashCard,
            styles.flashCardBack,
            backAnimatedStyle,
            { backgroundColor: colors.surface, borderTopColor: '#4CAF50' },
            styles.premiumShadow
          ]}
        >
          {backContent}
        </Animated.View>
      </TouchableOpacity>
    </View>
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
        .orderBy("createdAt", "desc")
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
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  cardTouchTarget: {
    width: '100%',
    perspective: 1000,
  },
  flipCardMeasure: {
    width: '100%',
    padding: 28,
  },
  cardContentLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  flashCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderTopWidth: 6,
    padding: 28,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  flashCardBack: {},
  premiumShadow: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  flashCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flashCardType: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flashCardYear: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  flashCardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 2,
    marginBottom: 20,    
  },
  flashCardText: {
    fontSize:18,
    fontWeight: '600',
    
    textAlign: 'center',
  },
  flipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  watermarkText: {
    position: 'absolute',
    fontSize: 160,
    fontWeight: '900',
    opacity: 0.04,
    right: -20,
    bottom: -20,
    zIndex: 1,
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