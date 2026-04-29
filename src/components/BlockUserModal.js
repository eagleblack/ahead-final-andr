import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";

const BLOCK_REASONS = [
  "Spam or scam",
  "Harassment or abuse",
  "Inappropriate content",
  "Fake account",
  "Personal safety",
  "Other",
];

const BlockUserModal = ({ visible, onClose, onConfirm, username }) => {
  const [selected, setSelected] = useState(null);
  const [extraText, setExtraText] = useState("");

  const handleBlock = () => {
    if (!selected) return;
    
    onConfirm?.({
      reason: selected,
      details: extraText,
    });

    setSelected(null);
    setExtraText("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* BACKDROP */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* CARD */}
       
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#111827"]}
            style={styles.card}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ marginBottom:80 }}
            >
                 <View style={styles.centered}>
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Icon name="block" size={22} color="#F87171" />
                  <Text style={styles.title}>Block User</Text>
                </View>

                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                {username
                  ? `You won’t see content from ${username} anymore.`
                  : "You won’t see this user’s content anymore."}
              </Text>

              {/* OPTIONS */}
              <View style={styles.optionsWrapper}>
                {BLOCK_REASONS.map((item, index) => {
                  const isSelected = selected === item;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => setSelected(item)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>

                      {isSelected && (
                        <Icon
                          name="check-circle"
                          size={18}
                          color="#6366F1"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* OTHER INPUT */}
              {selected === "Other" && (
                <TextInput
                  placeholder="Tell us more..."
                  placeholderTextColor="#6B7280"
                  value={extraText}
                  onChangeText={setExtraText}
                  style={styles.input}
                  multiline
                />
              )}

              {/* CTA */}
              <TouchableOpacity
                onPress={handleBlock}
                disabled={!selected}
              >
                <LinearGradient
                  colors={
                    selected
                      ? ["#EF4444", "#DC2626"] // 🔥 danger red
                      : ["#374151", "#374151"]
                  }
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>
                    Block User
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
      </View>

            </ScrollView>
          </LinearGradient>
        </View>

    </Modal>
  );
};

export default BlockUserModal;

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


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F9FAFB",
    marginLeft: 8,
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },

  optionsWrapper: {
    marginBottom: 10,
  },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },

  optionSelected: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.15)",
  },

  optionText: {
    fontSize: 14,
    color: "#D1D5DB",
  },

  optionTextSelected: {
    color: "#E0E7FF",
  },

  input: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    color: "#F9FAFB",
    minHeight: 70,
    textAlignVertical: "top",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
 
  button: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
   
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});