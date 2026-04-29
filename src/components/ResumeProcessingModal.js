import React from "react";
import { View, Text, Modal, ActivityIndicator, StyleSheet } from "react-native";

const ResumeProcessingModal = ({ visible }) => {
  return (
    <Modal transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" />
          <Text style={styles.text}>Processing resume…</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    width: "80%",
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ResumeProcessingModal;
