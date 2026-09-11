// HomeScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
View,
Text,
StyleSheet,
RefreshControl,
FlatList,
TouchableOpacity,
Image,
Dimensions,
ActivityIndicator,    
Linking,
LayoutAnimation,
} from "react-native";
import { FAB } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Icon from "@react-native-vector-icons/material-icons";
import SIcon from "react-native-vector-icons/SimpleLineIcons";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import MDIcon from "react-native-vector-icons/Entypo";



import Hyperlink from "react-native-hyperlink";
import { useTheme } from "../context/ThemeContext";
import CustomHeader from "../components/CustomHeader";
import CustomHeaderTabs from "../components/CustomHeaderTabs";

import FullWidthImage from "../components/FullWidthImage";
import NewsCard from "../components/NewsCard";
import PollCard from "../components/PollCard";
import ReportModal from "../components/ReportModal";

import { timeAgo } from "../utils/time";
import { Animated } from "react-native";
import { Avatar } from "react-native-paper";

import {
fetchTrendingPosts,
fetchRecentPosts,
toggleBookmark,
toggleBookmarkOptimistic,
toggleLike,
toggleLikeOptimistic,
removePostOptimistic,
reportPost,
markPostSeen,
} from "../store/feedSlice";

import {
fetchInitialNews,
fetchMoreNews,
refreshNews,
clearNews,
} from "../store/newsSlice";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import VerificationOverlay from "../components/VerificationOverlay";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_TAB_HEIGHT = 60;
const PAGE_HEIGHT = SCREEN_HEIGHT - BOTTOM_TAB_HEIGHT;
import { POST_CATEGORIES } from "./AddPost";
const HEADER_MAX = 50;
const TABS_HEIGHT = 50;

const HomeScreenUser = () => {
const navigation = useNavigation();
  const { colors,theme:mode} = useTheme(); // light | dark | midnight

const dispatch = useDispatch();
const insets = useSafeAreaInsets();
const pagerRef = useRef(null);
const scrollY = useRef(new Animated.Value(0)).current;
const lastScrollY = useRef(0);
const headerAnim = useRef(new Animated.Value(0)).current; // 0 = shown, 1 = hidden
// HEADER COLLAPSE ANIMATION
const headerTranslateY = headerAnim.interpolate({
inputRange: [0, 1],
outputRange: [0, -HEADER_MAX],
});
const headerOpacity = headerAnim.interpolate({
inputRange: [0, 1],
outputRange: [1, 0],
});

const feed = useSelector((state) => state.feed);
const {
  posts: recentPosts,
  isFetching: isFetchingRecent,
  error: recentError,
} = feed.recent;

const {
  posts: trendingPosts,
  isFetching: isFetchingTrending,
  error: trendingError,
} = feed.trending;
const { user: userData } = useSelector((state) => state.user);

const [refreshing, setRefreshing] = useState(false);
const [activeTab, setActiveTab] = useState("Post");

const recentListRef = useRef(null);
const trendingListRef = useRef(null);
const newsListRef = useRef(null);

const recentOffsetRef = useRef(0);
const trendingOffsetRef = useRef(0);
const newsOffsetRef = useRef(0);
const scrollPositions = useRef({
Post: 0,
Trending: 0,
News: 0, 
});
const [postToReport, setPostToReport] = useState(null); 

const [reportVisible, setReportVisible] = useState(false);
const syncHeaderWithScroll = (offset) => {
if (offset <= HEADER_MAX) {
Animated.timing(headerAnim, {
toValue: 0,
duration: 0,
useNativeDriver: true,
}).start();
} else {
Animated.timing(headerAnim, {
toValue: 1,
duration: 0,
useNativeDriver: true,
}).start();
}
};
// Initial fetch

const tabs = [ "Post", "Trending"];

const goToNextTab = () => {
  const index = tabs.indexOf(activeTab);
  if (index < tabs.length - 1) {
     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setActiveTab(tabs[index + 1]);
  }
};

const goToPrevTab = () => {
  const index = tabs.indexOf(activeTab);
  if (index > 0) {
     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  
    setActiveTab(tabs[index - 1]);
  }
};
const onSwipe = (event) => {
  const { translationX, translationY, velocityX, state } = event.nativeEvent;

  if (state === State.END) {
    const threshold = 80;

    const isHorizontal =
      Math.abs(translationX) > Math.abs(translationY);

    if (!isHorizontal) return; // ❌ Ignore vertical gestures

    if (translationX < -threshold || velocityX < -800) {
      goToNextTab();
    }

    if (translationX > threshold || velocityX > 800) {
      goToPrevTab();
    }
  }
};
const onRefresh = async () => {
setRefreshing(true);
if (activeTab === "News") await dispatch(refreshNews());
else if (activeTab === "Trending") await dispatch(fetchTrendingPosts());
else await dispatch(fetchRecentPosts());
setRefreshing(false);
};

Text.render = (function (render) {
return function (...args) {
let originText = render.apply(this, args);
console.log("Font Family used:", originText.props.style?.fontFamily);
return originText;
};
})(Text.render);
// Pagination
const loadMorePosts = () => {
const data = activeTab === "Trending" ? feed.trending : feed.recent;
if (!data.isFetching && !data.isLastPage) {
dispatch(
activeTab === "Trending"
? fetchTrendingPosts({ loadMore: true })
: fetchRecentPosts({ loadMore: true })
);
}
};
//Active Tb scroll position

useEffect(() => {
const targetOffset = scrollPositions.current[activeTab] || 0;

// Scroll to saved position
if (activeTab === "Post" && recentListRef.current) {
recentListRef.current.scrollToOffset({
offset: targetOffset,
animated: false,
});
}

if (activeTab === "Trending" && trendingListRef.current) {
trendingListRef.current.scrollToOffset({
offset: targetOffset,
animated: false,
});
}

if (activeTab === "News" && newsListRef.current) {
newsListRef.current.scrollToOffset({
offset: targetOffset,
animated: false,
});
}

// 🔑 THIS IS THE FIX
scrollY.setValue(targetOffset);
syncHeaderWithScroll(targetOffset);

lastScrollY.current = targetOffset;
}, [activeTab]);


const loadMoreNews = () => {
if (!isFetchingNews && hasMore) dispatch(fetchMoreNews());
};


const [expanded, setExpanded] = useState({});
const handleLike = useCallback(
(post) => {
dispatch(toggleLikeOptimistic({ feedType: "recent", postId: post.id }));
dispatch(toggleLikeOptimistic({ feedType: "trending", postId: post.id }));
dispatch(toggleLike(post));
},
[dispatch]
);

const handleBookmark = useCallback(
(post) => {
dispatch(toggleBookmarkOptimistic({ feedType: "recent", postId: post.id }));
dispatch(toggleBookmarkOptimistic({ feedType: "trending", postId: post.id }));
dispatch(toggleBookmark(post));
},
[dispatch]
);

const viewabilityConfig = {
  itemVisiblePercentThreshold: 60,
};

const seenPostsRef = useRef(new Set());
const visibleSinceRef = useRef({});
const dispatchRef = useRef(dispatch);

const MAX_SEEN_CACHE = 500;
const MIN_VIEW_TIME = 2000; // 2 seconds

useEffect(() => {
  dispatchRef.current = dispatch;
}, [dispatch]);

const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
  const now = Date.now();

  // 🟢 START tracking when item becomes visible
  viewableItems.forEach(({ item }) => {
    const postId = item?.id;
    if (!postId) return;

    if (
      seenPostsRef.current.has(postId) ||
      visibleSinceRef.current[postId]
    ) {
      return;
    }

    visibleSinceRef.current[postId] = now;
  });

  // 🔴 STOP tracking when item leaves view
  changed.forEach(({ item, isViewable }) => {
    const postId = item?.id;
    if (!postId) return;

    if (!isViewable && visibleSinceRef.current[postId]) {
      const startTime = visibleSinceRef.current[postId];
      const duration = now - startTime;

      if (
        duration >= MIN_VIEW_TIME &&
        !seenPostsRef.current.has(postId)
      ) {
        seenPostsRef.current.add(postId);

        // Prevent memory overflow
        if (seenPostsRef.current.size > MAX_SEEN_CACHE) {
          seenPostsRef.current.clear();
        }

        dispatchRef.current(markPostSeen(postId));
      }

      delete visibleSinceRef.current[postId];
    }
  });
}).current;

useFocusEffect(
  useCallback(() => {
    return () => {
      visibleSinceRef.current = {};
    };
  }, [])
);
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();

    Object.keys(visibleSinceRef.current).forEach((postId) => {
      const startTime = visibleSinceRef.current[postId];

      if (
        now - startTime >= MIN_VIEW_TIME &&
        !seenPostsRef.current.has(postId)
      ) {
        seenPostsRef.current.add(postId);

        dispatchRef.current(markPostSeen(postId));

        delete visibleSinceRef.current[postId];
      }
    });
  }, 1000);

  return () => clearInterval(interval);
}, []); 
useEffect(() => {
  visibleSinceRef.current = {};
}, [activeTab]);
const viewabilityConfigRef = useRef(viewabilityConfig);

const viewabilityConfigCallbackPairs = useRef([
  {
    viewabilityConfig: viewabilityConfigRef.current,
    onViewableItemsChanged,
  },
]);
const handleReport = (post,data) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  dispatch(removePostOptimistic(post.id));
 dispatch(reportPost({ postId: post.id, reason: data?.reason })); 
};

const renderPost = useCallback(
({ item }) => {
const isExpanded = expanded[item.id] || false;
const displayText =
item.content?.length > 120 && !isExpanded
? item.content.slice(0, 120) + "..."
: item.content;
 
  const category = POST_CATEGORIES.find(
  (cat) => cat.label === item.categoryName
);
return (
<View style={[styles.postContainer, { borderBottomColor: colors.textSecondary,borderBottomWidth:0.2 }]}>
{/* HEADER ROW */}
<View style={{flexDirection:'row',justifyContent:'space-between'}}>
<TouchableOpacity style={styles.headerRow} onPress={() =>
item?.user.uid === userData.uid
? navigation.navigate("Profile")
: navigation.navigate("OtherProfile", { uid: item?.user.uid })
}>
<Avatar.Image size={40} source={{ uri: item.user.avatar }} />

<View style={styles.userInfo}>
<Text allowFontScaling={false}  style={[styles.userName, { color: colors.text }]}>
{item.user.name}
</Text>
<Text allowFontScaling={false}  style={[styles.timeAgo, { color: colors.textSecondary }]}>
{timeAgo(item.createdAt)}
</Text>
{category && (
  <View
    style={[
      styles.categoryBadge,
      {
        backgroundColor: category.color + "18",
      },
    ]}
  >
    <Icon
      name={category.icon}
      size={14}
      color={category.color}
    />

    <Text
      style={[
        styles.categoryBadgeText,
        {
          color: category.color,
        },
      ]}
    >
      {category.label}
    </Text>
  </View>
)}
</View>



</TouchableOpacity>
<TouchableOpacity onPress={()=>{
  setReportVisible(true)
  setPostToReport(item)
}}>
 <MDIcon name="dots-three-vertical" color={colors.primary} size={18} />

</TouchableOpacity>

</View>

{/* TEXT CONTENT */}
{item.content && (
<Hyperlink
linkStyle={{
color: colors.link,
textDecorationLine: "underline",
}}
onPress={(url) => Linking.openURL(url)}
>
<Text allowFontScaling={false} 
style={[styles.postContent, { color: colors.text }]}
>
{displayText}
</Text>
</Hyperlink>
)}

{/* READ MORE */}
{item.content?.length > 120 && (
<TouchableOpacity
onPress={() =>
setExpanded((prev) => ({
...prev,
[item.id]: !isExpanded,
}))
}
>
<Text allowFontScaling={false}  style={[styles.readMore, { color: colors.primary }]}>
{isExpanded ? "Read less" : "Read more"}
</Text>
</TouchableOpacity>
)}
{item?.poll && (
  <PollCard item={item} colors={colors} isVoted={item?.isVoted}/>
)}
{/* IMAGE */}
{item.imageUrl && (
<FullWidthImage uri={item.imageUrl} resizeMode="contain" />
)}

{/* ACTION BAR */}
<View style={styles.actionRow}>
{/* LIKE */}
<TouchableOpacity
style={styles.actionItem}
onPress={() => handleLike(item)}
>
<Icon
name={item.likedByCurrentUser ? "star" : "star-outline"}
size={26}
color={
item.likedByCurrentUser
? colors.primary
: colors.textSecondary
}
/>
<Text allowFontScaling={false}  style={[styles.actionText, { color: colors.text }]}>
{item.totalLikes}
</Text>
</TouchableOpacity>

{/* COMMENTS */}
<TouchableOpacity
style={styles.actionItem}
onPress={() =>
navigation.navigate("Comments", {
postId: item.id,
creatorId: item.userId,
})
}
>

<Text allowFontScaling={false}  style={[styles.actionText, { color: colors.text,fontSize:16 }]}>
Reply
</Text>
</TouchableOpacity>

{/* SHARE */}
<View style={styles.actionItem}>
  <Icon
    name="visibility"
    size={20}
    color={colors.textSecondary}
  />
  <Text
    allowFontScaling={false}
    style={[styles.actionText, { color: colors.textSecondary }]}
  >
    {item.totalViews || 0}
  </Text>
</View>

{/* BOOKMARK */}
<TouchableOpacity
style={[{alignSelf:'flex-end',marginLeft:'auto'}]}
onPress={() => handleBookmark(item)}
>
<SIcon
name={
item.bookmarkedByCurrentUser ? "pin" : "pin"
}
size={16}
color={
item.bookmarkedByCurrentUser
? colors.primary
: colors.textSecondary
}
/>
</TouchableOpacity>
</View>
</View>
);
},
[colors, expanded, handleBookmark, handleLike, navigation, userData.uid]
);
 const gradientColors =
    mode === "midnight"
      ? ["#1B1B3A", "#0B0B28"]
      : mode === "dark"
      ? ["#141414", "#070707"]
      : ["#E3F2FD", "#BBDEFB"];

      

return (
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background,paddingHorizontal:6 }} edges={['top']}>
{/* COLLAPSIBLE HEADER CONTAINER */}
   
<Animated.View
style={[
styles.headerContainer,
{ transform: [{ translateY: headerTranslateY },] },
{ backgroundColor: colors.background}
]}
>
{/* HEADER */}
<Animated.View style={{ opacity: headerOpacity, height: HEADER_MAX+insets.top}}>
<CustomHeader activeTab={activeTab} setActiveTab={setActiveTab} />
</Animated.View>

{/* TABS - always visible, never collapses */}

<View style={{ height: TABS_HEIGHT,borderRadius:20,paddingVertical:10 }}>
    <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
       
      >
<CustomHeaderTabs
  tabs={["Post","Trending"]}
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  colors={colors}
  headerAnim={headerAnim} // 👈 ADD THIS
/>
</LinearGradient>
</View>

</Animated.View>


{/* MAIN CONTENT */}
<PanGestureHandler onHandlerStateChange={onSwipe} 
 activeOffsetX={[-20, 20]}   // require horizontal movement
  failOffsetY={[-10, 10]}     // fail if vertical scroll
  >

<View style={{ flex: 1 }}>
{/* POST LIST */}
<Animated.View
  style={{ flex: 1, display: activeTab === "Post" ? "flex" : "none" }}
>
  {isFetchingRecent && recentPosts.length === 0 ? (
    <View style={{ flex: 1, paddingTop: HEADER_MAX + TABS_HEIGHT +50 }}>
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} /> 
  </View>
</View>
  ) : recentError && recentPosts.length === 0 ? (
    <View
  style={{
    flex: 1,
    paddingTop: HEADER_MAX + TABS_HEIGHT + 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  }}
>
  <View
    style={{
      alignItems: "center",
      padding: 24,
      borderRadius: 20,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      width: "100%",
      maxWidth: 320,
    }}
  >
    {/* Icon */}
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary + "20",
        marginBottom: 16,
      }}
    >
      <MDIcon name="warning" size={28} color={colors.primary} />
    </View>

    {/* Title */}
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 6,
      }}
    >
      Something went wrong
    </Text>

    {/* Subtitle */}
    <Text
      style={{
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
      }}
    >
      We couldn’t load recent posts. Try again.
    </Text>

    {/* Button */}
    <TouchableOpacity
      onPress={() => dispatch(fetchRecentPosts())}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 999,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        Retry
      </Text>
    </TouchableOpacity>
  </View>
</View>

  ) : (
  <FlatList
ref={recentListRef}
data={recentPosts}
keyExtractor={(item) => item.id}
contentContainerStyle={{
paddingTop: HEADER_MAX + TABS_HEIGHT,
paddingBottom: 100,
}}
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
onEndReached={loadMorePosts}
onScroll={Animated.event(
[{ nativeEvent: { contentOffset: { y: scrollY } } }],
{
useNativeDriver: false,
listener: (event) => {
const currentY = event.nativeEvent.contentOffset.y;

scrollPositions.current[activeTab] = currentY;

const diff = currentY - lastScrollY.current;

// User scrolls DOWN → hide header
if (diff > 10 && currentY >0) {
Animated.timing(headerAnim, {
toValue: 1,
duration: 10,
useNativeDriver: true,
}).start();
}

// User scrolls UP → show header
if (diff < -30) {
Animated.timing(headerAnim, {
toValue: 0,
duration: 10,
useNativeDriver: true,
}).start();
}

lastScrollY.current = currentY;
},
} 
)}  
scrollEventThrottle={16}
renderItem={renderPost}
showsVerticalScrollIndicator={false}
viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current} 

/>
  )}
</Animated.View>

<Animated.View
  style={{ flex: 1, display: activeTab === "Trending" ? "flex" : "none" }}
>
  {isFetchingTrending && trendingPosts.length === 0 ? (
    <View style={{ flex: 1, paddingTop: HEADER_MAX + TABS_HEIGHT +50 }}>
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} /> 
  </View>
  </View>
  ) : trendingError && trendingPosts.length === 0 ? (
    <View
  style={{
    flex: 1,
    paddingTop: HEADER_MAX + TABS_HEIGHT + 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  }}
>
  <View
    style={{
      alignItems: "center",
      padding: 24,
      borderRadius: 20,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      width: "100%",
      maxWidth: 320,
    }}
  >
    {/* Icon */}
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary + "20",
        marginBottom: 16,
      }}
    >
      <MDIcon name="warning" size={28} color={colors.primary} />
    </View>

    {/* Title */}
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 6,
      }}
    >
      Something went wrong
    </Text>

    {/* Subtitle */}
    <Text
      style={{
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
      }}
    >
      We couldn’t load trending posts. Try again.
    </Text>

    {/* Button */}
    <TouchableOpacity
      onPress={() => dispatch(fetchTrendingPosts())}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 999,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        Retry
      </Text>
    </TouchableOpacity>
  </View>
</View>
  ) : (
    <FlatList
ref={trendingListRef}
data={trendingPosts}
keyExtractor={(item) => item.id}
contentContainerStyle={{
paddingTop: HEADER_MAX + TABS_HEIGHT,
paddingBottom: 100,
}}
onEndReached={loadMorePosts}
viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
onScroll={Animated.event(
[{ nativeEvent: { contentOffset: { y: scrollY } } }],
{
useNativeDriver: false,
listener: (event) => {
const currentY = event.nativeEvent.contentOffset.y;

scrollPositions.current[activeTab] = currentY;

const diff = currentY - lastScrollY.current;

// User scrolls DOWN → hide header
if (diff > 15 && currentY > 0) {
Animated.timing(headerAnim, {
toValue: 1,
duration: 10,
useNativeDriver: true,
}).start();
}

// User scrolls UP → show header
if (diff < -30) {
Animated.timing(headerAnim, {
toValue: 0,
duration: 10,
useNativeDriver: true,
}).start();
}

lastScrollY.current = currentY;
},
}
)}
showsVerticalScrollIndicator={false}
scrollEventThrottle={16}
renderItem={renderPost}  
/>
  )}
</Animated.View>
  {userData?.isUserVerified === false &&
      userData?.userType === "user" && (
        <VerificationOverlay
          onVerify={() => navigation.navigate("Verification")}
        />
      )}
</View>
</PanGestureHandler>

{/* FAB */}


<ReportModal
  visible={reportVisible}
  onClose={() => setReportVisible(false)}
  onSubmit={(data) => {
   
      handleReport(postToReport,data)
      setReportVisible(false)
  }}
/>
</SafeAreaView>
);
};

const styles = StyleSheet.create({
headerContainer: {
position: "absolute",
left: 0,
right: 0,
top: 0,
zIndex: 20,

},
tweetContainer: {
flexDirection: "row",   
paddingVertical: 8,
paddingRight: 6,
marginVertical: 6,
marginHorizontal:8,
borderBottomWidth: 0.2,
paddingHorizontal:8,


},

/* LEFT COLUMN (avatar + thread line) */
threadColumn: {
width: 50,
alignItems: "center",
},

tweetAvatar: {
width: 36,
height: 36,
borderRadius: 18,
marginBottom: 4,
},

threadLine: {
width: 1,
flex: 1,
borderWidth:0,

marginTop: 4,
marginBottom:4
},

/* RIGHT CONTENT */
tweetContentSection: {
flex: 1,
marginLeft:4
},

tweetHeader: {
flexDirection: "row",
alignItems: "center",
},

tweetName: {
fontWeight: "700",
fontSize: 15,
},

tweetTime: {
marginLeft: 6,
fontSize: 13,
fontWeight: "400",
},

tweetTagline: {
fontSize: 12,
marginTop: -2,
marginBottom: 4,
},

tweetText: {
marginTop: 4,
fontSize: 16,
lineHeight:22,
fontWeight: "600",
fontFamily: "Inter",

},
postContent: {
marginVertical: 8,

fontWeight: "700",
fontSize: 15,
lineHeight: 21,
},
readMore: {
marginTop: 4,
fontSize: 13,
fontWeight: "600",
},

/* ACTION ROW */
tweetActionsRow: {
flexDirection: "row",
alignItems: "center",
marginTop: 12,
},

tweetAction: {
flexDirection: "row",
alignItems: "center", 
marginRight: 18,
},

tweetActionText: {
marginLeft: 6,
fontSize: 16,
fontWeight: "600",
},

fab: {
position: "absolute",  
bottom: 130,
right: 20,
zIndex: 100,
paddingVertical:10,
},

/* POST STYLE */
postContainer: {
paddingVertical: 14,
paddingHorizontal: 16,
borderBottomWidth: 1,
},

headerRow: {
flexDirection: "row",
alignItems: "center",
marginBottom: 6,
},
userInfo: {
marginLeft: 10,

},
userName: { fontSize: 15, fontWeight: "600" },
userTagline: { fontSize: 12, marginTop: 1 },
timeAgo: { fontSize: 12 },

postContent: {
marginTop: 6,
fontSize: 16,
lineHeight: 22,
fontWeight: 600,
fontFamily: "Inter",
},

readMore: {
fontSize: 14,
marginTop: 4,
fontWeight: "600",
},

/* ACTION BAR */
actionRow: {
flexDirection: "row",
alignItems: "center",
marginTop: 12,
},
actionItem: {
flexDirection: "row",
alignItems: "center",
marginRight: 20,
},
actionText: {
fontSize: 13,
marginLeft: 6,
},
fabWrapper: {
position: "absolute",
right: 16,
bottom: 130,
},

fab: {
flexDirection: "row",
alignItems: "center",
paddingHorizontal: 16,
height:46,
borderRadius: 26,
shadowColor: "#3B82F6",
shadowOpacity: 0.25,
shadowRadius: 10,
elevation: 6,

},
categoryBadge: {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 14,
  marginTop: 4,
  gap: 4,
},

categoryBadgeText: {
  fontSize: 11,
  fontWeight: "700",
},

fabText: {
color: "#fff",
fontSize: 15,
fontWeight: "600",
marginLeft: 8,
},
});

export default HomeScreenUser;