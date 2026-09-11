import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView, 
  Dimensions,
} from "react-native";
import { Card, Avatar, Chip } from "react-native-paper";
import Icon from "@react-native-vector-icons/material-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useSelector } from "react-redux";
import VerificationOverlay from "../components/VerificationOverlay";

const { width } = Dimensions.get("window");

const ExpertPage = ({ navigation }) => {
  const { colors } = useTheme();
  const [experts, setExperts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user: userData, loading } = useSelector((state) => state.user);

  const scrollRef = useRef();
  const tabScrollRef = useRef();

  const currentUserId = auth().currentUser?.uid;

  const { experts: expertsCategory } = useSelector((state) => state.selection);

  const categories = ["All", ...(expertsCategory || [])];

  const selectedCategory = categories[selectedIndex];

  // 🔥 Firestore
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("users")
      .where("expertVerification", "==", "approved")
      .onSnapshot((snapshot) => {
        const expertList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExperts(expertList);
      });

    return () => unsubscribe();
  }, []);

  const getRandomAvatar = (name) =>
    `https://api.dicebear.com/8.x/initials/png?seed=${encodeURIComponent(name)}`;

  // 🔥 Filter per category
  const getExpertsByCategory = (category) => {
    if (category === "All") return experts;
    return experts.filter((exp) => exp.expertCategory === category);
  };

  // 🔥 Sync swipe → tabs
  const onScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedIndex(index);

    // auto scroll tabs
    tabScrollRef.current?.scrollTo({
      x: index * 100,
      animated: true,
    });
  };

  // 🔥 Tab click → swipe
  const onTabPress = (index) => {
    setSelectedIndex(index);

    scrollRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });

    tabScrollRef.current?.scrollTo({
      x: index * 100,
      animated: true,
    });
  };

  const renderExpert = ({ item }) => {
    const profilePic = item.profilePic
      ? item.profilePic
      : getRandomAvatar(item.name || "User");

    const topExpertise = item.expertise?.slice(0, 3) || [];

    return (
      <TouchableOpacity
        onPress={() =>
          item.uid === currentUserId
            ? navigation.navigate("ExpertonScreen")
            : navigation.navigate("BookServiceScreen", {
                expertId: item.uid,
                userId: currentUserId,
              })
        }
      >
        <Card style={[styles.expertCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.expertContent}>
            <View style={styles.expertHeader}>
              <Avatar.Image size={60} source={{ uri: profilePic }} />
              <View style={styles.expertInfo}>
                <View style={styles.expertNameRow}>
                  <Text style={[styles.expertName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Icon name="verified" size={16} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary }}>
                  {item.expertProfession || "Professional Expert"}
                </Text>
              </View>
            </View>

            <Text style={[styles.bio, { color: colors.text }]}>
              {item.expertBio || "No bio provided."}
            </Text>

            <View style={styles.expertiseContainer}>
              {topExpertise.map((skill, index) => (
                <Chip key={index} style={styles.expertiseChip}>
                  {skill}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderCategoryTabs = () => (
    <ScrollView
      ref={tabScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{maxHeight:80}}
      contentContainerStyle={{ paddingHorizontal: 10, alignItems: "center" }}
    >
      {categories.map((category, index) => (
        <TouchableOpacity
          key={category}
          onPress={() => onTabPress(index)}
          style={[
            styles.categoryChip,
            {
              backgroundColor:
                selectedIndex === index
                  ? colors.primary + "20"
                  : colors.surface,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={{
              color:
                selectedIndex === index ? colors.primary : colors.text,
              fontWeight: "600",
            }}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Expert Consultations
        </Text>
      </View>
<View style={{ flex: 1, position: "relative",paddingTop:10 }}>

    <View >
      {renderCategoryTabs()}
      
    </View>

      {/* 🔥 MAIN SWIPE AREA */}
    <ScrollView
  ref={scrollRef}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onMomentumScrollEnd={onScrollEnd}
  contentContainerStyle={{marginTop:20}}
 
>
        {categories.map((category, index) => {
          const data = getExpertsByCategory(category);

          return (   
          <View key={index} style={{ width,flex:1, }}>
              <FlatList  
                data={data}
                renderItem={renderExpert}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.expertsList,{flexGrow:1}]}
                showsVerticalScrollIndicator={false}
                  
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon
                      name="person-search"
                      size={64}
                      color={colors.textSecondary}
                    />
                    <Text style={{ color: colors.text }}>
                      No experts available
                    </Text>
                  </View>
                }
              />
            </View>
          );
        })}
      </ScrollView>
       {userData?.isUserVerified === false &&
          userData?.userType === "user" && (
            <VerificationOverlay  
              onVerify={() => navigation.navigate("Verification")}
            />
          )}
</View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },

  expertsList: { padding: 10 },

  expertCard: { marginBottom: 12, borderRadius: 12 },
  expertContent: { padding: 10 },

  expertHeader: { flexDirection: "row", alignItems: "center" },
  expertInfo: { marginLeft: 12, flex: 1 },

  expertNameRow: { flexDirection: "row", alignItems: "center" },
  expertName: { fontSize: 15, fontWeight: "bold", marginRight: 6 },

  bio: { marginVertical: 8 },

  expertiseContainer: { flexDirection: "row", flexWrap: "wrap" },
  expertiseChip: { margin: 2 },

  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
});

export default ExpertPage;