import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobs, swipeJob, resetJobs, viewJob } from "../store/JobSlice";
import {
  listenToSelectionOptions,
  clearSelectionListener,
} from "../store/selectionSlice";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import JobCard from "../components/JobCard";
import RadarScreen from "../components/RadarComponent";
import IconF from "react-native-vector-icons/Feather";

import CardStack from "../components/job/CardStack";


const JobSwiper = () => {  
  const { colors: theme, theme: currentTheme, themes } = useTheme();
  const dispatch = useDispatch();
  const swiperRef = useRef(null);
const lastSwipeDir = useRef(null);

const { jobs, loading, hasMore } = useSelector((state) => state.jobs);
  const { user: userData } = useSelector((state) => state.user);
  const { jobOptions, studentOptions, filters, error: filterError,experts } = useSelector(
    (state) => state.selection
  );
  
  const filtersArray=["All",...filters]
 const navigation=useNavigation()
  const [finished, setFinished] = useState(false);
  const [activeTheme, setActiveTheme] = useState(currentTheme);
  const swipeResetTimeout = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // 🩷 LIKE / NOPE opacity
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;

  // 🌊 Animated wave refs
  const wavesRef = useRef(
    Array.from({ length: 3 }).map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      animation: null,
    }))
  );

  const activeColors = themes[activeTheme];

  // 🔹 Load jobs and selection options
  useEffect(() => {
    //dispatch(resetJobs());
    dispatch(fetchJobs());
  }, [dispatch]);

  // 🔹 Track theme changes
  useEffect(() => {
    setActiveTheme(currentTheme);
  }, [currentTheme]);
 useEffect(() => {
    setActiveTheme(currentTheme);
    

  }, [jobs]);
  // 🌊 Start waves


  // 🌊 Stop waves
  
 
  const handleSwipe = (cardIndex, direction) => {
    const job = filteredJobs[cardIndex];
    if (job) dispatch(swipeJob({ job, direction }));
  };

  const handleSwipedAll = () => {
   
    setFinished(true);
  };  



  // 🧠 Filtered job list
const filteredJobs =
  !selectedFilter || selectedFilter === "All"
    ? jobs
    : jobs.filter(
        (job) =>
          job.jobCategory &&
          job.jobCategory.toLowerCase() === selectedFilter.toLowerCase()
      );
  // 🌀 Loading
  if (loading && jobs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // 🎯 No jobs
if (filteredJobs.length === 0 && !loading) {
    return (
          <View style={{flex:1}}>
              <TouchableOpacity
  style={[
    styles.trackButton,
    {
      backgroundColor: theme.card,
      borderColor: theme.primary,
      shadowColor: theme.primary,
    },
  ]}
  activeOpacity={0.85}
  onPress={() => navigation.navigate("Applied")}
>
  <IconF name="briefcase" size={18} color={theme.primary} />
  <Text
    allowFontScaling={false}
    style={[styles.trackButtonText, { color: theme.primary }]}
  >
    Track Jobs
  </Text>
</TouchableOpacity>
              <TouchableOpacity
        style={styles.filterIcon}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter-list" size={30} color={theme.primary} />
      </TouchableOpacity>
             <RadarScreen />
             
                <Modal
            visible={filterModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFilterModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: 'white' }]}>Select Filter</Text>
                {filterError || !filters?.length ? (
                  <Text style={{ color: theme.text, textAlign: "center", marginVertical: 10 }}>
                    No Filters Available
                  </Text>
                ) : (
                  <FlatList
                    data={filtersArray}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.filterItem,
                          {
                            backgroundColor: "white",
                          },
                        ]}
                        onPress={() => {
                          setSelectedFilter(item);
                          setFilterModalVisible(false);
                        }}
                      >
                        <Text
                          style={{
                            color:
                              'black',
                            fontWeight: "600",
                          }}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
    
                <TouchableOpacity
                  style={[styles.closeButton, { borderColor: theme.primary }]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={{ color: theme.primary }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          </View>
    )     
  }

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* 🧭 Filter Icon */}
            <TouchableOpacity
  style={[
    styles.trackButton,
    {
      backgroundColor: theme.card,
      borderColor: theme.primary,
     
    },
  ]}
  activeOpacity={0.85}
  onPress={() => navigation.navigate("Applied")}
>
  <IconF name="briefcase" size={18} color={theme.primary} />
  <Text
    allowFontScaling={false}
    style={[styles.trackButtonText, { color: theme.primary }]}
  >
    Track Jobs
  </Text>
</TouchableOpacity>
      <TouchableOpacity
        style={styles.filterIcon}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter-list" size={30} color={theme.primary} />
      </TouchableOpacity>

      {/* LIKE / NOPE labels */}
      <Animated.Text
        style={[
          styles.swipeText,
          styles.likeText,
          { opacity: likeOpacity, transform: [{ rotate: "-20deg" }] },
        ]}
      >
        APPLY
      </Animated.Text>

      <Animated.Text
        style={[
          styles.swipeText,
          styles.nopeText, 
          { opacity: nopeOpacity, transform: [{ rotate: "20deg" }] },
        ]}
      >
        NOPE
      </Animated.Text> 

     <SafeAreaView style={{ flex: 1,marginTop:20 }}>
  <CardStack
    data={filteredJobs}
    style={{ flex: 1 }}   // 👈 important
  onSwipe={(job, direction) => {
    dispatch(swipeJob({ job, direction }));
  }}
    onSwipedAll={handleSwipedAll}
     hasMore={hasMore} // 👈 add this
   onEndReached={() => {
  if (!loading) {
    dispatch(fetchJobs());
  }
}}
viewJob={(jobId) => dispatch(viewJob(jobId))}
  />
</SafeAreaView>
      {/* 🧩 Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text allowFontScaling={false}  style={[styles.modalTitle, { color: 'white' }]}>Select Filter</Text>
            {filterError || !filters?.length ? (
              <Text allowFontScaling={false}  style={{ color: theme.text, textAlign: "center", marginVertical: 10 }}>
                No Filters Available
              </Text>
            ) : (
              <FlatList
                data={filtersArray}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterItem,
                      {
                        backgroundColor:"white",
                      },
                    ]}
                    onPress={() => {
                      setSelectedFilter(item);
                      setFilterModalVisible(false);
                    }}
                  >
                    <Text allowFontScaling={false} 
                      style={{
                        color:'black',
                        fontWeight: "600",
                      }}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: theme.primary }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text allowFontScaling={false}  style={{ color: theme.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  swiperWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerIcon: { flex: 1, justifyContent: "center", alignItems: "center" },
  wave: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 3 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginHorizontal: 6 },
  swipeText: {
    position: "absolute",
    top: 80,
    zIndex: 999,
    fontSize: 42,
    fontWeight: "900",
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
  },
  likeText: { left: 20, color: "#4CAF50", borderColor: "#4CAF50" },
  nopeText: { right: 20, color: "#F44336", borderColor: "#F44336" },
  filterIcon: { position: "absolute", top: 10, right: 20, zIndex: 1000 },
  filterIconJob:{position: "absolute", top: 10, right: 60, zIndex: 1000},
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex:999
  },
  modalContent: {
    width: "80%",
    borderRadius: 16,
    padding: 20,   
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  filterItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  trackButton: {
  position: "absolute",
  top: 10,
  right: 60,
  zIndex: 1000,

  flexDirection: "row",
  alignItems: "center",

  paddingHorizontal: 14,
  paddingVertical: 8,

  borderRadius: 999, // pill shape
  borderWidth: 1.2,

  // subtle elevation
 
 
},

trackButtonText: {
  marginLeft: 6,
  fontSize: 13,
  fontWeight: "600",
},
});

export default JobSwiper;