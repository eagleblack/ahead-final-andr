import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/material-icons";
import { useTheme } from "../context/ThemeContext";
import MethodsGrid from "../components/aiStudy/MethodsGrid";
import { useNavigation } from "@react-navigation/native";

const ChooseMethodsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [selected, setSelected] = useState([]);

  const toggleMethod = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.surface }
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Select Conversion Method
        </Text>

       
      </View>

      {/* Content + Add */}
      <View
        style={[
          styles.contentBar,
          { borderBottomColor: colors.surface }
        ]}
      >
        <View style={styles.contentLeft}>
          <Icon name="description" size={20} color={colors.text} />
          <Text style={[styles.contentText, { color: colors.text }]}>
            Content
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: colors.surface }
          ]}
        >
          <Icon name="add" size={18} color={colors.text} />
          <Text style={{ marginLeft: 6, color: colors.text }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Methods */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <MethodsGrid
          selected={selected}
          toggleMethod={toggleMethod}
        />
      </ScrollView>

      {/* Generate Button */}
      <TouchableOpacity
        style={[
          styles.generateBtn,
          {
            backgroundColor:
              selected.length === 0
                ? colors.primary + "55"
                : colors.primary,
          },
        ]}
        disabled={selected.length === 0}
      >
        <Text style={styles.generateText}>Generate</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChooseMethodsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },

  title: {
    fontSize:16,
    fontWeight: "700",
    marginLeft: 12,
    flex: 1,
  },

  lang: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  contentBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },

  contentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  contentText: {
    marginLeft: 8,
    fontWeight: "600",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  generateBtn: {
    margin: 16,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  generateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});