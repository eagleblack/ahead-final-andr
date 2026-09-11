import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

import { pick, types } from "@react-native-documents/picker";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import * as ImagePicker from "react-native-image-picker";
import RNFS from "react-native-fs";

import LinearGradient from "react-native-linear-gradient";

// ─────────────────────────────────────────────
//  PREMIUM THEMED TEXT INPUT
// ─────────────────────────────────────────────
const ThemedTextInput = ({ label, value, onChangeText, error, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  const labelAnim = useState(new Animated.Value(value ? 1 : 0))[0];

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 4] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = error
    ? "#FF6B6B"
    : focused
    ? "#C9A96E"
    : "#888";

  return (
    <View style={[premiumStyles.inputWrapper, style]}>
      <Animated.Text
        style={[
          premiumStyles.floatingLabel,
          { top: labelTop, fontSize: labelSize, color: labelColor },
        ]}
      >
        {label}
      </Animated.Text>
      <View
        style={[
          premiumStyles.inputInner,
          focused && premiumStyles.inputFocused,
          error && premiumStyles.inputError,
        ]}
      >
        <Text
          style={premiumStyles.inputText}
          onPress={() => {}}
        />
        <TextInputRaw
          style={premiumStyles.rawInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor="transparent"
          selectionColor="#C9A96E"
          {...props}
        />
      </View>
      {error && <Text style={premiumStyles.fieldError}>{error}</Text>}
    </View>
  );
};

// Use native TextInput under the hood
import { TextInput as TextInputRaw } from "react-native";

// ─────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────
const SectionHeader = ({ title, icon }) => (
  <View style={premiumStyles.sectionHeader}>
    <Text style={premiumStyles.sectionIcon}>{icon}</Text>
    <Text style={premiumStyles.sectionTitle}>{title}</Text>
    <View style={premiumStyles.sectionLine} />
  </View>
);

// ─────────────────────────────────────────────
//  GLASS CARD
// ─────────────────────────────────────────────
const GlassCard = ({ children, style }) => (
  <View style={[premiumStyles.glassCard, style]}>{children}</View>
);

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
const UserDetailsApp = ({ navigation, route }) => {
  const { colors } = useTheme();
  const label = route?.params?.label || null;
  const value = route?.params?.value || null;

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [parsingResume, setparsingResume] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // ── Resume Upload ────────────────────────────
  const uploadResume = async () => {
    try {
      const results = await pick({ type: [types.pdf] });
      if (!results?.length) return;
      setparsingResume(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const file = results[0];
      let uri = file.fileCopyUri || file.uri;
      if (!uri) throw new Error("No file URI");
      uri = decodeURI(uri);
      const path = uri.replace("file://", "");
      const base64Pdf = await RNFS.readFile(path, "base64");
      if (!base64Pdf) throw new Error("Empty file");

      const response = await fetch(
        "https://us-central1-ahead-9fb4c.cloudfunctions.net/resumeApi/resume-analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: { data: base64Pdf, name: file.name || "resume.pdf", mimeType: "application/pdf" },
          }),
        }
      );
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
      const parsed = json.data || {};
      setName(parsed.name || "");
      setDob(parsed.dob || "");
      setExperiences(parsed.experience || []);
      setEducation(parsed.education || []);
      setCertifications(parsed.certifications || []);
      setErrors({});
    } catch (err) {
      console.error("Resume upload error:", err);
    } finally {
      setparsingResume(false);
    }
  };

  // ── Pick Certificate ─────────────────────────
  const pickCertificate = async () => {
    Alert.alert("Upload Certificate", "Choose file type", [
      {
        text: "Image",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibrary({ mediaType: "photo" });
          if (result.didCancel || !result.assets?.length) return;
          const file = result.assets[0];
          setCertificateFile({
            uri: file.uri,
            name: file.fileName || `cert_${Date.now()}.jpg`,
            type: file.type || "image/jpeg",
          });
          setErrors((prev) => ({ ...prev, certificate: null }));
        },
      },
      {
        text: "PDF",
        onPress: async () => {
          try {
            const res = await pick({ type: [types.pdf] });
            if (!res?.length) return;
            const file = res[0];
            let uri = file.fileCopyUri || file.uri;
            if (!uri) throw new Error("No file URI");
            uri = decodeURI(uri);
            const path = uri.replace("file://", "");
            const newPath = `${RNFS.DocumentDirectoryPath}/${Date.now()}_${file.name}`;
            await RNFS.copyFile(path, newPath);
            setCertificateFile({
              uri: `file://${newPath}`,
              name: file.name || `cert_${Date.now()}.pdf`,
              type: "application/pdf",
            });
            setErrors((prev) => ({ ...prev, certificate: null }));
          } catch (e) {
            console.log("PDF Pick Error:", e);
            Alert.alert("Error", "Unable to pick PDF");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Validation ───────────────────────────────
  const validate = () => {
    let e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!certificateFile) e.certificate = "Certificate is required";
    if (!education.length) {
      e.education = "At least one education entry is required";
    } else {
      const invalidEdu = education.find((edu) => !edu.degree.trim() || !edu.institution.trim());
      if (invalidEdu) e.education = "Please complete all education fields";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Fetch Profile ────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth().currentUser;
        if (!user) return;
        const doc = await firestore().collection("users").doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.name) setName(data.name);
          if (data.dob) setDob(data.dob);
          if (data.bio) setBio(data.bio);
          if (Array.isArray(data.education)) setEducation(data.education);
          if (Array.isArray(data.experiences)) setExperiences(data.experiences);
          if (Array.isArray(data.certifications)) setCertifications(data.certifications);
        }
      } catch (err) {
        console.log("Profile load error:", err);
      }
    };
    fetchProfile();
  }, []);

  // ── Submit ───────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setUploading(true);
      const user = auth().currentUser;
      const ref = storage().ref(`certificates/${auth().currentUser.uid}_${Date.now()}`);
      await ref.putFile(certificateFile.uri);
      const url = await ref.getDownloadURL();
      const userDoc = await firestore().collection("users").doc(user.uid).get();
      const username =
        userDoc.exists && userDoc.data().username
          ? userDoc.data().username
          : name.trim().replace(/\s+/g, "-").toLowerCase() + "-" + Math.floor(Math.random() * 10000);
      const userData = {
        name, dob, bio, education, experiences, certifications,  userType: "user",
        username, hasChecked: true, verificationRequested: true,remark: null,
        verificationRequestedAt: FieldValue.serverTimestamp(),
      };
      if (url) userData.mainCertificate = url;
      if (label !== null) userData.label = label;
      if (value !== null) userData.value = value;
      await firestore().collection("users").doc(user.uid).set(userData, { merge: true });
      Alert.alert("✅ Request Sent", "Verification request submitted successfully.");
      navigation.navigate("MainApp");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  // ── Education CRUD ───────────────────────────
  const addEducation = () =>
    setEducation([...education, { degree: "", institution: "", from: "", to: "" }]);
  const updateEducation = (index, field, val) => {
    const updated = [...education];
    updated[index][field] = val;
    setEducation(updated);
  };
  const removeEducation = (index) => setEducation(education.filter((_, i) => i !== index));

  // ── Experience CRUD ──────────────────────────
  const addExperience = () =>
    setExperiences([...experiences, { title: "", org: "", from: "", to: "", desc: "" }]);
  const updateExperience = (index, field, val) => {
    const updated = [...experiences];
    updated[index][field] = val;
    setExperiences(updated);
  };
  const removeExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));

  // ── Certification CRUD ───────────────────────
  const addCertification = () =>
    setCertifications([
      ...certifications,
      { courseName: "", certificateNumber: "", issueDate: "", issuePlace: "" },
    ]);
  const updateCertification = (index, field, val) => {
    const updated = [...certifications];
    updated[index][field] = val;
    setCertifications(updated);
  };
  const removeCertification = (index) =>
    setCertifications(certifications.filter((_, i) => i !== index));

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={premiumStyles.safe}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Background gradient mesh */}
      <LinearGradient
  colors={["#F7F7F9", "#FFFFFF", "#F7F7F9"]}
  style={StyleSheet.absoluteFill}
/>

          <View style={premiumStyles.squareTopLeft} />
                  <View style={premiumStyles.squareRight} />
                  <View style={premiumStyles.squareBottomLeft} />

        <ScrollView
          contentContainerStyle={premiumStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={premiumStyles.headerBlock}>
            <LinearGradient
              colors={["#C9A96E", "#E8D5A3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={premiumStyles.headerAccentBar}
            />
            <Text style={premiumStyles.pageTitle} allowFontScaling={false}>
              Request Verification
            </Text>
            <Text style={premiumStyles.pageSubtitle} allowFontScaling={false}>
              Fill in your personal details and upload your resume for auto-fill
            </Text>
          </View>

          {/* ── Resume Upload ── */}
          <TouchableOpacity
            onPress={uploadResume}
            disabled={parsingResume}
            activeOpacity={0.85}
          >
        <LinearGradient
  colors={["#FFFDF7", "#F3EFE6"]}
  style={premiumStyles.resumeBtn}
>
              <View style={premiumStyles.resumeBtnInner}>
                <View style={premiumStyles.resumeIconRing}>
                  <Text style={premiumStyles.resumeIcon}>⬆</Text>
                </View>
                <View>
                  <Text style={premiumStyles.resumeBtnTitle} allowFontScaling={false}>
                    {parsingResume ? "Analysing Resume…" : "Upload Resume to Autofill"}
                  </Text>
                  <Text style={premiumStyles.resumeBtnSub} allowFontScaling={false}>
                    PDF only · AI-powered extraction
                  </Text>
                </View>
                {parsingResume && (
                  <ActivityIndicator
                    size="small"
                    color="#C9A96E"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </View>
              <View style={premiumStyles.resumeGoldLine} />
            </LinearGradient>
          </TouchableOpacity>

          {/* ── OR Divider ── */}
          <View style={premiumStyles.dividerRow}>
            <View style={premiumStyles.dividerLine} />
            <Text style={premiumStyles.dividerText}>or fill manually</Text>
            <View style={premiumStyles.dividerLine} />
          </View>

          {/* ── Personal Info ── */}
          <SectionHeader title="Personal Information" icon="✦" />
          <GlassCard>
            <ThemedTextInput
              label="Full Name *"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (t.trim()) setErrors((p) => ({ ...p, name: null }));
              }}
              error={errors.name}
            />
            <ThemedTextInput
              label="Date of Birth"
              value={dob}
              onChangeText={setDob}
            />
            <ThemedTextInput
              label="Bio"
              value={bio}
              onChangeText={(t) => t.length <= 200 && setBio(t)}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />
            <Text style={premiumStyles.charCount}>{bio.length}/200</Text>
          </GlassCard>

          {/* ── Certificate Upload ── */}
          <SectionHeader title="Education Certificate" icon="✦" />
          <TouchableOpacity
            onPress={pickCertificate}
            activeOpacity={0.85}
            style={[
              premiumStyles.certUploadBtn,
              errors.certificate && { borderColor: "#FF6B6B" },
            ]}
          >
            <Text style={premiumStyles.certUploadIcon}>📎</Text>
            <View>
              <Text
                style={[
                  premiumStyles.certUploadTitle,
                  errors.certificate && { color: "#FF6B6B" },
                ]}
                allowFontScaling={false}
              >
                {certificateFile ? certificateFile.name : "Upload Education Certificate *"}
              </Text>
              <Text style={premiumStyles.certUploadSub} allowFontScaling={false}>
                {certificateFile ? "Tap to replace" : "Image or PDF accepted"}
              </Text>
            </View>
            <Text style={premiumStyles.certChevron}>›</Text>
          </TouchableOpacity>
          {errors.certificate && (
            <Text style={[premiumStyles.globalError, { marginTop: -8 }]}>
              {errors.certificate}
            </Text>
          )}

          {/* ── Education ── */}
          <SectionHeader title="Education" icon="✦" />
          {errors.education && (
            <Text style={premiumStyles.globalError}>{errors.education}</Text>
          )}
          {education.map((edu, index) => (
            <GlassCard key={index} style={{ marginBottom: 16 }}>
              <View style={premiumStyles.cardHeader}>
                <View style={premiumStyles.cardHeaderLeft}>
                  <Text style={premiumStyles.cardHeaderTitle} allowFontScaling={false}>
                    {edu.degree || "New Education"}
                  </Text>
                  <Text style={premiumStyles.cardHeaderSub} allowFontScaling={false}>
                    {edu.institution
                      ? `${edu.institution}  ·  ${edu.from} – ${edu.to}`
                      : "Add details below"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeEducation(index)}
                  style={premiumStyles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={premiumStyles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ThemedTextInput
                label="Degree"
                value={edu.degree}
                onChangeText={(text) => updateEducation(index, "degree", text)}
              />
              <ThemedTextInput
                label="Institution"
                value={edu.institution}
                onChangeText={(text) => updateEducation(index, "institution", text)}
              />
              <View style={premiumStyles.rowInputs}>
                <ThemedTextInput
                  label="From"
                  value={edu.from}
                  onChangeText={(text) => updateEducation(index, "from", text)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <ThemedTextInput
                  label="To"
                  value={edu.to}
                  onChangeText={(text) => updateEducation(index, "to", text)}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          ))}
          <TouchableOpacity onPress={addEducation} style={premiumStyles.addRowBtn} activeOpacity={0.8}>
            <Text style={premiumStyles.addRowBtnText}>+ Add Education</Text>
          </TouchableOpacity>

          {/* ── Experience ── */}
          <SectionHeader title="Experience" icon="✦" />
          {experiences.map((exp, index) => (
            <GlassCard key={index} style={{ marginBottom: 16 }}>
              <View style={premiumStyles.cardHeader}>
                <View style={premiumStyles.cardHeaderLeft}>
                  <Text style={premiumStyles.cardHeaderTitle} allowFontScaling={false}>
                    {exp.title || "New Experience"}
                  </Text>
                  <Text style={premiumStyles.cardHeaderSub} allowFontScaling={false}>
                    {exp.org
                      ? `${exp.org}  ·  ${exp.from} – ${exp.to}`
                      : "Add details below"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeExperience(index)}
                  style={premiumStyles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={premiumStyles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ThemedTextInput
                label="Title (e.g. Software Engineer)"
                value={exp.title}
                onChangeText={(text) => updateExperience(index, "title", text)}
              />
              <ThemedTextInput
                label="Company / Organization"
                value={exp.org}
                onChangeText={(text) => updateExperience(index, "org", text)}
              />
              <View style={premiumStyles.rowInputs}>
                <ThemedTextInput
                  label="From"
                  value={exp.from}
                  onChangeText={(text) => updateExperience(index, "from", text)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <ThemedTextInput
                  label="To"
                  value={exp.to}
                  onChangeText={(text) => updateExperience(index, "to", text)}
                  style={{ flex: 1 }}
                />
              </View>
              <ThemedTextInput
                label="Description"
                value={exp.desc}
                onChangeText={(text) => updateExperience(index, "desc", text)}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100 }}
              />
            </GlassCard>
          ))}
          <TouchableOpacity onPress={addExperience} style={premiumStyles.addRowBtn} activeOpacity={0.8}>
            <Text style={premiumStyles.addRowBtnText}>+ Add Experience</Text>
          </TouchableOpacity>

          {/* ── Certifications ── */}
          <SectionHeader title="Certifications" icon="✦" />
          {certifications.map((cert, index) => (
            <GlassCard key={index} style={{ marginBottom: 16 }}>
              <View style={premiumStyles.cardHeader}>
                <View style={premiumStyles.cardHeaderLeft}>
                  <Text style={premiumStyles.cardHeaderTitle} allowFontScaling={false}>
                    {cert.courseName || "New Certification"}
                  </Text>
                  <Text style={premiumStyles.cardHeaderSub} allowFontScaling={false}>
                    {cert.issuePlace
                      ? `${cert.issuePlace}  ·  ${cert.issueDate}`
                      : "Add details below"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeCertification(index)}
                  style={premiumStyles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={premiumStyles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ThemedTextInput
                label="Course / Certification Name"
                value={cert.courseName}
                onChangeText={(text) => updateCertification(index, "courseName", text)}
              />
              <ThemedTextInput
                label="Certificate Number"
                value={cert.certificateNumber}
                onChangeText={(text) => updateCertification(index, "certificateNumber", text)}
              />
              <ThemedTextInput
                label="Date of Issue (MM/YYYY)"
                value={cert.issueDate}
                onChangeText={(text) => updateCertification(index, "issueDate", text)}
              />
              <ThemedTextInput
                label="Place of Issue (Mumbai/Kolkata)"
                value={cert.issuePlace}
                onChangeText={(text) => updateCertification(index, "issuePlace", text)}
              />
            </GlassCard>
          ))}
          <TouchableOpacity onPress={addCertification} style={premiumStyles.addRowBtn} activeOpacity={0.8}>
            <Text style={premiumStyles.addRowBtnText}>+ Add Certification</Text>
          </TouchableOpacity>

          {/* bottom padding for FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Submit FAB ── */}
        <View style={premiumStyles.fabWrap}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.88}
          >
           <LinearGradient
  colors={uploading ? ["#D1D5DB", "#9CA3AF"] : ["#fbe5bb", "#f7d28c"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={premiumStyles.fabBtn}
>
              {uploading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator size="small" color="#0D0D0D" />
                  <Text style={premiumStyles.fabText} allowFontScaling={false}>
                    Submitting…
                  </Text>
                </View>
              ) : (
                <Text style={premiumStyles.fabText} allowFontScaling={false}>
                  Request Verification  →
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Parsing Resume Modal ── */}
        <Modal visible={parsingResume} transparent animationType="fade">
          <View style={premiumStyles.modalOverlay}>
            <View style={premiumStyles.modalBox}>
              <LinearGradient
                 colors={["#FFFDF7", "#F3EFE6"]}
                style={premiumStyles.modalBoxInner}
              >
                <View style={premiumStyles.modalGoldRing}>
                  <ActivityIndicator size="large" color="#C9A96E" />
                </View>
                <Text style={premiumStyles.modalTitle} allowFontScaling={false}>
                  Analysing Resume
                </Text>
                <Text style={premiumStyles.modalSub} allowFontScaling={false}>
                  Our AI is extracting your details…
                </Text>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UserDetailsApp;

// ─────────────────────────────────────────────
//  PREMIUM STYLES  — dark luxury / editorial
// ─────────────────────────────────────────────
const GOLD = "#B8964C";        // slightly muted gold (less loud on white)
const GOLD_LIGHT = "#D4B97A";

const BG = "#F7F7F9";          // main background
const SURFACE = "#FFFFFF";     // cards
const BORDER = "#E6E6E9";

const TEXT = "#1A1A1A";
const TEXT_MUTED = "#6B6B6B";

const ERROR = "#E5484D";

const premiumStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

meshAccent: {
  position: "absolute",
  top: -120,
  right: -80,
  width: 320,
  height: 320,
  borderRadius: 160,
  backgroundColor: "#f0e9e9",
},
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Header ──
  headerBlock: { marginBottom: 32, alignItems: "center" },
  headerAccentBar: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 30,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  // ── Resume Button ──
  resumeBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    overflow: "hidden",
    marginBottom: 28,
  },
  resumeBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  resumeIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeIcon: { fontSize: 18, color: GOLD },
  resumeBtnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  resumeBtnSub: { fontSize: 12, color: TEXT_MUTED },
  resumeGoldLine: { height: 1.5, backgroundColor: "#C9A96E22" },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2A2A2A" },
  dividerText: {
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    gap: 10,
  },
  sectionIcon: { fontSize: 10, color: GOLD },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#2A2A2A" },

  // ── Glass Card ──
  glassCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 20,
    // subtle glow
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // ── Card Header ──
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  cardHeaderLeft: { flex: 1 },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GOLD_LIGHT,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  cardHeaderSub: { fontSize: 12, color: TEXT_MUTED, letterSpacing: 0.2 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3A2020",
    backgroundColor: "#1F1010",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  deleteBtnText: { color: ERROR, fontSize: 13, fontWeight: "700" },

  // ── Floating Label Input ──
  inputWrapper: { marginBottom: 16, position: "relative" },
  floatingLabel: { position: "absolute", left: 14, zIndex: 1, letterSpacing: 0.3 },
 inputInner: {
  borderWidth: 1.2,
  borderColor: "#E6E6E9",
  borderRadius: 12,
  backgroundColor: "#FAFAFB",
  paddingTop: 22,
  paddingBottom: 10,
  paddingHorizontal: 14,
},
  inputFocused: { borderColor: GOLD },
  inputError: { borderColor: ERROR },
  rawInput: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
    padding: 0,
    margin: 0,
  },
  inputText: { display: "none" },
  fieldError: { color: ERROR, fontSize: 12, marginTop: 4, marginLeft: 2 },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: -8,
    marginBottom: 4,
  },

  // ── Certificate Upload ──
  certUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderStyle: "dashed",
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  certUploadIcon: { fontSize: 24 },
  certUploadTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  certUploadSub: { fontSize: 12, color: TEXT_MUTED },
  certChevron: {
    marginLeft: "auto",
    fontSize: 24,
    color: GOLD,
    fontWeight: "300",
  },

  // ── Row Inputs ──
  rowInputs: { flexDirection: "row", gap: 0 },

  // ── Add Row Button ──
  addRowBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderStyle: "dashed",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 28,
    backgroundColor: "#f3efe6",
  },
  addRowBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 1,
  },

  // ── FAB Submit ──
  fabWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 16 : 10,
    paddingTop: 12,
    backgroundColor: BG + "EE",
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
  },
  fabBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0D0D0D",
    letterSpacing: 0.5,
  },

  // ── Modal ──
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(255,255,255,0.75)", // soft white overlay
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  borderRadius: 24,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#E6E6E9",
  backgroundColor: "#FFFFFF",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
},

modalBoxInner: {
  padding: 40,
  alignItems: "center",
  minWidth: 260,
  backgroundColor: "#FFFFFF",
},

modalGoldRing: {
  width: 72,
  height: 72,
  borderRadius: 36,
  borderWidth: 2,
  borderColor: "#B8964C33", // softer gold
  backgroundColor: "#FAFAFB",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 24,
},

modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#1A1A1A",
  letterSpacing: 0.3,
  marginBottom: 8,
  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
},

modalSub: {
  fontSize: 13,
  color: "#6B6B6B",
  textAlign: "center",
},

  // ── Errors ──
  globalError: {
    color: ERROR,
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
   /* Background shapes */
  squareTopLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    backgroundColor: "#EAF3FF",
    opacity: 0.6,
    borderRadius: 48,
    transform: [{ rotate: "45deg" }],
    top: -110,
    left: -140,
  },

  squareRight: {
    position: "absolute",
    width: 220,
    height: 220,
    backgroundColor: "#E6F0FF",
    opacity: 0.45,
    borderRadius: 36,
    transform: [{ rotate: "45deg" }],
    top: 160,
    right: -140,
  },

  squareBottomLeft: {
    position: "absolute",
    width: 320,
    height: 320,
    backgroundColor: "#EDF5FF",
    opacity: 0.55,
    borderRadius: 52,
    transform: [{ rotate: "45deg" }],
    bottom: -160,
    left: -180,
  },
  skipTopRight: {
  position: "absolute",
  top: 8,
  right: 16,
  zIndex: 100,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

skipTopRightText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#777",
},
});
