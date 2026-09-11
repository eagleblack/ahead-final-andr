import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
View,
Text,
TouchableOpacity,
StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";

const VerificationOverlay = ({ visible=true, onVerify }) => {
if (!visible) return null;
  const { user: userData } = useSelector((state) => state.user);
  const navigation = useNavigation();
 const verify = () => {
    if(userData?.remark !==null || userData?.verificationRequested) {
        navigation.navigate("PendingVerification");
    }
    else
    {
        navigation.navigate("ProfessionSelectApp");
    }
 }
return (
<View style={styles.overlay}>
<View style={styles.card}>
<Text style={styles.title}>Verification Required</Text>

<Text style={styles.subtitle}>
Verify your account to continue using this feature.
</Text>

<TouchableOpacity
style={styles.verifyButton}
onPress={()=>{verify()}}
activeOpacity={0.8}
>
<Text style={styles.verifyText}>Verify Now</Text>
</TouchableOpacity>
</View>
</View>
);
};

const styles = StyleSheet.create({
overlay: {
...StyleSheet.absoluteFillObject,

// Background remains slightly visible
backgroundColor: "rgba(0, 0, 0, 0.6)",

justifyContent: "center",
alignItems: "center",

zIndex: 9999,
},

card: {
width: "82%",
paddingHorizontal: 24,
paddingVertical: 26,

borderRadius: 20,

backgroundColor: "rgba(255, 255, 255, 0.92)",

alignItems: "center",
},

title: {
fontSize: 20,
fontWeight: "700",
color: "#111",
textAlign: "center",
marginBottom: 8,
},

subtitle: {
fontSize: 14,
lineHeight: 20,
color: "#666",
textAlign: "center",
marginBottom: 20,
},

verifyButton: {
width: "100%",
height: 48,

borderRadius: 24,

backgroundColor: "#111",

justifyContent: "center",
alignItems: "center",
},

verifyText: {
color: "#fff",
fontSize: 15,
fontWeight: "600",
},
});

export default VerificationOverlay;