import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../context/ThemeContext";

const AddContentSheet = ({
  visible,
  onClose,
  onCamera,
  onPhotos,
  onFile,
  onPaste,
}) => {
  const { colors } = useTheme();

  const options = [
    { icon: "photo-camera", label: "Camera", action: onCamera },
    { icon: "photo", label: "Photos", action: onPhotos },
    { icon: "upload-file", label: "File upload", action: onFile },
    { icon: "link", label: "Paste", action: onPaste },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface },
          ]}
        >
          {options.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.row}
              onPress={() => {
                onClose();
                item.action();
              }}
            >
              <Icon
                name={item.icon}
                size={22}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.text,
                  { color: colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

export default AddContentSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheet: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  text: {
    fontSize: 16,
    marginLeft: 16,
  },
});