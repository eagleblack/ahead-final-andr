import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,

  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { themes } from "../themes/themes";
import { useJobTheme } from "../context/JobThemeContext";
import { NativeViewGestureHandler } from "react-native-gesture-handler";

const JobCard = ({ job, onAccept, onReject }) => {
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

  const createdDate = job?.createdAt?.seconds
    ? new Date(job.createdAt.seconds * 1000)
    : new Date();

  const deadline = job?.deadline?.seconds
    ? new Date(job.deadline.seconds * 1000)
    : null;

  const hasProfilePic =
    typeof job.avatar === "string" && job.avatar.trim().length > 0;

  return (
    <View style={[styles.card, ]}>
      {/* Card Background */}
    <NativeViewGestureHandler disallowInterruption={true} shouldActivateOnStart={false}>
          <ScrollView
            nestedScrollEnabled={true}
            // 3. Critically important for Android Swiper conflicts:
            scrollEventThrottle={16} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20,paddingBottom:100 }}
          
          >

  
      <LinearGradient
        colors={["#FFF5E1", "#FFF9F5", "#FDFBFB"]}
        style={StyleSheet.absoluteFillObject}
      />
           {/* Logo Box */}
     <View style={styles.companyRow}>
              {job?.avatar?  <Image source={{ uri: job.avatar }} style={styles.logo} />
              :  <View style={[styles.logoBox]}>
            <LinearGradient
              colors={["#6A11CB", "#2575FC"]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <Text allowFontScaling={false}  style={{fontSize:30,color:'white'}}>
              {job.company?.charAt(0)?.toUpperCase() || "C"}
            </Text>
          </View>}
            
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.company}>{job.company}</Text>
               
                <Text style={styles.small}>
                  Validity: {deadline?.toISOString().split("T")[0]}
                </Text>
              </View>
            </View>
       <View style={styles.logoWrapper}>

 {job?.jobType && ( 
    <View style={styles.jobTypeBadge}>
      <Text allowFontScaling={false}style={styles.jobTypeText}>Rank : {job.jobType}</Text>
    </View>
  )}
       </View>

 
 
       

      {/* Job Title & Company 
      <Text allowFontScaling={false}style={styles.subtitle}>{job.company}</Text>*/}
      <Text allowFontScaling={false}style={styles.title}>{job.title}</Text>
      
  <View style={{}}>
    <View style={{flexDirection:'row',marginVertical:10}}>
 <Icon name="work" size={20} color="#4CAF50" />
        <Text allowFontScaling={false}style={styles.info}>
          {job?.type || job?.shift || "N/A"}
        </Text>
    </View>
       
<View style={{flexDirection:'row',marginVertical:10}}>

        <Icon
          name="home"
          size={20}
          color="#007BFF"
         
        />
        <Text allowFontScaling={false}style={styles.info}>
          {job?.jobCategory ? job?.jobCategory : "On-site"}
        </Text>
</View>
<View style={{flexDirection:'row',marginVertical:10}}>
          <Icon name="person-outline" size={24} color="green" />
          <Text style={styles.info} allowFontScaling={false}>
            {job.experience}
          </Text>
        </View>
      </View>
      {/* Location & Salary */}
      <View style={[styles.row,{marginTop:10}]}>
        <Icon name="location-on" size={20} color="#FF6F61" />
        <Text allowFontScaling={false}style={styles.info}>{job.location}</Text>

        <Icon
          name="payments"
          size={20}
          color="#FFB400"
          style={{ marginLeft: 16 }}
        />
        <Text allowFontScaling={false}style={styles.info}>{job.salary}</Text>
      </View>

      {/* Job Type & Remote */}
    

      {/* Skills */}
      <Text allowFontScaling={false}style={styles.keySkillsLabel}>Key Skills:</Text>

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
                <Text allowFontScaling={false}style={styles.skillText}>{skill}</Text>
              </View>
            ))
          ) : (
            <Text allowFontScaling={false}style={styles.keySkills}>N/A</Text>
          );
        })()}
      </View>

      {/* Description */}
      <Text allowFontScaling={false}style={styles.descTitle}>Description:</Text>
      <Text allowFontScaling={false}style={styles.bottomText}>{job.description}</Text>
      <View style={styles.buttonRow}>
  <TouchableOpacity style={styles.applyBtn} onPress={onAccept}>
    <Text style={styles.applyText}>Apply</Text>
    <Icon name="ios-share" size={16} color="#fff" style={{ marginLeft: 6 }} />
  </TouchableOpacity>

  <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
    <Text style={styles.rejectText}>Reject</Text>
    <Icon name="public" size={16} color="#444" style={{ marginLeft: 6 }} />
  </TouchableOpacity>
</View>
              </ScrollView>
              </NativeViewGestureHandler>
    </View>
  );
};

export default JobCard;


const styles = StyleSheet.create({
  card: {
   
    borderRadius: 24,
    marginVertical:0,
    width:'95%',

       alignSelf: "center",
    justifyContent: "flex-start",
 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBox: {
    width: 70,
    height: 70,
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
    fontSize: 20,
    color: "#444",
    marginBottom: 10,
    flexShrink:1
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  flexWrap: "wrap",   // ✅ allows next line

  },
  info: {
    marginLeft: 6,
    fontSize: 18,
    color: "#0D1B2A",
    fontWeight: "600",
  },
  keySkillsLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
 
  },
  skillTag: {
    backgroundColor: "#F1F4FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    
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
 
  backgroundColor: "#fff",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 14,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  marginBottom:10,
  color:'black'
},

jobTypeText: {
  color: "black",
  fontSize: 16,
  fontWeight: "700",
  letterSpacing: 0.3,
},
 
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },

  company: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom:10
  },

  small: {
    fontSize: 12,
    color: "#2596be",
    fontWeight:'600'
  },
    buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e73ff", // 🔥 exact blue feel
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },

  applyText: {
    color: "#fff",
    fontWeight: "600",
  },

  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },

  rejectText: {
    color: "#333",
    fontWeight: "600",
  },
});