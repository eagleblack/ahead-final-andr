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

const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or hate",
  "Violence or harmful content",
  "Adult or inappropriate",
  "Fake information",
  "Other",
];

const ReportModal = ({ visible, onClose, onSubmit }) => {
  const [selected, setSelected] = useState(null);
  const [extraText, setExtraText] = useState("");
const handleReport = (post) => {
 
 // dispatch(reportPost({ postId: post.id, reason: "SPAM" }));
};
  const handleSubmit = () => {
    if (!selected) return;

    onSubmit?.({
      reason: selected,
      details: extraText,
    });

    setSelected(null);
    setExtraText("");
   // onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
   
    >
      {/* BACKDROP */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* PREVENT CLOSE WHEN CLICKING CARD */}
        <TouchableOpacity activeOpacity={1}>
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#111827"]}
            style={styles.card}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ marginBottom:80}}>
             

              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Icon name="report" size={22} color="#F87171" />
                  <Text style={styles.title}>Report Content</Text>
                </View>

                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Help us keep the community safe
              </Text>

              {/* OPTIONS */}
              <View style={styles.optionsWrapper}>
                {REPORT_REASONS.map((item, index) => {
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
                onPress={handleSubmit}
                disabled={!selected}
              >
                <LinearGradient
                  colors={
                    selected
                      ? ["#6366F1", "#8B5CF6"]
                      : ["#374151", "#374151"]
                  }
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>
                    Submit Report
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
             

            </ScrollView>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ReportModal;

const styles = StyleSheet.create({


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
   overlay: {
    flex: 1,
    width:'100%',
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    borderRadius: 24,
    padding:40,
  },

});