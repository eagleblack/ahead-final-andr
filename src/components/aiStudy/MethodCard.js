import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../context/ThemeContext";

const MethodCard = ({ method, selected, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Icon
        name={method.icon}
        size={26}
        color={selected ? colors.primary : colors.text}
      />

      <Text
        style={[
          styles.text,
          { color: colors.text }
        ]}
      >
        {method.title}
      </Text>
    </TouchableOpacity>
  );
};

export default MethodCard;

const styles = StyleSheet.create({
  card: {
    width: "48%",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },

  text: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
  },
});