// navigation/TabNavigator.js
import React, { useEffect } from "react";
import { View, Text, Platform, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Feather from "react-native-vector-icons/Feather";
import AiLearnIcon from "../assets/Ai.png";
import Feed from "../assets/feed.png";
import News from "../assets/news.png";
import Inbox from "../assets/Message.png";
import Career from "../assets/Career.png";





import { useTheme } from "../context/ThemeContext";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import HomeScreen from "../screens/HomeScreen";
import JobScreen from "../screens/JobScreen";
import HireScreen from "../screens/HireScreen";
import ChatScreen from "../screens/ChatScreen";
import ChatScreenCompany         from "../screens/ChatScreenCompany";

import GroupScreen from "../screens/GroupScreen";
import PostJobScreen from "../screens/PostJobScreen";
import StudyScreen from "../screens/StudyScreen";
import NewsScreen from "../screens/NewsScreen";

import { Circle } from "react-native-svg";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useTheme();
  const { user: userData } = useSelector((state) => state.user);
  const unreadCount = useSelector((state) => state.chat.unreadCount || 0);
  const insets = useSafeAreaInsets();
    
  // 🔵 ICON MAP
  const icons = {
    Feed: "home",
    News: "newspaper",
    Career: "anchor",
    Message: "envelope",
    Circle: "users",
    Home: "home",
    Job: "plus",
  };

  const screenOptions = ({ route }) => ({
    headerShown: false,

    tabBarIcon: ({ focused }) => {
      const color = focused ? colors.primary : colors.textSecondary;
 if (route.name === "Feed") {
  return (
   <Image
        source={Feed}
        style={{
          width: 26,
          height: 26,
          resizeMode: "contain",
          tintColor: color, // remove if image already colored
        }}
      />
  );
}
 if (route.name === "News") {
  return (
   <Image
        source={News}
        style={{
          width: 26,
          height: 26,
          resizeMode: "contain",
          tintColor: color, // remove if image already colored
        }}
      />
  );
}
if (route.name === "Message") {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Image
        source={Inbox}
        style={{
          width: 26,
          height: 26,
          resizeMode: "contain",
          tintColor: color,
        }}
      />

      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -10,
            backgroundColor: "red",
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              color: "#fff",
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}
 if (route.name === "Career") {
  return (
   <Image
        source={Career}
        style={{
          width: 26,
          height: 26,
          resizeMode: "contain",
          tintColor: color, // remove if image already colored
        }}
      />
  );
}
if (route.name === "Ai Assist") {
  return (
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",

        // Floating effect
        marginTop: -18,

        // iOS shadow
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 6,
        },
        shadowOpacity: 0.18,
        shadowRadius: 8,

        // Android shadow
        elevation: 10,

        // Optional subtle border
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Image
        source={AiLearnIcon}
        style={{
          width: 26,
          height: 26,
          resizeMode: "contain",
          tintColor: color, // remove if image already colored
        }}
      />
    </View>
  );
}
      return (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <FontAwesome5
            name={icons[route.name]}
            size={22}
            color={color}
            solid
          />

          {/* 🔴 Message badge */}
          {route.name === "Message" && unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -10,
                backgroundColor: "red",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text allowFontScaling={false} 
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      );
    }, 

    tabBarLabel: ({ focused }) => (
      <Text allowFontScaling={false} 
        style={{
          fontSize: 11,
          marginTop: 2,
          fontWeight:"500",
          color: focused ? colors.primary : colors.textSecondary,
        }}
      >
        {route.name}
      </Text>
    ),

    tabBarStyle: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 0,
      height: 65 + insets.bottom,
      paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
      backgroundColor: colors.surface,
      borderTopRightRadius: 18,
      borderTopLeftRadius: 18,
      borderTopWidth: 0,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
  });

  // 🔵 COMPANY USER
  if (userData?.userType === "company") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Job" component={PostJobScreen} />
        <Tab.Screen name="Message" component={ChatScreenCompany} />
      </Tab.Navigator>
    );
  }

  // 🔵 NORMAL USER
  return (
    <Tab.Navigator
    initialRouteName="Ai Assist" 
    screenOptions={screenOptions} 
    >  
      <Tab.Screen name="Feed" component={HomeScreen} />

      <Tab.Screen name="News" component={NewsScreen} />

      <Tab.Screen name="Ai Assist" component={StudyScreen} />


   

      <Tab.Screen name="Message" component={ChatScreen} />
         <Tab.Screen
        name="Career"
        component={userData?.userType === "company" ? HireScreen : JobScreen}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;