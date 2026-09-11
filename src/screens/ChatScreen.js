import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/material-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  clearChatList,
  listenToRequestedChats,
} from "../store/chatListSlice";
import auth from "@react-native-firebase/auth";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { timeAgo } from "../utils/time";
import VerificationOverlay from "../components/VerificationOverlay";

const initialLayout = { width: Dimensions.get("window").width };

const ChatScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { chats, loading } = useSelector((state) => state.chatList);
const { user: userData } = useSelector((state) => state.user);

  const currentUserId = auth().currentUser?.uid;

  const [index, setIndex] = useState(0);


  // 🔁 realtime listener
  useEffect(() => {
    if (!currentUserId) return;
    dispatch(clearChatList());
    const unsubscribe = listenToRequestedChats(currentUserId, dispatch);
    return () => unsubscribe();
  }, [dispatch, currentUserId]);

  const professionalChats = chats.filter(
  (chat) => chat.jobId && chat.status !== "REQUESTED"
);

const inboxChats = chats.filter(
  (chat) => !chat.jobId && chat.status !== "REQUESTED"
);

const requestChats = chats.filter(
  (chat) => chat.status === "REQUESTED"
);

// ✅ Unread counts
const professionalUnread = professionalChats.filter(
  (chat) =>
    chat.lastMessage?.from !== currentUserId &&
    chat.lastMessage?.status === "UNREAD"
).length;


const requestUnread = requestChats.filter(
  (chat) =>
    chat.lastMessage?.from !== currentUserId &&
    chat.lastMessage?.status === "UNREAD"
).length;

// ✅ FIXED: dynamic routes
const routes = useMemo(() => [
  { key: "inbox", title: "Inbox", count: 0 },
  { key: "professional", title: "Professional", count: professionalUnread },
  { key: "requests", title: "Requests", count: requestUnread },
], [professionalUnread, requestUnread]);

  const requestCount = requestChats.length;
const tabKey = `${professionalUnread}-${requestUnread}`;
  // 🔹 Shared render
  const renderItem = ({ item }) => {
    const lastMsg =
      typeof item.lastMessage === "string"
        ? item.lastMessage
        : item.lastMessage?.text || "No messages yet";

    const user = item.user || {};

    const isUnread =
      item.lastMessage?.from !== currentUserId &&
      item.lastMessage?.status === "UNREAD";

    return (
      <TouchableOpacity
        style={[styles.chatCard,{backgroundColor:colors.surface,borderRightWidth:1,width:'96%',}]}
        onPress={() =>
          navigation.getParent()?.navigate("Message", {
            otherUserId: user.uid,
            otherUserName: user.name,
            otherUserAvatar: user.avatar,
            chatId: item.chatId,
          })
        }
      >
        <Image
          source={
            user.avatar
              ? { uri: user.avatar }
              : require("../assets/logo_svg.png")
          }
          style={styles.avatar}
        />

        <View style={styles.chatContent}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
                fontWeight: isUnread ? "700" : "500",
              },
            ]}
          >
            {user.name || "Unknown User"}
          </Text>
          <Text
            style={[
              styles.lastMessage,
              {
                color: isUnread ? colors.text : colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {lastMsg}
          </Text>

        </View>
         <View style={{ alignItems: "flex-end" }}>
          {item.updatedAt && (
            <Text
              style={[
                styles.timestamp,
                {
                  color: isUnread
                    ? "#4B7BE5"
                    : colors.textSecondary,
                  fontWeight: isUnread ? "600" : "400",
                },
              ]}
            >
             {timeAgo( item?.updatedAt)}
            </Text>
          )}

          {/* 🔹 Unread dot */}
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderList = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.chatId}
      renderItem={renderItem}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 20,color:colors.primary }}>
          No chats found
        </Text>
      }
    />
  );

  // 🔹 Scenes
  const InboxRoute = () => renderList(inboxChats);
  const ProfessionalRoute = () => renderList(professionalChats);
  const RequestRoute = () => renderList(requestChats);
const renderScene = ({ route }) => {
  switch (route.key) {
    case "inbox":
      return renderList(inboxChats);
    case "professional":
      return renderList(professionalChats);
    case "requests":
      return renderList(requestChats);
    default:
      return null;
  }
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Header */}
      <View style={[styles.headerBar,{borderBottomColor:colors.surface}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Your Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: "column", alignItems: "center" }} onPress={() => navigation.navigate("GroupScreen")}>
          <FontAwesome5 name="users" size={20} color={colors.text} />
<Text style={[{ color: colors.text,fontSize:14,fontWeight:'600' }]}>
           Circle
          </Text>
        </TouchableOpacity>
      </View>
<View style={{ flex: 1, position: "relative" }}>
      {/* 🔥 Swipeable Tabs */}
     <TabView
  navigationState={{ index, routes }}
  renderScene={renderScene}
  onIndexChange={setIndex}
  initialLayout={initialLayout}
  style={{ padding: 10 }}
  options={{
    professional: {
      badge: () =>
        professionalUnread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {professionalUnread}
            </Text>
          </View>
        ) : null,
    },
    requests: {
      badge: () =>
        requestUnread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {requestUnread}
            </Text>
          </View>
        ) : null,
    },
  }}
  renderTabBar={(props) => (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: 8,
        marginBottom: 10,
      }}
    >
      <TabBar
        {...props}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          elevation: 0,
        }}
        indicatorStyle={{
          backgroundColor: colors.primary,
          borderRadius: 12,
        }}
        activeColor={colors.primary}
        inactiveColor={colors.textSecondary}
        tabStyle={{
          borderRadius: 12,
        }}

        // ✅ CLEAN label only (NO badge here)
        renderLabel={({ route, focused, color }) => (
          <Text
            style={{
              color,
              fontWeight: focused ? "700" : "500",
            }}
          >
            {route.title}
          </Text>
        )}
      />
    </View>
  )}
/>
 {userData?.isUserVerified === false &&
    userData?.userType === "user" && (
      <VerificationOverlay
        onVerify={() => navigation.navigate("Verification")}
      />
    )}
</View>
   
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
 
 
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginRight:20
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  badge: {
    backgroundColor: "#4B7BE5",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4B7BE5",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
  