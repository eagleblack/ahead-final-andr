import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { themes } from "../themes/themes";
import { useJobTheme } from "../context/JobThemeContext";

const JobCard = ({ job }) => {
  const { currentTheme } = useJobTheme();
  const theme = themes[currentTheme];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentTheme]);

  if (!job) return null;

  const hasProfilePic =
    typeof job.avatar === "string" && job.avatar.trim().length > 0;

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Card Background */}
      <LinearGradient
        colors={["#FFF5E1", "#FFF9F5", "#FDFBFB"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Logo Box */}
      <View style={styles.logoWrapper}>
  <View style={styles.logoBox}>
    {hasProfilePic ? (
      <Image
        source={{ uri: job.avatar }}
        style={styles.logoImage}
        resizeMode="cover"
      />
    ) : (
      <>
        <LinearGradient
          colors={["#6A11CB", "#2575FC"]}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
        />
        <Text style={styles.logoText}>
          {job.company?.charAt(0)?.toUpperCase() || "C"}
        </Text>
      </>
    )}
  </View>

  {/* ✅ Job Type Badge */}
  {job?.jobType && (
    <View style={styles.jobTypeBadge}>
      <Text style={styles.jobTypeText}>{job.jobType}</Text>
    </View>
  )}
</View>


      {/* Job Title & Company */}
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.subtitle}>{job.company}</Text>

      {/* Location & Salary */}
      <View style={styles.row}>
        <Icon name="location-on" size={20} color="#FF6F61" />
        <Text style={styles.info}>{job.location}</Text>

        <Icon
          name="payments"
          size={20}
          color="#FFB400"
          style={{ marginLeft: 16 }}
        />
        <Text style={styles.info}>{job.salary}</Text>
      </View>

      {/* Job Type & Remote */}
      <View style={styles.row}>
        <Icon name="work" size={20} color="#4CAF50" />
        <Text style={styles.info}>
          {job?.type || job?.shift || "N/A"}
        </Text>

        <Icon
          name="home"
          size={20}
          color="#007BFF"
          style={{ marginLeft: 16 }}
        />
        <Text style={styles.info}>
          {job?.remote ? "Remote" : "On-site"}
        </Text>
      </View>

      {/* Skills */}
      <Text style={styles.keySkillsLabel}>Key Skills:</Text>

      <View style={styles.skillsContainer}>
        {(() => {
          let skillsArray = [];

          if (Array.isArray(job?.skills)) {
            skillsArray = job.skills;
          } else if (typeof job?.skills === "string") {
            skillsArray = job.skills.split(",").map((s) => s.trim());
          }

          return skillsArray.length > 0 ? (
            skillsArray.slice(0, 6).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.keySkills}>N/A</Text>
          );
        })()}
      </View>

      {/* Description */}
      <Text style={styles.descTitle}>Description:</Text>
      <Text style={styles.bottomText}>{job.description}</Text>
    </Animated.View>
  );
};

export default JobCard;


const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    marginVertical: 14,
    width:'100%',
    minHeight: 550,
    alignSelf: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  logoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 34,
    letterSpacing: 1,
    zIndex: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: "#444",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  info: {
    marginLeft: 6,
    fontSize: 16,
    color: "#0D1B2A",
    fontWeight: "500",
  },
  keySkillsLabel: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "bold",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 10,
  },
  skillTag: {
    backgroundColor: "#F1F4FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#B3C4FF",
  },
  skillText: {
    color: "#3D5AFE",
    fontSize: 14,
    fontWeight: "600",
  },
  descTitle: {
    marginTop: 28,
    fontWeight: "900",
    fontSize: 18,
    color: "#333",
  },
  bottomText: {
    marginTop: 12,
    textAlign: "left",
    fontSize: 16,
    color: "#333",
    fontStyle: "italic",
    lineHeight: 22,
  },
  logoImage: {
  width: "100%",
  height: "100%",
  borderRadius: 16,
},
logoWrapper: {
  position: "relative",
  alignSelf: "flex-start",
},

jobTypeBadge: {
 
  backgroundColor: "#0D1B2A",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 14,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  marginBottom:10
},

jobTypeText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "700",
  letterSpacing: 0.3,
},

});


