import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../../context/ThemeContext";

const StudyHeader = ({ openFolders }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: colors.surface }
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Ahead Ai Learning
      </Text>

      <TouchableOpacity onPress={openFolders}>
        <Icon name="folder" size={26} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export default StudyHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});