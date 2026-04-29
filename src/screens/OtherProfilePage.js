import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchOtherProfile, clearOtherProfile } from "../store/otherProfileSlice";
import { ActivityIndicator, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import Entypo from "react-native-vector-icons/Entypo";
import OtherProfilePosts from "../components/OtherProfilePosts";
import { clearPosts } from "../store/otherProfilePostSlice";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import BlockUserModal from "../components/BlockUserModal";
import { getChatId } from "../services/chatService";
import { removeBlockedUserPosts } from "../store/feedSlice";
import { blockUser } from "../store/userSlice";
import { PanGestureHandler, State } from "react-native-gesture-handler";
const DUMMY_PROFILE_PIC = "https://randomuser.me/api/portraits/men/75.jpg";

const OtherProfilePage = ({ navigation, route }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { uid,jobId } = route.params;
  const currentUser = auth().currentUser;
  const currentUserId = currentUser?.uid;

  const { profile: userData, loading } = useSelector((state) => state.otherProfile);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ iBlocked: false, blockedMe: false, loading: true });
const scrollRef = useRef(null);
const tabScrollRef = useRef(null);
const [tabLayouts, setTabLayouts] = useState({});

useEffect(() => {
  const layout = tabLayouts[activeTab];

  if (layout && tabScrollRef.current) {
    tabScrollRef.current.scrollTo({
      x: layout.x - 40, // offset so it's not stuck to edge
      animated: true,
    });
  }
}, [activeTab]);
  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        if (!currentUserId || !uid) return;
        const [myBlock, theirBlock] = await Promise.all([
          firestore().collection("users").doc(currentUserId).collection("blockedUsers").doc(uid).get(),
          firestore().collection("users").doc(uid).collection("blockedUsers").doc(currentUserId).get()
        ]);
        setBlockStatus({ iBlocked: myBlock.exists(), blockedMe: theirBlock.exists(), loading: false });
      } catch (err) {
        setBlockStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    checkBlockStatus();
  }, [uid, currentUserId]);

  useEffect(() => {
    let unsubscribe;
    if (uid && currentUserId && uid !== currentUserId) {
      unsubscribe = firestore().collection("follows").doc(`${currentUserId}_${uid}`)
        .onSnapshot((doc) => setIsFollowing(doc.exists));
    }
    return () => unsubscribe && unsubscribe();
  }, [uid, currentUserId]);

  useEffect(() => {
    if (uid) dispatch(fetchOtherProfile(uid));
    return () => {
      dispatch(clearOtherProfile());
      dispatch(clearPosts());
    };
  }, [dispatch, uid]);

  const handleFollowToggle = async () => {
    if (!currentUserId || uid === currentUserId) return;
    const followId = `${currentUserId}_${uid}`;
    const followRef = firestore().collection("follows").doc(followId);
    try {
      if (isFollowing) {
        await followRef.delete();
        const notifSnap = await firestore().collection("notifications")
          .where("notificationFrom", "==", currentUserId)
          .where("notificationTo", "==", uid)
          .where("notificationType", "==", "FOLLOW").get();
        const batch = firestore().batch();
        notifSnap.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } else {
        await followRef.set({ followerId: currentUserId, followingId: uid, followedAt: FieldValue.serverTimestamp() });
        await firestore().collection("notifications").add({
          notificationFrom: currentUserId,
          notificationTo: uid,
          notificationType: "FOLLOW",
          notificationText: `You have a new follower.`,
          createdOn: FieldValue.serverTimestamp(),
          read: false,
          status: "UNREAD"
        });
      }
    } catch (error) { console.log(error); }
  };

  const handleUnblock = async () => {
    try {
      const batch = firestore().batch();
      batch.delete(firestore().collection("users").doc(currentUserId).collection("blockedUsers").doc(uid));
      batch.delete(firestore().collection("users").doc(uid).collection("blockedBy").doc(currentUserId));
      await batch.commit();
      setBlockStatus({ iBlocked: false, blockedMe: false, loading: false });
    } catch (err) { console.log(err); }
  };
const handleSwipe = (event) => {
  const { translationX, state } = event.nativeEvent;

  if (state === State.END) {
    const currentIndex = TABS.indexOf(activeTab);

    if (translationX < -50 && currentIndex < TABS.length - 1) {
      // Swipe Left → Next Tab
      setActiveTab(TABS[currentIndex + 1]);
    } else if (translationX > 50 && currentIndex > 0) {
      // Swipe Right → Previous Tab
      setActiveTab(TABS[currentIndex - 1]);
    }
  }
};
  if (!blockStatus.loading && blockStatus.blockedMe) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="eye-off" size={50} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorText, { color: colors.text }]}>Profile not found</Text>
        <Button mode="text" onPress={() => navigation.goBack()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  if (loading || !userData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const TABS = userData?.userType === "company" ? ["About"] : ["Posts", "Experience", "Education", "Certificates"];
const data =
  activeTab === "Experience"
    ? userData.experiences
    : activeTab === "Education"
    ? userData.education
    : userData.certifications;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Premium Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {uid !== currentUserId && !blockStatus.iBlocked && (
            <>
              <TouchableOpacity
                onPress={handleFollowToggle}
                style={[styles.followBtn, { backgroundColor: isFollowing ? colors.surface : colors.primary }]}
              >
                <Text style={{ color: isFollowing ? colors.text : "#fff", fontWeight: "700", fontSize: 13 }}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Message", {
                  otherUserId: uid,
                  otherUserName: userData.name,
                  otherUserAvatar: userData.profilePic,
                  chatId: getChatId(currentUserId, uid),
                  jobId:jobId
                })}
                style={[styles.iconBtn, { marginHorizontal: 8 }]}
              >
                <Feather name="message-circle" size={22} color={colors.text} />
              </TouchableOpacity>
            </>
          )}

          {blockStatus.iBlocked && (
            <TouchableOpacity onPress={handleUnblock} style={[styles.followBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Unblock</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setBlockVisible(true)} style={styles.iconBtn}>
            <Entypo name="dots-three-vertical" color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.imageContainer, { borderColor: colors.primary + '33' }]}>
            <Image source={{ uri: userData?.profilePic || DUMMY_PROFILE_PIC }} style={styles.profilePic} />
          </View>

          <Text allowFontScaling={false} style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
          <Text allowFontScaling={false} style={[styles.username, { color: colors.primary }]}>@{userData.username}</Text>

          {!blockStatus.iBlocked && (
            <>
              {userData.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{userData.bio}</Text>}
              
                 {userData.value ? (
                       <View style={[styles.rankBadge, { backgroundColor: colors.primary, shadowColor: colors.accent }]}>
                         <Text allowFontScaling={false} style={[styles.rankTxt,{color: colors.background}]}>{userData.value}</Text>
                       </View>
                     ) : null}
  
              {userData.linkBtn && (
                <Button
                  mode="contained-tonal"
                  onPress={() => Linking.openURL(`https://linkedin.com/in/${userData.username}`)}
                  style={styles.linkBtn}
                  icon="logo-linkedin"
                >
                  View Professional Profile
                </Button>
              )}
            </>
          )}
        </View>

        {/* Tabs & Content */}
        {!blockStatus.iBlocked && (
          <>
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface + '40' }]}>
                   <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               ref={tabScrollRef}
             >  
                {TABS.map((tab) => (
                       <TouchableOpacity
                   key={tab}
                   onLayout={(e) => {
                     const { x, width } = e.nativeEvent.layout;
                     setTabLayouts((prev) => ({
                       ...prev,
                       [tab]: { x, width },
                     }));
                   }}
                   style={[
                     styles.tab,
                     activeTab === tab && { borderBottomColor: colors.primary },
                   ]}
                   onPress={() => setActiveTab(tab)}
                 >
                    <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
<PanGestureHandler onHandlerStateChange={handleSwipe}  activeOffsetX={[-20, 20]} // only trigger when clear horizontal swipe
  failOffsetY={[-10, 10]}     // fail if vertical movement happens
>
  <View style={styles.content}>
    {activeTab === "Posts" && (
      <OtherProfilePosts navigation={navigation} otherUserId={uid} />
    )}

    {["Experience", "Education", "Certificates"].includes(activeTab) && (
      <View style={styles.timelineContainer}>
        {data && data.length > 0 ? (
          data.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.timelineCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {item.title || item.degree || item.courseName}
                </Text>
                <Text style={[styles.cardOrg, { color: colors.primary }]}>
                  {item.org || item.institution || item.issuePlace}
                </Text>
                <Text
                  style={[styles.cardDate, { color: colors.textSecondary }]}
                >
                  {item.from
                    ? `${item.from} — ${item.to}`
                    : item.issueDate}
                </Text>
              </View>
            </View>
          ))
        ) : (
          // 👇 EMPTY STATE
          <View style={styles.emptyContainer}>
            <Feather
              name="inbox"
              size={40}
              color={colors.textSecondary}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {activeTab} added yet
            </Text>
          </View>
        )}
      </View>
    )}
  </View>
</PanGestureHandler>

          </>
        )}
      </ScrollView>

      <BlockUserModal
        visible={blockVisible}
        onClose={() => setBlockVisible(false)}
        onConfirm={() => {
          dispatch(removeBlockedUserPosts(uid));
          dispatch(blockUser({ blockedUserId: uid }));
          setBlockStatus({ iBlocked: true, blockedMe: false, loading: false });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, justifyContent: 'center' },
  heroSection: { alignItems: "center", paddingHorizontal: 24, paddingTop: 10 },
  imageContainer: { padding: 4, borderWidth: 2, borderRadius: 70, marginBottom: 16 },
  profilePic: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  username: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  bio: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 25 },
  linkBtn: { borderRadius: 12, width: '100%', marginBottom: 10 },
  tabsContainer: { marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  tab: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15, fontWeight: "700" },
  content: { padding: 16 },
  timelineContainer: { paddingLeft: 4 },
  timelineItem: { flexDirection: "row" },
  timelineLeft: { alignItems: 'center', marginRight: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#eee' },
  timelineCard: { flex: 1, padding: 16, borderRadius: 16, marginBottom: 20, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardOrg: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  cardDate: { fontSize: 12, opacity: 0.7 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, fontWeight: "700", marginTop: 8 },
    dob: { fontSize: 13, marginBottom: 8 },
     rankBadge: {
  
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  rankTxt: {
    fontSize: 13,
    fontWeight: "600",
  
    letterSpacing: 1,
  },
  emptyContainer: {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 40,
},
emptyText: {
  fontSize: 14,
  fontWeight: "500",
},
});

export default OtherProfilePage; 