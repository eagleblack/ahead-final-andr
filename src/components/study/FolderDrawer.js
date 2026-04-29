import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text
} from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../context/ThemeContext";

const FolderDrawer = ({ visible, onClose }) => {
  const { colors } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.drawer,
            { backgroundColor: colors.surface }
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Folders
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary }
            ]}
          >
            <Text style={styles.createText}>
              + Create New Folder
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.folderCard,
              { borderColor: colors.border }
            ]}
          >
            <Icon name="folder" size={24} color={colors.text} />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ color: colors.text }}>
                All Study Sets
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                0 study sets total
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FolderDrawer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    height: "100%",
    width: "80%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  createButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  createText: {
    color: "white",
    fontWeight: "600",
  },
  folderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
});