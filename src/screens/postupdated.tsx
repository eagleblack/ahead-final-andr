import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Modal,
} from "react-native";
import Icon from "@react-native-vector-icons/material-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import auth from "@react-native-firebase/auth";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

import { launchImageLibrary } from "react-native-image-picker";
import uuid from "react-native-uuid";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";

export default function CreatePostScreen({ navigation }) {
  const { colors } = useTheme();
  const { user: userData } = useSelector((state) => state.user);

  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 🔥 POLL STATE
  const [poll, setPoll] = useState(null);

  // 🔗 LINK MODAL
  const [linkModal, setLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState([]);

  // AUTO DETECT LINKS
  const detectedLinks = useMemo(() => {
    const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    return text.match(regex) || [];
  }, [text]);

  // IMAGE
  const pickImage = async () => {
    const res = await launchImageLibrary({ mediaType: "photo" });
    if (res.assets?.length) setImageUri(res.assets[0].uri);
  };

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

  // ADD LINK
  const addLink = () => {
    if (!linkInput.trim()) return;
    setLinks([...links, linkInput]);
    setLinkInput("");
    setLinkModal(false);
  };

  // POST
  const handlePost = async () => {
    if (!text.trim() && !imageUri && !poll) return;

    setUploading(true);
    try {
      let imageUrl = null;

      if (imageUri) {
        const ref = storage().ref(
          `posts/${auth().currentUser.uid}/${uuid.v4()}.jpg`
        );
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
        imageUrl,
        links: [...links, ...detectedLinks],
        poll: pollData,
        createdAt: FieldValue.serverTimestamp(),
        totalLikes: 0,
        totalComments: 0,
      });

      navigation.goBack();
    } catch (e) {
      console.log(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Create Post
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {/* USER */}
      <View style={styles.userRow}>
        <Image
          source={{
            uri: userData?.profilePic || "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: colors.text }]}>
          {userData?.name}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>

        {/* INPUT */}
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          style={[styles.input, { color: colors.text }]}
        />

        {/* LINKS */}
        {[...links, ...detectedLinks].map((link, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
            <Text style={{ color: colors.primary, marginLeft: 16 }}>
              {link}
            </Text>
          </TouchableOpacity>
        ))}

        {/* IMAGE */}
        {imageUri && (
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setImageUri(null)}
            >
              <Icon name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* POLL */}
        {poll && (
          <View style={[styles.pollBox, { backgroundColor: colors.surface }]}>
            
            <View style={styles.pollHeader}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                Create Poll
              </Text>

              <TouchableOpacity onPress={() => setPoll(null)}>
                <Text style={{ color: "red" }}>Delete</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Ask your question..."
              placeholderTextColor={colors.textSecondary}
              value={poll.question}
              onChangeText={(q) => setPoll({ ...poll, question: q })}
              style={[styles.pollQuestion, { color: colors.text }]}
            />

            {poll.options.map((opt, i) => (
              <View key={opt.id} style={styles.optionRow}>
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
            ))}

            {poll.options.length < 4 && (
              <TouchableOpacity onPress={addOption}>
                <Text style={{ color: colors.primary }}>
                  + Add Option
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <Action icon="image" label="Gallery" onPress={pickImage} color="#4ade80" />
        <Action icon="bar-chart" label="Poll" onPress={createPoll} color="#60a5fa" />
        <Action icon="link" label="Link" onPress={() => setLinkModal(true)} color="#9ca3af" />
      </View>

      {/* POST BUTTON */}
      <TouchableOpacity onPress={handlePost} style={{ margin: 16 }}>
        <LinearGradient colors={["#4f46e5", "#9333ea"]} style={styles.postBtn}>
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* LINK MODAL */}
      <Modal visible={linkModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text, marginBottom: 10 }}>
              Add Link
            </Text>

            <TextInput
              placeholder="Paste URL..."
              placeholderTextColor={colors.textSecondary}
              value={linkInput}
              onChangeText={setLinkInput}
              style={[styles.modalInput, { color: colors.text }]}
            />

            <TouchableOpacity onPress={addLink}>
              <Text style={{ color: colors.primary }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Action = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={{ alignItems: "center" }} onPress={onPress}>
    <Icon name={icon} size={22} color={color} />
    <Text style={{ fontSize: 12, marginTop: 4, color: "#aaa" }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  title: { fontSize: 18, fontWeight: "700" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },

  name: { fontSize: 16, fontWeight: "600" },

  input: {
    fontSize: 18,
    padding: 16,
    minHeight: 120,
  },

  imageWrap: { margin: 16, position: "relative" },

  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },

  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#0008",
    borderRadius: 20,
    padding: 4,
  },

  pollBox: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
  },

  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  pollQuestion: {
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 6,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  pollInput: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 6,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },

  postBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  postText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000080",
  },

  modalBox: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },

  modalInput: {
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 6,
  },
});