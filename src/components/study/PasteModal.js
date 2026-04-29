import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const PasteModal = ({ visible, onClose, onSubmit }) => {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.box,
            { backgroundColor: colors.surface },
          ]}
        >
          <TextInput
            placeholder="Paste your text..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={400}
            value={text}
            onChangeText={setText}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />

          <Text
            style={{ color: colors.textSecondary, marginBottom: 10 }}
          >
            {text.length}/400
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              onSubmit(text);
              setText("");
              onClose();
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              Add Content
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PasteModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  box: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 120,
    padding: 10,
    marginBottom: 10,
  },

  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});