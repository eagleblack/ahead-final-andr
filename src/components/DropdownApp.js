import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const Dropdown = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = "Select an option",
  navigation,
  targetScreen,
  buttonStyle,
  textStyle,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOptions(options);
    } else {
      setFilteredOptions(
        options.filter(item =>
          item.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, options]);

  const handleSelect = (item) => {
    onSelect(item);
    setVisible(false);
    setSearchText("");

    if (navigation && targetScreen) {
      navigation.navigate(targetScreen, { label,value: item });
    }
  };

  return (
    <>
      {/* BUTTON */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.button, buttonStyle]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.buttonText, textStyle]}>
          {value || placeholder}
        </Text>

        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color="#9AA5B1"
        />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modal}>
            {/* Search */}
            <TextInput
              placeholder="Search..."
              placeholderTextColor="#9AA5B1"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.search}
            />

            {/* List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No options found</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default Dropdown;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width:'60%'
  },

  buttonText: {
    fontSize: 15,
    color: "#9AA5B1",
    fontWeight: "500",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    maxHeight: "65%",
  },

  search: {
    borderWidth: 1,
    borderColor: "#E4E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#1F2933",
  },

  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },

  optionText: {
    fontSize: 15,
    color: "#1F2933",
  },

  empty: {
    textAlign: "center",
    marginTop: 24,
    color: "#7B8794",
    fontStyle: "italic",
  },
});
