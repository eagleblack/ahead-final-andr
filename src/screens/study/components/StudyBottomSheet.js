import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const StudyBottomSheet = ({ visible, onClose, colors, onContinue, mode, communities = [], levels = [], stcwLevels = [], studyLevels = [] }) => {
  const [step, setStep] = useState(1); // 1 = Exam selection, 2 = Class selection
  const [selectedExam, setSelectedExam] = useState(null); // Will hold selected community object

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Horizontal slide animation between step 1 and 2
  const horizontalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedExam(null);
      horizontalAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, horizontalAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setStep(2);
    // Slide transition from right to left
    Animated.spring(horizontalAnim, {
      toValue: -SCREEN_WIDTH + 40, // Account for sheet padding
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const handleGoBack = () => {
    setStep(1);
    setSelectedExam(null);
    Animated.spring(horizontalAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const handleSelectClass = (cls) => {
    handleClose();
    setTimeout(() => {
      onContinue({ community: selectedExam, level: cls });
    }, 250);
  };

  const filteredLevels = levels.filter((cls) => cls.communityId === selectedExam?.id);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.handlebar, { backgroundColor: colors.textSecondary + '30' }]} />

          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {step === 2 && (
                <TouchableOpacity onPress={handleGoBack} style={styles.backArrow}>
                  <FontAwesome5 name="arrow-left" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {mode === 'STCW' ? 'Select STCW Level' : mode === 'GUIDE' ? 'Select Study Level' : (step === 1 ? 'Select Exam Type' : 'Select Class Type')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {step === 1 
                    ? `Step 1 of ${mode === 'STCW' || mode === 'GUIDE' ? '1' : '2'} • ${mode} Mode` 
                    : `Step 2 of 2 • Exam ${selectedExam?.name || ''} Selected`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.textSecondary + '10' }]}>
              <FontAwesome5 name="times" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Horizontal animated wrapper */}
          <View style={styles.carouselContainer}>
            <Animated.View
              style={[
                styles.carouselRow,
                {
                  transform: [{ translateX: horizontalAnim }],
                },
              ]}
            >
              {/* Step 1 Page */}
              <View style={styles.carouselPage}>
                <View style={styles.pillsContainer}>
                  {mode === 'STCW' ? (
                    stcwLevels.map((lvl) => (
                      <TouchableOpacity
                        key={lvl.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          handleClose();
                          setTimeout(() => onContinue({ stcwLevel: lvl }), 250);
                        }}
                        style={[
                          styles.classCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.textSecondary + '20',
                          },
                        ]}
                      >
                        <View style={styles.classCardContent}>
                          <View style={[styles.classIconBg, { backgroundColor: colors.primary + '12' }]}>
                            <FontAwesome5 name="graduation-cap" size={16} color={colors.primary} />
                          </View>
                          <Text style={[styles.classCardText, { color: colors.text }]}>
                            {lvl.name}
                          </Text>
                        </View>
                        <FontAwesome5 name="arrow-right" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))
                  ) : mode === 'GUIDE' ? (
                    studyLevels.map((lvl) => (
                      <TouchableOpacity
                        key={lvl.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          handleClose();
                          setTimeout(() => onContinue({ studyLevel: lvl }), 250);
                        }}
                        style={[
                          styles.classCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.textSecondary + '20',
                          },
                        ]}
                      >
                        <View style={styles.classCardContent}>
                          <View style={[styles.classIconBg, { backgroundColor: colors.primary + '12' }]}>
                            <FontAwesome5 name="book" size={16} color={colors.primary} />
                          </View>
                          <Text style={[styles.classCardText, { color: colors.text }]}>
                            {lvl.name}
                          </Text>
                        </View>
                        <FontAwesome5 name="arrow-right" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    communities.map((exam) => (
                      <TouchableOpacity
                        key={exam.id}
                        activeOpacity={0.8}
                        onPress={() => handleSelectExam(exam)}
                        style={[
                          styles.examCard,
                          {
                            backgroundColor: colors.primary + '06',
                            borderColor: colors.primary + '20',
                          },
                        ]}
                      >
                        <View style={styles.examCardContent}>
                          <View style={[styles.examBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.examBadgeText}>{exam.name ? exam.name[0] : ''}</Text>
                          </View>
                          <Text style={[styles.examText, { color: colors.text }]}>{exam.name} Examination</Text>
                        </View>
                        <FontAwesome5 name="chevron-right" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Step 2 Page */}
              <View style={styles.carouselPage}>
                <View style={styles.classContainer}>
                  {filteredLevels.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectClass(cls)}
                      style={[
                        styles.classCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.textSecondary + '20',
                        },
                      ]}
                    >
                      <View style={styles.classCardContent}>
                        <View style={[styles.classIconBg, { backgroundColor: colors.primary + '12' }]}>
                          <FontAwesome5 name="graduation-cap" size={16} color={colors.primary} />
                        </View>
                        <Text style={[styles.classCardText, { color: colors.text }]}>
                          {cls.name}
                        </Text>
                      </View>
                      <FontAwesome5 name="arrow-right" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default StudyBottomSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -5 },
    overflow: 'hidden',
  },
  handlebar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 14,
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  carouselRow: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2, // Double width for two slides
  },
  carouselPage: {
    width: SCREEN_WIDTH - 40, // Margins of the sheet container
    paddingRight: 10,
  },
  pillsContainer: {
    marginVertical: 8,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  examCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  examBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  examText: {
    fontSize: 15,
    fontWeight: '700',
  },
  classContainer: {
    marginVertical: 8,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  classCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  classCardText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
