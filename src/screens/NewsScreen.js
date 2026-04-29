import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "../context/ThemeContext";
import NewsCard from "../components/NewsCard";

import {
  fetchInitialNews,
  fetchMoreNews,
  refreshNews,
  clearNews,
} from "../store/newsSlice";
import CustomHeaderNews from "../components/CustomeHeaderNews";
import CustomHeaderTabsNews from "../components/CustomHeaderTabsNews";
import LinearGradient from "react-native-linear-gradient";
import { fetchRecentPosts, fetchTrendingPosts } from "../store/feedSlice";
import BetaInfoModal from "../components/BetaInfoModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_TAB_HEIGHT = 60;
const PAGE_HEIGHT = SCREEN_HEIGHT - BOTTOM_TAB_HEIGHT;

const HEADER_MAX = 50;
const TABS_HEIGHT = 50;


const NewsScreen = () => {
  const dispatch = useDispatch();
  const { colors,theme:mode} = useTheme(); // light | dark | midnight
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const insets = useSafeAreaInsets();
const scrollY = useRef(new Animated.Value(0)).current;
const lastScrollY = useRef(0);
const headerAnim = useRef(new Animated.Value(0)).current; // 0 = shown, 1 = hidden
// HEADER COLLAPSE ANIMATION
const totalHeaderHeight = HEADER_MAX + TABS_HEIGHT;

const headerTranslateY = headerAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0, -totalHeaderHeight], // hide BOTH
});
const headerOpacity = headerAnim.interpolate({
inputRange: [0, 1],
outputRange: [1, 0],
});
const contentTranslateY = headerAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [HEADER_MAX + TABS_HEIGHT-insets.top , 0],
});
  const {
    news,
    loadingInitial,
    loadingMore,
    error,
    hasMore,
  } = useSelector((state) => state.news);
const handleScroll = Animated.event(
  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  {
    useNativeDriver: true,
    listener: (event) => {
      const currentY = event.nativeEvent.contentOffset.y;

      if (currentY > lastScrollY.current && currentY > 20) {
        // scrolling DOWN → hide
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        // scrolling UP → show
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentY;
    },
  }
);

  const [refreshing, setRefreshing] = useState(false);
const [activeTab, setActiveTab] = useState("Post");
  const [showBetaModal, setShowBetaModal] = useState(false);
 const { user: userData } = useSelector((state) => state.user);
  useEffect(() => {
    const checkBetaModal = async () => {
      if (userData?.userType === "company") return;

      const hasShown = await AsyncStorage.getItem("hasShownBetaModal");
      if (!hasShown) {
        setShowBetaModal(true);
        await AsyncStorage.setItem("hasShownBetaModal", "true");
      }
    };

    if (userData) checkBetaModal();
  }, [userData]);
useEffect(() => {
dispatch(fetchInitialNews());

dispatch(fetchRecentPosts());
dispatch(fetchTrendingPosts());
return () => dispatch(clearNews());
}, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshNews());
    setRefreshing(false);
  }, [dispatch]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      dispatch(fetchMoreNews());
    }
  };

  // 🔥 FULL SCREEN ITEM (ONE NEWS = ONE PAGE)
  const renderItem = ({ item }) => {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <NewsCard item={item} colors={colors} fullScreen />
      </View>
    );
  };

  // ⏳ Premium Loader
  if (loadingInitial) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
      
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 🔴 Error State
  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>
          Failed to load news
        </Text>
      </SafeAreaView>
    );
  }
  const gradientColors =
    mode === "midnight"
      ? ["#1B1B3A", "#0B0B28"]
      : mode === "dark"
      ? ["#141414", "#070707"]
      : ["#E3F2FD", "#BBDEFB"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background,paddingHorizontal:6 }} edges={['top']}>
       
<Animated.View
style={[
styles.headerContainer,
{ transform: [{ translateY: headerTranslateY },] },
{ backgroundColor: colors.background}
]}
>
{/* HEADER */}
  <Animated.View style={{ opacity: headerOpacity, height: HEADER_MAX + insets.top }}>
    <CustomHeaderNews />
  </Animated.View>
{/* TABS - always visible, never collapses */}



</Animated.View>
<Animated.View
  style={{
    flex: 1,
    transform: [{ translateY: contentTranslateY }],
  }}
>
<AnimatedFlatList
  data={news}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}

  pagingEnabled
  snapToInterval={SCREEN_HEIGHT}
  snapToAlignment="start"
  decelerationRate="fast"
  disableIntervalMomentum

  showsVerticalScrollIndicator={false}

  onEndReached={loadMore}
  onEndReachedThreshold={0.5}

  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }

  ListFooterComponent={
    loadingMore ? (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null
  }

  initialNumToRender={3}
  maxToRenderPerBatch={3}
  windowSize={5}
  removeClippedSubviews

  onScroll={handleScroll}
  scrollEventThrottle={16} // ⚠️ REQUIRED
/>
</Animated.View>
     <BetaInfoModal
            visible={showBetaModal}  
            onClose={() => setShowBetaModal(false)}
          />
    </SafeAreaView>
  );
};

export default NewsScreen;

const styles = StyleSheet.create({
    headerContainer: {
position: "absolute",
left: 0,
right: 0,
top: 0,
zIndex: 20,

},
  page: {
    height: SCREEN_HEIGHT,  

    width: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});