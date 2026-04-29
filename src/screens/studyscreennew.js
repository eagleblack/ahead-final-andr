import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import StudyHeader from "../components/study/StudyHeader";
import StudyEmptyState from "../components/study/StudyEmptyState";
import FloatingAddButton from "../components/study/FloatingAddButton";
import AddContentSheet from "../components/study/AddContentSheet";
import FolderDrawer from "../components/study/FolderDrawer";
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { pick, types } from "@react-native-documents/picker";
import PasteModal from "../components/study/PasteModal";
const StudyScreen = ({navigation}) => {
  const { colors } = useTheme();
   
  const [sheetVisible, setSheetVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
const [pasteVisible,setPasteVisible] = useState(false)

const openCamera = async () => {
  const result = await launchCamera({
    mediaType: "photo",
    cameraType: "back",
  });

  if (!result.didCancel) {
    navigation.navigate("ChooseMethods")

    console.log(result.assets[0]);
  }
};

const openPhotos = async () => {
  const result = await launchImageLibrary({
    mediaType: "photo",
  });

  if (!result.didCancel) {
    navigation.navigate("ChooseMethods")

    console.log(result.assets[0]);
  }
};

const openFile = async () => {
  try {
    const results = await pick({ 
      type: [types.pdf, types.docx, types.plainText],
    });

    if (!results?.length) return;

    const file = results[0];
    console.error(file)
    navigation.navigate("ChooseMethods")

  } catch (err) {
    console.log("User cancelled picker");
  }
};

const openPaste = () => {
  navigation.navigate("ChooseMethods")
  setPasteVisible(true);
};
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StudyHeader openFolders={() => setDrawerVisible(true)} />

      <StudyEmptyState onPress={() => setSheetVisible(true)}/>

      <FloatingAddButton onPress={() => setSheetVisible(true)} />

    <AddContentSheet
  visible={sheetVisible}
  onClose={() => setSheetVisible(false)}
  onCamera={openCamera}
  onPhotos={openPhotos}
  onFile={openFile}
  onPaste={openPaste}
/>

<PasteModal
  visible={pasteVisible}
  onClose={() => setPasteVisible(false)}
  onSubmit={(text)=>console.log("PASTE",text)}
/>

      <FolderDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </SafeAreaView>
  );
};

export default StudyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});