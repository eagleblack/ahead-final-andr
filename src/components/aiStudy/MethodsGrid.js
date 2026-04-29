import React from "react";
import { View, StyleSheet } from "react-native";
import MethodCard from "./MethodCard";

const METHODS = [
  { id: "notes", title: "Notes", icon: "description" },
 
  { id: "flashcards", title: "Flashcards", icon: "layers" },
  { id: "quiz", title: "Quiz", icon: "checklist" },
  { id: "fill", title: "Fill in the Blank", icon: "edit" },

];

const MethodsGrid = ({ selected, toggleMethod }) => {
  return (
    <View style={styles.grid}>
      {METHODS.map((method) => (
        <MethodCard
          key={method.id}
          method={method}
          selected={selected.includes(method.id)}
          onPress={() => toggleMethod(method.id)}
        />
      ))}
    </View>
  );
};

export default MethodsGrid;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});