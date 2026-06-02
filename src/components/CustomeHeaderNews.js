// components/CustomHeader.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import Icon from "react-native-vector-icons/Ionicons";
import FIcon from "react-native-vector-icons/FontAwesome5";


import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
//import HeaderParticles from "./HeaderParticles";

const CustomHeaderNews = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { colors,theme:mode} = useTheme(); // light | dark | midnight

  const { user } = useSelector((state) => state.user);
  const unreadCount = useSelector(
    (state) => state.notifications.unreadCount || 0
  );

  /** 🎨 Gradient based on theme */
  const gradientColors =
    mode === "midnight"
      ? ["#1B1B3A", "#0B0B28"]
      : mode === "dark"
      ? ["#141414", "#070707"]
      : ["#E3F2FD", "#BBDEFB"];


  return (
    <View>
      {/* ✅ STATUS BAR */}
 

      {/* ✅ HEADER */}  
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        {/* ✨ Particles<HeaderParticles /> */}
        

        {/* LEFT */}
        <View style={styles.left}>
         

          <Text
            allowFontScaling={false}
            style={[styles.title, { color: colors.text }]}
          >
           News
          </Text>
        </View>

        {/* RIGHT */}
      
       
      </LinearGradient>
    </View>
  );
};  

export default CustomHeaderNews;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: "hidden",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  bellContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF2E63",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
});
