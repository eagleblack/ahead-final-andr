import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import CountryPicker from "react-native-country-picker-modal";
import auth from "@react-native-firebase/auth";
import Logo from "../assets/logo_bg.png";
const CALLING_CODE_TO_COUNTRY = {
  "1": "US",
  "91": "IN",
  "44": "GB",
  "49": "DE",
  "33": "FR",
  "81": "JP",
  "61": "AU",
};
const PHONE_LENGTH_BY_COUNTRY = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 11,
  DE: 11,
  FR: 9,
  JP: 10,
  AU: 9,
};

const LoginPage = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState("IN");
  const [callingCode, setCallingCode] = useState("91");
  const [mobile, setMobile] = useState("");  
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleMobileChange = (value) => {
  const hasPlus = value.trim().startsWith("+");

  // Remove non-digits AFTER checking '+'
  let digits = value.replace(/\D/g, "");

  let detectedCallingCode = null;

  // Only auto-detect country code IF '+' was present
  if (hasPlus) {
    for (let len = 1; len <= 3; len++) {
      const code = digits.slice(0, len);
      if (CALLING_CODE_TO_COUNTRY[code]) {
        detectedCallingCode = code;
        break;
      }
    }
  }

  // Auto switch country ONLY if '+<code>' was pasted
  if (
    hasPlus &&
    detectedCallingCode &&
    detectedCallingCode !== callingCode
  ) {
    const newCountry =
      CALLING_CODE_TO_COUNTRY[detectedCallingCode];

    setCountryCode(newCountry);
    setCallingCode(detectedCallingCode);

    digits = digits.slice(detectedCallingCode.length);
  }

  const maxLength =
    PHONE_LENGTH_BY_COUNTRY[countryCode] || 15;

  if (digits.length > maxLength) {
    digits = digits.slice(0, maxLength);
  }

  setMobile(digits);
};
  const handleSendOtp = async () => {
    if (mobile.length < 8) return;

    try {
      setLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(
        `+${callingCode}${mobile}`
      );
      setLoading(false);

      navigation.navigate("OTPVerificationPage", {
        mobile,
        countryCode: `+${callingCode}`,
        confirmation,
      });
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  return (
    <View style={styles.bgContainer}>
      <LinearGradient
        colors={["#EEF6FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.squareTopLeft} />
      <View style={styles.squareRight} />
      <View style={styles.squareBottomLeft} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            {/* LOGO */}
            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
            </View>

            <Text style={styles.label}>Phone number</Text>

            {/* PHONE INPUT */}
            <View style={styles.phoneInput}>
              <CountryPicker
                withFilter
                withFlag
                withCallingCode
                withEmoji
                countryCode={countryCode}
                onSelect={(c) => {
                  setCountryCode(c.cca2);
                  setCallingCode(c.callingCode[0]);
                }}
                containerButtonStyle={styles.countryBox}
              />

              <Text style={styles.countryCode}>+{callingCode}</Text>

              <TextInput
                ref={inputRef}
                placeholder="Enter your phone number"
                placeholderTextColor="#9AA4B2"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={handleMobileChange}
                style={styles.input}
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity style={styles.forgot}>
           
            </TouchableOpacity>

            <TouchableOpacity
              disabled={mobile.length < 8 || loading}
              onPress={handleSendOtp}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#F58AC9", "#3B82F6"]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Please wait..." : "Login"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginPage;



const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 56,
  },

  logo: {
    width: 160,
    height: 160,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },

  phoneInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },

  countryCode: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
  },

  forgot: {
    alignSelf: "flex-end",
    marginTop: 12,
    marginBottom: 40,
  },

  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D4ED8",
  },

  button: {
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  /* BACKGROUND SHAPES */
  squareTopLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    backgroundColor: "#EAF3FF",
    opacity: 0.6,
    borderRadius: 40,
    transform: [{ rotate: "45deg" }],
    top: -90,
    left: -110,
  },

  squareRight: {
    position: "absolute",
    width: 220,
    height: 220,
    backgroundColor: "#E6F0FF",
    opacity: 0.45,
    borderRadius: 32,
    transform: [{ rotate: "45deg" }],
    top: 150,
    right: -130,
  },

  squareBottomLeft: {
    position: "absolute",
    width: 300,
    height: 300,
    backgroundColor: "#EDF5FF",
    opacity: 0.55,
    borderRadius: 48,
    transform: [{ rotate: "45deg" }],
    bottom: -140,
    left: -160,
  },  
  countryBox: {
  flexDirection: "row",
  alignItems: "center",
  marginRight: 8,
},

});
