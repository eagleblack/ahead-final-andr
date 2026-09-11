import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { pick, types } from "@react-native-documents/picker";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import Dropdown from "../components/Dropdown";
 import {styles,inProgress} from '../styles/RankUpgrade'
import RNFS from "react-native-fs";
import VerificationOverlay from "../components/VerificationOverlay";

/* ─────────────────────────────────────────
   Status: request already in progress
───────────────────────────────────────── */
const InProgressView = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={inProgress.wrap}>
      {/* Pulsing ring */}
      <Animated.View style={[inProgress.ring, { transform: [{ scale: pulse }] }]} />

      {/* Icon */}
      <View style={inProgress.iconCircle}>
        <Text style={inProgress.iconText}>⏳</Text>
      </View>

      <Text style={inProgress.heading}>Request Upgrade in Progress</Text>
      <Text style={inProgress.sub}>
        Someone from our team will review your submission and get back to you
        shortly.
      </Text>

      {/* Status pill */}
      <View style={inProgress.pill}>
        <View style={inProgress.dot} />
        <Text style={inProgress.pillText}>Under Review</Text>
      </View>

      {/* Divider */}
      <View style={inProgress.divider} />

      <Text style={inProgress.note}> 
        This usually takes 24 – 48 hours. You'll receive a notification once
        your rank is updated.
      </Text>
    </View>
  );
};

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
const UpgradeRankPage = ({ navigation }) => {
  const { colors } = useTheme();
  const { user: userData } = useSelector((state) => state.user);

  const [rank, setRank] = useState(null);
  const [file, setFile] = useState(null);
  const [jobOptions, setJobOptions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  /* Fetch dropdown options + check existing reverification status */
  useEffect(() => {
    console.log(userData)
    const unsubOptions = firestore()
      .collection("selection_options")
      .doc("default")
      .onSnapshot((doc) => {
        if (doc.exists) {
          setJobOptions(doc.data()?.jobOptions || []);
        }
      });

    const unsubStatus = firestore()
      .collection("users")
      .doc(userData?.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setAlreadyRequested(!!data?.reverificationRequest);
        }
        setCheckingStatus(false);
      });

    return () => {
      unsubOptions();
      unsubStatus();
    };
  }, [userData?.uid]);

  /* Pick file using @react-native-documents/picker */
const pickFile = async () => {
  try {
    const [res] = await pick({
      type: [types.images, types.pdf],
      allowMultiSelection: false,
    });

    let filePath = res.uri;

    // 🔥 Fix for Android content://
    if (res.uri.startsWith("content://")) {
      const destPath = `${RNFS.CachesDirectoryPath}/${res.name}`;
      await RNFS.copyFile(res.uri, destPath);
      filePath = `file://${destPath}`;
    }

    setFile({
      ...res,
      uri: filePath,
    });

  } catch (err) {
    if (err?.code !== "OPERATION_CANCELED") {
      console.log("Pick error:", err);
    }
  }
};

  /* Upload file to Firebase Storage, then save Firestore fields */
  const handleSubmit = async () => {
    if (!rank || !file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const ext = file.name?.split(".").pop() ?? "jpg";
      const storagePath = `reverification_certificates/${userData?.uid}_${Date.now()}.${ext}`;
      const ref = storage().ref(storagePath);

      const task = ref.putFile(
        Platform.OS === "ios"
          ? decodeURIComponent(file.uri.replace("file://", ""))
          : file.uri
      );

      task.on("state_changed", (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(pct);
      });

      await task;
      const downloadUrl = await ref.getDownloadURL();

      await firestore().collection("users").doc(userData?.uid).update({
        reverificationRequest: true,
        reverificationCertificateUrl: downloadUrl,
        reverificationRequestedAt: firestore.FieldValue.serverTimestamp(),
        reverificationRank: rank,
      });

      // alreadyRequested will flip via the onSnapshot listener above
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* ── Render ── */
  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.safe}> 
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#4F8EF7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Background decoration ── */}
        <LinearGradient
          colors={["#EBF3FF", "#F6F9FF", "#FFFFFF"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.blobTL} />
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />

        {/* ── Back button ── */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>RANK UPGRADE</Text>
            </View>
          </View>
          <Text style={styles.title}>Upgrade{"\n"}Your Rank</Text>
          <Text style={styles.subtitle}>
            Submit proof to unlock higher status
          </Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {alreadyRequested ? (
            <InProgressView />
          ) : (
            <>
              {/* Rank selector */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Select Rank</Text>
                <Dropdown
                  label="Rank"
                  value={rank}
                  options={jobOptions}
                  onSelect={setRank}
                  placeholder="Choose rank to upgrade"
                  navigation={navigation}
                  buttonStyle={styles.dropdownBtn}
                  textStyle={[
                    styles.dropdownTxt,
                    rank && { color: "#1A202C" },
                  ]}
                />
              </View>

              {/* Upload */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Upload Certificate</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    file && styles.uploadBoxFilled,
                  ]}
                  onPress={pickFile}
                  activeOpacity={0.75}
                >
                  {file ? (
                    <View style={styles.fileRow}>
                      {/* Icon */}
                      <View style={styles.fileIcon}>
                        <Text style={styles.fileIconText}>
                          {file.name?.endsWith(".pdf") ? "📄" : "🖼️"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {file.size
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : "Ready to upload"}
                        </Text>
                      </View>
                      {/* Change */}
                      <TouchableOpacity
                        onPress={pickFile}
                        style={styles.changeBtn}
                      >
                        <Text style={styles.changeTxt}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadEmpty}>
                      <View style={styles.uploadIconCircle}>
                        <Text style={styles.uploadIcon}>↑</Text>
                      </View>
                      <Text style={styles.uploadLabel}>
                        Tap to upload
                      </Text>
                      <Text style={styles.uploadHint}>
                        Image or PDF supported
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Upload progress bar */}
              {uploading && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressTxt}>
                    Uploading… {uploadProgress}%
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!rank || !file || uploading) && styles.submitDisabled,
                ]}
                disabled={!rank || !file || uploading}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitTxt}>Submit Request</Text>
                    <Text style={styles.submitArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Your submission will be reviewed within 24–48 hours.
              </Text>
            </>
          )}
             {userData?.isUserVerified === false &&
    userData?.userType === "user" && (
      <VerificationOverlay
        onVerify={() => navigation.navigate("Verification")}
      />
    )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpgradeRankPage;
