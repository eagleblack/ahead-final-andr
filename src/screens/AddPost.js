// CreatePostScreen.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

import auth from "@react-native-firebase/auth";
import firestore,{FieldValue} from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

import { launchImageLibrary } from "react-native-image-picker";
import uuid from "react-native-uuid";
import { useSelector } from "react-redux";

const AVATAR_URL = "https://i.pravatar.cc/150?img=12";

export default function CreatePostScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user: userData, loading } = useSelector((state) => state.user);
const inputRef = useRef(null);
const [selection, setSelection] = useState({ start: 0, end: 0 });
  const count = useMemo(() => `${text.length}/1000`, [text]);
  const [poll, setPoll] = useState(null);
  // POLL FUNCTIONS
  const createPoll = () => {
    setPoll({
      question: "",
      options: [
        { id: uuid.v4(), text: "" },
        { id: uuid.v4(), text: "" },
      ],
    });
  };

  const updateOption = (val, index) => {
    const updated = [...poll.options];
    updated[index].text = val;
    setPoll({ ...poll, options: updated });
  };

  const addOption = () => {
    if (poll.options.length >= 4) return;
    setPoll({
      ...poll,
      options: [...poll.options, { id: uuid.v4(), text: "" }],
    });
  };

  const removeOption = (index) => {
    if (poll.options.length <= 2) return;
    const updated = poll.options.filter((_, i) => i !== index);
    setPoll({ ...poll, options: updated });
  };

  const insertAtCursor = (insertText) => {
  const start = selection.start;
  const end = selection.end;

  const newText =
    text.slice(0, start) + insertText + text.slice(end);

  const newCursor = start + insertText.length;

  setText(newText);

  setTimeout(() => {
    setSelection({ start: newCursor, end: newCursor });
    inputRef.current?.focus();
  }, 50);
};
  // Extract links from text
  const detectedLinks = useMemo(() => {
    const urlRegex =
      /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(ftp:\/\/[^\s]+)/gi;
    return text.match(urlRegex) || [];
  }, [text]);

  // Pick image directly
  const pickImage = async () => {
    const options = { mediaType: "photo", quality: 0.8 };
    const result = await launchImageLibrary(options);
    if (result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };
const isPollValid =
  poll &&
  poll.question.trim().length > 0 &&
  poll.options.length >= 2 &&
  poll.options.every(o => o.text && o.text.trim().length > 0);
  // Upload post
  const handlePost = async () => {
     if (poll && !isPollValid) {
    alert("Please complete your poll before posting");
    return;
  }
    if (!text.trim() && !imageUri && !poll) return;
    setUploading(true);
    try {
    let imageUrl = null;

if (imageUri) {
  const imgId = uuid.v4();
  const ref = storage().ref(
    `posts/${auth().currentUser.uid}/${imgId}.jpg`
  );

  // 🔥 THIS IS THE KEY FIX
  await ref.putFile(imageUri);

  imageUrl = await ref.getDownloadURL();
}
   const pollData = poll
        ? {
            question: poll.question,
            options: poll.options.map((o) => ({
              text: o.text,
              votes: 0,
            })),
            totalVotes: 0,
          }
        : null;
      await firestore().collection("posts").add({
        userId: auth().currentUser.uid,
        content: text.trim(),
        imageUrl: imageUrl || null,
        links: detectedLinks,
           poll: pollData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        totalLikes: 0,
        totalComments: 0,
        postIndex:0,
      });

      setText("");
      setImageUri(null);
      navigation.goBack();
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setUploading(false);
    }
  };
const getInitial = (name) => {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
};
  return (
 <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "padding"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
  >
      <StatusBar
        translucent={false}
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
        Add Post
        </Text>
        </TouchableOpacity>
        
        <View style={styles.rightSpacer} />
      </View>

      {/* Profile Row */}
      <View style={styles.profileRow}>
      <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8}>
  {userData?.profilePic ? (
    <Image
      source={{ uri: userData.profilePic }}
      style={styles.avatar}
    />
  ) : (
    <View
      style={[
        styles.avatarFallback,
        { backgroundColor: colors.primary + "20" },
      ]}
    >
      <Text
        style={{
          color: colors.primary,
          fontSize: 20,
          fontWeight: "700",
        }}
      >
        {getInitial(userData?.name)}
      </Text>
    </View>
  )}

  <View
    style={[
      styles.avatarRing,
      { borderColor: colors.textSecondary },
    ]}
  />
</TouchableOpacity>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: colors.text }]}>
           {userData?.name}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
           {userData?.profileTitle}

          </Text>
        </View>
      </View>

     

      {/* Composer */}
      <ScrollView
        style={styles.composer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputWrap}>
          <TextInput
  ref={inputRef}
  value={text}
  onChangeText={(v) => v.length <= 1000 && setText(v)}
  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
  selection={selection}
  placeholder="What's on your mind? Use #hashtags to reach more people."
  placeholderTextColor={colors.textSecondary}
  style={[styles.input, {
    color: colors.text,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  }]}
  multiline
  textAlignVertical="top"
/>
          <Text style={[styles.counter, { color: colors.textSecondary }]}>
            {count}
          </Text>
        </View>

        {/* Link preview area */}
        {detectedLinks.length > 0 && (
          <View
            style={[
              styles.linkBox,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            {detectedLinks.map((link, i) => (
              <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
                <Text
                  style={{
                    color: colors.primary,
                    textDecorationLine: "underline",
                    marginBottom: 4,
                  }}
                >
                  {link}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Image preview */}
        {imageUri && (
          <View style={styles.imagePreviewWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={[styles.removeImgBtn, { backgroundColor: colors.background }]}
              onPress={() => setImageUri(null)}
            >
              <Icon name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
          {/* POLL */}
              {poll && (
                <View style={[styles.pollBox, { backgroundColor: colors.surface }]}>
                  
               <View style={styles.pollHeader}>
  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>
    📊 Create Poll
  </Text>

  <TouchableOpacity onPress={() => setPoll(null)}>
    <Icon name="delete-outline" size={20} color="red" />
  </TouchableOpacity>
</View>
      
                 <TextInput
  placeholder="Ask your question..."
  placeholderTextColor={colors.textSecondary}
  value={poll.question}
  onChangeText={(q) => setPoll({ ...poll, question: q })}
  style={[
    styles.pollQuestion,
    {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
  ]}
/>
      
                  {poll.options.map((opt, i) => (
                  <View key={opt.id} style={styles.optionRow}>
  <View style={[styles.optionBox, { backgroundColor: colors.surface }]}>
    <TextInput
      value={opt.text}
      onChangeText={(v) => updateOption(v, i)}
      placeholder={`Option ${i + 1}`}
      placeholderTextColor={colors.textSecondary}
      style={[styles.pollInput, { color: colors.text }]}
    />

    {poll.options.length > 2 && (
      <TouchableOpacity onPress={() => removeOption(i)}>
        <Icon name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    )}
  </View>
</View>
                  ))} 
      
                  {poll.options.length < 4 && (
                  <TouchableOpacity
  onPress={addOption}
  style={[styles.addOptionBtn, { borderColor: colors.primary }]}
>
  <Icon name="add" size={18} color={colors.primary} />
  <Text style={{ color: colors.primary, marginLeft: 6 }}>
    Add Option
  </Text>
</TouchableOpacity>
                  )}
                </View>
              )}
           <View style={styles.actions}>
        <Action icon="image" label="Gallery" onPress={pickImage} color={colors} />
        <Action icon="bar-chart" label="Poll" onPress={createPoll} color={colors} />
        <Action
  icon="link"
  label="Link"
onPress={() => {
  const beforeCursor = text.slice(0, selection.start);

if (!beforeCursor.endsWith("https://")) {
   insertAtCursor(
  (text[selection.start - 1] === " " ? "" : " ") + "https://"
);
} else {
  inputRef.current?.focus();
}
 
}}
color={colors}
/>
      </View>
     
      
      </ScrollView>
    
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        
        
       
        <TouchableOpacity
          style={[
            styles.postBtn,
            {
              backgroundColor:
                !text && !imageUri && !isPollValid ? colors.disabled : colors.primary,
            },
          ]}
          disabled={!text && !imageUri && !isPollValid}
          onPress={handlePost}
        >
          {uploading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.postLabel, { color: colors.background }]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const Action = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={{ alignItems: "center" }} onPress={onPress}>
    <Icon name={icon} size={22} color={color.primary} />
    <Text style={{ fontSize: 12, marginTop: 4, color:color.text,fontWeight:800 }}>
      {label}
    </Text>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backHitbox: {
 
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    flexDirection:'row'

  },
  headerTitle: {
    
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginLeft:10
  },
  rightSpacer: { width: 40 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  avatarWrap: { width: 56, height: 56, marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarRing: {
    position: "absolute",
    left: -2,
    top: -2,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  nameBlock: { flex: 1 },
  name: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  hint: { fontSize: 13, lineHeight: 18 },
  banner: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  bannerText: { fontSize: 13, textAlign: "center" },
  composer: { flex: 1, marginTop: 8, paddingHorizontal: 12 },
  inputWrap: { position: "relative" },
  input: {
    fontSize: 18,
    lineHeight: 26,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  counter: {
    position: "absolute",
    right: 10,
    bottom: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  linkBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  imagePreviewWrap: { marginTop: 12, position: "relative" },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  removeImgBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  bottomBar: {
  
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 18, android: 12 }),
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'center',zIndex:999
    
  },
  leftTools: { flexDirection: "row", alignItems: "center" },
  toolBtn: {
     
    height: 36,
    borderRadius: 18,
    alignItems: "center",  
    justifyContent: "center",
    marginRight: 8,
    flexDirection:'row'
  },
  postBtn: {
    height: 44,
    width:'80%',
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf:'center'
  },
   actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginTop:50
  },
  postLabel: { fontSize: 16, fontWeight: "700" },
  
pollBox: {
  margin: 16,
  padding: 16,
  borderRadius: 18,
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
},

  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

pollQuestion: {
  borderBottomWidth: 0,
  marginBottom: 16,
},
 optionRow: {
  marginBottom: 10,
},

optionBox: {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
},

pollInput: {
  flex: 1,
  fontSize: 15,
},
addOptionBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderRadius: 12,   
  paddingVertical: 10,
  marginTop: 8,
},
avatarFallback: {
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: "center",
  alignItems: "center",
},
});
