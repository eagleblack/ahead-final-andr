import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const StudyEmptyState = ({onPress}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.primary + "20" }
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Create Your First Study Set
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Turn your study materials into study methods proven to work!
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary }
          ]}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StudyEmptyState;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    borderRadius: 18,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 18,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});