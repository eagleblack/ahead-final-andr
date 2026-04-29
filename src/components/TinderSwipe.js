import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import {
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const SWIPE_THRESHOLD = width * 0.25;

const TinderSwiper = ({ data, renderCard, onSwipeLeft, onSwipeRight }) => {
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const handleSwipe = (direction) => {
    if (direction === "right") {
      onSwipeRight && onSwipeRight(currentIndex.value);
    } else {
      onSwipeLeft && onSwipeLeft(currentIndex.value);
    }
    currentIndex.value += 1;
    translateX.value = 0;
  };

  const gestureHandler = (event) => {
    translateX.value = event.translationX;
  };

  const endGesture = () => {
    if (translateX.value > SWIPE_THRESHOLD) {
      translateX.value = withSpring(width, {}, () => {
        runOnJS(handleSwipe)("right");
      });
    } else if (translateX.value < -SWIPE_THRESHOLD) {
      translateX.value = withSpring(-width, {}, () => {
        runOnJS(handleSwipe)("left");
      });
    } else {
      translateX.value = withSpring(0);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!data || data.length === 0) return null;

  const currentCard = data[currentIndex.value];
  const nextCard = data[currentIndex.value + 1];

  return (
    <View style={styles.container}>
      {/* Next card (background) */}
      {nextCard && (
        <View style={styles.nextCard}>
          {renderCard(nextCard)}
        </View>
      )}

      {/* Current card */}
      <PanGestureHandler
        onGestureEvent={(e) => gestureHandler(e.nativeEvent)}
        onEnded={endGesture}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          {renderCard(currentCard)}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default TinderSwiper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
  },
  nextCard: {
    position: "absolute",
    width: "100%",
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
});