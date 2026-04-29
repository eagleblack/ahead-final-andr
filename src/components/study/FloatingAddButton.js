import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../context/ThemeContext";

const FloatingAddButton = ({ onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <Icon name="add" size={30} color="white" />
    </TouchableOpacity>
  );
};

export default FloatingAddButton;

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    height: 60,
    width: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});