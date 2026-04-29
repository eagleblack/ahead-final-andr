// components/CustomHeaderTabs.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const TAB_LABELS = {
  Post: "Post",
  News: "NEWS ROOM",
  Trending: "Trending",
};

const CustomHeaderTabsNews = ({
  tabs = [],
  activeTab,
  setActiveTab,
  colors,
  headerAnim
}) => {
  const tabWidth = width / tabs.length;
  const insets = useSafeAreaInsets();
const radius = headerAnim
  ? headerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    })
  : 30;
  return (
   <Animated.View
  style={[
    styles.container,
    {
      backgroundColor: colors.background,
      paddingTop: insets.top > 0 ? 4 : 0,
      borderTopLeftRadius: radius, 
      borderTopRightRadius: radius,
      justifyContent: "center",
      overflow: "hidden",
      alignSelf:'center'
    },
  ]}
>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
            style={[styles.tabWrapper, { width: tabWidth }]}
          >
          
          </TouchableOpacity>
        );
      })}
    </Animated.View> 
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    
  },

  tabWrapper: {
    alignItems: "center",
    justifyContent: "center",
   
  },

  tabInner: {
    height: 36,
    minWidth: 90,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

export default CustomHeaderTabsNews;
