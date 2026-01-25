import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  View,
  BackHandler,
  TouchableOpacity,
  Image,
} from "react-native";
import { Button, Snackbar, TextInput as PaperInput } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import firestore, { FieldValue, serverTimestamp } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Logo from "../assets/otp.png";

const OTPVerificationPage = ({ route, navigation }) => {
  const { colors } = useTheme();
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const timerRef = useRef(null);
  const inputRefs = useRef([]);
  const { mobile, countryCode, confirmation } = route.params;

  // Disable back navigation
  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // Auto-detect user sign-in (auto-verification)
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        await handleFirestoreWrite(user);
        // navigation.replace("ProfessionSelectPage");
      }
    });
    return unsubscribe;
  }, []);

  // Timer for resend
  useEffect(() => {
    setCanResend(false);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [confirmation]);

  const handleFirestoreWrite = async (user) => {
    try {
      const { uid, phoneNumber } = user;
      const userDoc = await firestore().collection("users").doc(uid).get();
      if (!userDoc.exists()) {
        await firestore().collection("users").doc(uid).set({
          uid,
          phoneNumber,
          isUserVerified:false,
          userType:'user',
          createdAt: FieldValue.serverTimestamp(),
        });

       await firestore().collection("notifications").add({
          notificationFrom: "ADMIN",
          notificationTo: uid,
          notificationType: "WELCOME",
          notificationText: "Welcome to Ahead!",
          comment: "User registered successfully.",
          createdOn: FieldValue.serverTimestamp(),
          status: "UNREAD",
        });
      }
    } catch (err) {
      console.error("Firestore write error:", err);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setErrorMessage("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await confirmation.confirm(otp);
      await handleFirestoreWrite(userCredential.user);
      setLoading(false);
      // navigation.replace("ProfessionSelectPage");
    } catch (err) {
      console.error("OTP verification error:", err);
      setLoading(false);
      setErrorMessage("Invalid or expired OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setLoading(true);
      const phoneProvider = new auth.PhoneAuthProvider();
      const newConfirmation = await phoneProvider.verifyPhoneNumber(`${countryCode}${mobile}`, true);
      route.params.confirmation = newConfirmation;
      setLoading(false);
      setErrorMessage("OTP resent successfully!");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setLoading(false);
      setErrorMessage("Failed to resend OTP. Please try again.");
    }
  };

  const handleBackToLogin = () => navigation.replace("Loginpage");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
         <View style={styles.bgContainer}> 
              <LinearGradient
                colors={["#EEF6FF", "#FFFFFF"]}
                style={StyleSheet.absoluteFill}
              />
               <View style={styles.squareTopLeft} />
                    <View style={styles.squareRight} />
                    <View style={styles.squareBottomLeft} />
         <View style={styles.logoContainer}>
                      <Image source={Logo} style={styles.logo} resizeMode="contain" />
                    </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 6-digit code sent to {countryCode} {mobile}
          </Text>

          {/* Only show OTP input if confirmation exists */}
          {confirmation && (
            <View style={styles.otpContainer}>
              {otpDigits.map((digit, index) => (
                <PaperInput
                  key={index}
                  mode="outlined"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={[styles.otpBox, { borderColor: colors.primary,backgroundColor:'#EDF5FF' }]}
                  theme={{ colors: { text: 'black', primary: 'black' } }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }  
                  }}
                />
              ))}
            </View>
          )}

          
<TouchableOpacity
              disabled={ loading}
              onPress={handleVerifyOtp}
              activeOpacity={0.85}
              style={{width:'80%'}}
            >
              <LinearGradient
                colors={["#F58AC9", "#3B82F6"]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Please wait..." : "  Verify & Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          <Button
            mode="text"
            disabled={!canResend}
            onPress={handleResendOtp}
            style={{ marginTop: 16 }}
            labelStyle={{
              color: canResend ? colors.primary : colors.textSecondary,
              fontWeight: "600",
            }}
          >
            {canResend ? "Resend Code" : `Resend Code in ${timer}s`}
          </Button>

          <TouchableOpacity onPress={handleBackToLogin} style={{ marginTop: 30 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        <Snackbar
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage("")}
          duration={3000}
          style={{ backgroundColor: colors.error }}
        >
          {errorMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, marginBottom: 32, textAlign: "center", lineHeight: 22 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", width: "90%", marginBottom: 32 },
  otpBox: { width: 45, height: 55, fontSize: 20, borderRadius: 10, justifyContent: "center" },
  button: { borderRadius: 12, elevation: 2, width: "100%" },
  bgContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
     paddingHorizontal: 24, justifyContent: "center", alignItems: "center"
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
  
  logoContainer: {
    alignItems: "center",
    marginBottom: 56,
  },

  logo: {
    width: 160,
    height: 160,
  },


});

export default OTPVerificationPage;
