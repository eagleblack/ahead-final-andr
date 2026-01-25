import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";

const BetaInfoModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#0F2027", "#203A43", "#2C5364"]}
          style={styles.card}
        >
          {/* Header <Text style={styles.betaTag}>BETA ACCESS</Text>*/}
          
          <Text style={styles.title}>Ahead AI is in Beta 🚀</Text>

          <Text style={styles.subtitle}>
            We’re building the future of marine hiring & learning.
          </Text>

          {/* Features */}
          <View style={styles.feature}>
            <Icon name="verified-user" size={22} color="#4ADE80" />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>RPSL Onboarding</Text> — Verified marine
              employers for secure & authentic opportunities
            </Text>
          </View>

          <View style={styles.feature}>
            <Icon name="school" size={22} color="#60A5FA" />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>Micro Learning</Text> — Bite-sized,
              intelligent learning for certification & safety
            </Text>
          </View>

          <View style={styles.feature}>
            <Icon name="smart-toy" size={22} color="#F472B6" />
            <Text style={styles.featureText}>
              <Text style={styles.bold}>AI Avatar Tutor</Text> — Guided learning,
              mentoring & interview readiness
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Ok</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default BetaInfoModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "88%",
    borderRadius: 24,
    padding: 24,
  },

  betaTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "700",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: "#D1D5DB",
    marginBottom: 20,
  },

  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },

  featureText: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  bold: {
    fontWeight: "800",
    color: "#fff",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#052E16",
    fontWeight: "900",
    fontSize: 16,
  },
});
