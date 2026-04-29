
{/* MAIN CONTENT */}
<View style={{ flex: 1 }}>
{/* POST LIST */}
<Animated.View
style={{ flex: 1, display: activeTab === "Post" ? "flex" : "none" }}
>
<FlatList
ref={recentListRef}
data={feed.recent.posts}
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
/>
</Animated.View>

{/* TRENDING LIST */}
<Animated.View
style={{ flex: 1, display: activeTab === "Trending" ? "flex" : "none" }}
>
<FlatList
ref={trendingListRef}
data={feed.trending.posts}
keyExtractor={(item) => item.id}
contentContainerStyle={{
paddingTop: HEADER_MAX + TABS_HEIGHT,
paddingBottom: 100,
}}
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
</Animated.View>

{/* NEWS LIST */}
<Animated.View
style={{ flex: 1, display: activeTab === "News" ? "flex" : "none" }}
>
<FlatList
ref={newsListRef}
data={news}
keyExtractor={(item) => item.id}
renderItem={renderNews}
contentContainerStyle={{
paddingTop: HEADER_MAX + TABS_HEIGHT/2,
}}
onEndReached={loadMoreNews}
onScroll={Animated.event(
[{ nativeEvent: { contentOffset: { y: scrollY } } }],
{
useNativeDriver: false,
listener: (event) => {
const currentY = event.nativeEvent.contentOffset.y;

scrollPositions.current[activeTab] = currentY;

const diff = currentY - lastScrollY.current;

// User scrolls DOWN → hide header
if (diff > 5 && currentY > 50) {
Animated.timing(headerAnim, {
toValue: 1,
duration: 150,
useNativeDriver: true,
}).start();
}

// User scrolls UP → show header
if (diff < -5) {
Animated.timing(headerAnim, {
toValue: 0,
duration: 150,
useNativeDriver: true,
}).start();
}

lastScrollY.current = currentY;
},
}
)}
showsVerticalScrollIndicator={false}
scrollEventThrottle={16}
pagingEnabled
snapToInterval={PAGE_HEIGHT}
snapToAlignment="start"
decelerationRate="fast"
disableIntervalMomentum={true}
/>
</Animated.View>
</View>