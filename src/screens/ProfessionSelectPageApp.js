import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import LinearGradient from "react-native-linear-gradient";
import Dropdown from "../components/DropdownApp";
import { useTheme } from "../context/ThemeContext";

const ProfessionSelectPageApp = ({ navigation }) => {
  const { colors } = useTheme();

  const [role, setRole] = useState(null);
  const [prep, setPrep] = useState(null);
  const [jobOptions, setJobOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("selection_options")
      .doc("default")
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setJobOptions(data?.jobOptions || []);
          setStudentOptions(data?.studentOptions || []);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <PaperProvider>
        <View style={styles.container}>
          {/* Gradient Background */}
          <LinearGradient
            colors={["#EEF6FF", "#FFFFFF"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Decorative Shapes */}
          <View style={styles.squareTopLeft} />
          <View style={styles.squareRight} />
          <View style={styles.squareBottomLeft} />

          {/* Content */}
          <View style={styles.content}>
            <Image
              source={require("../assets/illu.png")}
              style={styles.image}
              resizeMode="contain"
            />

            <Text style={styles.title}>Let’s get started</Text>
            <Text style={styles.subtitle}>What are you looking for ?</Text>

            {/* I am a */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>I am a</Text>
              <Dropdown
               label={"I am a"}
                value={role}
                options={
                  loading
                    ? ["Loading..."]
                    : jobOptions.length
                    ? jobOptions
                    : ["No options available"]
                }
                onSelect={setRole}
                placeholder="Select an option"
                navigation={navigation}
                targetScreen="UserDetailsApp"
                buttonStyle={styles.dropdownButton}
                textStyle={styles.dropdownText}
              />
            </View>

            {/* OR */}
            <View style={styles.orWrapper}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.line} />
            </View>

            {/* I Studied */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>I Studied</Text>
              <Dropdown
              label={"I Studied"}
                value={prep}
                options={
                  loading
                    ? ["Loading..."]
                    : studentOptions.length
                    ? studentOptions
                    : ["No options available"]
                }
                onSelect={setPrep}
                placeholder="Select an option"
                navigation={navigation}
                targetScreen="UserDetailsPage"
                buttonStyle={styles.dropdownButton}
                textStyle={styles.dropdownText}
              />
            </View>
          </View>

          {/* Footer */}
       
        </View>
      </PaperProvider>
    </SafeAreaView>
  );
};

export default ProfessionSelectPageApp;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },

  content: {
    alignItems: "center",
    marginTop: 24,
  },

  image: {
    width: 240,
    height: 190,
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700", // Poppins-Bold feel
    color: "#1F2933",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7B8794",
    marginBottom: 40,
  },

  fieldBlock: {
    width: "100%",
    marginBottom: 28,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between'
  },

  label: {
    fontSize: 18,
    flexDirection:'row',
    fontWeight: "800",
    color: "#7B8794",
    marginBottom: 8,
  marginLeft:20
  },

  dropdownButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EB",
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#9AA5B1",
  },

  orWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    marginBottom:30
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E7EB",
  },

  orText: {
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#9AA5B1",
  },

  companyLink: {
    alignItems: "center",
    paddingBottom: 20,
  },

  companyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5DA9FF",
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
});
  