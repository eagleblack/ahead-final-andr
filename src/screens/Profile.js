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
import { fetchUser } from "../store/userSlice";
import { ActivityIndicator, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialDesignIcons from "react-native-vector-icons/Feather";
import UserPosts from "../components/UserPosts";
import { useNavigation } from "@react-navigation/native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Feather from "react-native-vector-icons/Feather";

const DUMMY_PROFILE_PIC = "https://randomuser.me/api/portraits/men/75.jpg";

const ProfilePage = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { user: userData, loading } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("Posts");
const scrollRef = useRef(null);
const [tabLayouts, setTabLayouts] = useState({});
const tabScrollRef = useRef(null);
  useEffect(() => {
    if (!userData) dispatch(fetchUser());
  }, [dispatch]);

  useEffect(() => {
    if (userData?.userType === "company" && activeTab !== "About") {
      setActiveTab("About");
    }
  }, [userData]);
useEffect(() => {
  const layout = tabLayouts[activeTab];

  if (layout && tabScrollRef.current) {
    tabScrollRef.current.scrollTo({
      x: layout.x - 40, // offset so it's not stuck to edge
      animated: true,
    });
  }
}, [activeTab]);
  if (loading || !userData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const TABS = userData?.userType === "company" 
    ? ["About"] 
    : ["Posts", "Experience", "Education", "Certificates"];

  const experiences = (userData.experiences || []).map(e => ({ ...e, type: "experience" }));
  const education = (userData.education || []).map(e => ({ ...e, type: "education" }));
  
  const sortedExperiences = experiences.sort((a, b) => 
    new Date(b.to === "Present" ? Date.now() : b.to) - new Date(a.to === "Present" ? Date.now() : a.to)
  );
const handleSwipe = (event) => {
  const { translationX, state } = event.nativeEvent;

  if (state === State.END) {
    const currentIndex = TABS.indexOf(activeTab);

    if (translationX < -50 && currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    } else if (translationX > 50 && currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }

    // 🔥 force scroll reset immediately
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }
};  
const data =
  activeTab === "Experience"
    ? userData.experiences
    : activeTab === "Education"
    ? userData.education
    : userData.certifications;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Premium Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => userData?.userType === "company" ? navigation.navigate("EditCompProfilePage") : navigation.navigate("EditProfilePage")}
            style={[styles.iconBtn, { marginRight: 12 }]}
          >
            <Icon name="pencil-sharp" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconBtn}>
            <MaterialDesignIcons name="more-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} >
        {/* Profile Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.imageContainer, { borderColor: colors.primary + '33' }]}>
            <Image
              source={{ uri: userData?.profilePic || DUMMY_PROFILE_PIC }}
              style={styles.profilePic}
            />
          </View>

          <Text allowFontScaling={false} style={[styles.name, { color: colors.text }]}>
            {userData.name}
          </Text>
          <Text allowFontScaling={false} style={[styles.username, { color: colors.primary }]}>
            @{userData.username}
          </Text>

          {userData.bio && (
            <Text allowFontScaling={false} style={[styles.bio, { color: colors.textSecondary }]}>
              {userData.bio}
            </Text>
          )}
  
               {userData.value ? (
            <View style={[styles.rankBadge, { backgroundColor: colors.primary, shadowColor: colors.accent }]}>
              <Text allowFontScaling={false} style={[styles.rankTxt,{color: colors.background}]}>{userData.value}</Text>
            </View>
          ) : null}
          {userData.linkBtn && (
            <Button
              mode="contained"
              onPress={() => Linking.openURL(`https://linkedin.com/in/${userData.username || "dummy"}`)}
              style={[styles.linkBtn, { backgroundColor: colors.primary }]}
              labelStyle={{ color: '#FFF', fontWeight: '700' }}
              icon="logo-linkedin"
            >
              Professional Profile
            </Button>
          )}
        </View>

        {/* Custom Premium Tabs */}
        {userData?.userType !== "company" && (
          <View style={[styles.tabsContainer, { backgroundColor: colors.surface + '50' }]}>
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
        )}

        {/* Content Area */}
      <PanGestureHandler
  onHandlerStateChange={handleSwipe}
  activeOffsetX={[-20, 20]}   // only trigger on horizontal movement
  failOffsetY={[-10, 10]}     // fail if vertical movement happens
>
          <View style={styles.content}>
            {activeTab === "Posts" && (
              <UserPosts navigation={navigation} enableDelete />
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 4 },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  imageContainer: {
    padding: 4,
    borderWidth: 2,
    borderRadius: 70,
    marginBottom: 16,
  },
  profilePic: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  username: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  bio: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  statItem: { alignItems: 'center', paddingHorizontal: 25 },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  linkBtn: { borderRadius: 12, width: '100%', elevation: 0 },
  tabsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: "700" },
  content: { padding: 20 },
  timelineContainer: { paddingLeft: 8 },
  timelineItem: { flexDirection: "row", minHeight: 100 },
  timelineLeft: { alignItems: 'center', marginRight: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: -4 },
  timelineCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  cardOrg: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  cardDate: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  cardDesc: { fontSize: 14, lineHeight: 22, opacity: 0.8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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

export default ProfilePage;