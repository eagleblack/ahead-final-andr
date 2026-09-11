import React from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import ThemeWrapper from "../themes/ThemeWrapper";
import VerificationOverlay from "../components/VerificationOverlay";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

const JobScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user: userData } = useSelector((state) => state.user);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ flex: 1, position: "relative" }}>
        <ThemeWrapper />

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

export default JobScreen; 