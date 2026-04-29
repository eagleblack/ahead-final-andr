import React from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
}) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const likeOpacity = useSharedValue(0);
  const nopeOpacity = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])

    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;

      if (e.translationX > 0) {
        likeOpacity.value = Math.min(e.translationX / 120, 1);
        nopeOpacity.value = 0;
      } else {
        nopeOpacity.value = Math.min(Math.abs(e.translationX) / 120, 1);
        likeOpacity.value = 0;
      }
    })

    .onEnd(() => {
      // reset overlays
      likeOpacity.value = withTiming(0);
      nopeOpacity.value = withTiming(0);

      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, {}, () => {
          runOnJS(onSwipeRight)?.();
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, {}, () => {
          runOnJS(onSwipeLeft)?.();
        });
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        
        {/* APPLY */}
        <Animated.View style={[styles.overlay, styles.like, likeStyle]}>
          <Text style={styles.likeText}>APPLY</Text>
        </Animated.View>

        {/* NOPE */}
        <Animated.View style={[styles.overlay, styles.nope, nopeStyle]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>

        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
    height: "98%",
  },

  overlay: {
    position: "absolute",
    top: 60,
    zIndex: 10,
    padding: 8,
    borderWidth: 3,
    borderRadius: 10,
  },

  like: {
    left: 20,
    borderColor: "#4CAF50",
  },

  nope: {
    right: 20,
    borderColor: "#F44336",
  },

  likeText: {
    color: "#4CAF50",
    fontSize: 28,
    fontWeight: "900",
  },

  nopeText: {
    color: "#F44336",
    fontSize: 28,
    fontWeight: "900",
  },
});