import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const normalizeDocData = (doc) => {
  const rawData = doc.data();
  const normalized = {};

  Object.keys(rawData).forEach((key) => {
    normalized[key.trim()] = rawData[key];
  });

  return {
    id: doc.id,
    ...normalized,
  };
};

// --- Async Thunks ---

// Fetch all exam types (communities)
export const fetchCommunities = createAsyncThunk(
  "study/fetchCommunities",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("communities")
        .orderBy("name", "asc")
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return data;
    } catch (err) {
      console.error("❌ Error fetching communities:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch all class types (examLevels)
export const fetchLevels = createAsyncThunk(
  "study/fetchLevels",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("examLevels")
        .orderBy("name", "asc")
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return data;
    } catch (err) {
      console.error("❌ Error fetching levels:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchOralSubjects = createAsyncThunk(
  "study/fetchOralSubjects",
  async ({ communityId, examLevelId }, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("oralSubjects")
        .where("communityId", "==", communityId)
        .get();

      return snapshot.docs
        .map(normalizeDocData)
        .filter((item) => item.examLevelId === examLevelId);
    } catch (err) {
      console.error("❌ Error fetching oral subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch all subjects and topics for a given community (filtering levels in-memory for index-safety)
export const fetchSubjectsAndTopics = createAsyncThunk(
  "study/fetchSubjectsAndTopics",
  async ({ communityId, examLevelId }, { rejectWithValue }) => {
    try {
      const [subjectsSnapshot, topicsSnapshot] = await Promise.all([
        firestore()
          .collection("subjects")
          .where("communityId", "==", communityId)
          .get(),
        firestore()
          .collection("topics")
          .where("communityId", "==", communityId)
          .get(),
      ]);

      const allSubjects = subjectsSnapshot.docs.map(normalizeDocData);
      const allTopics = topicsSnapshot.docs.map(normalizeDocData);

      // Filter by examLevelId in-memory
      const filteredSubjects = allSubjects.filter((sub) => sub.examLevelId === examLevelId);
      const filteredTopics = allTopics.filter((topic) => topic.examLevelId === examLevelId);

      return { subjects: filteredSubjects, topics: filteredTopics };
    } catch (err) {
      console.error("❌ Error fetching subjects and topics:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch questions for a specific topic
export const fetchQuestions = createAsyncThunk(
  "study/fetchQuestions",
  async (topicId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("questions")
        .where("topicId", "==", topicId)
        .get();

      const data = snapshot.docs.map((doc) => {
        const qData = normalizeDocData(doc);
        
        return {
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          year: qData.askedYears && qData.askedYears.length > 0
            ? `Asked in ${qData.askedYears.join(", ")}`
            : qData.year || "",
          options: qData.options || [],
          fibQuestion: qData.fibQuestion || "",
          fibAnswer: qData.fibAnswer || "",
          flashcardFront: qData.flashcardFront || qData.question || "",
          flashcardBack: qData.flashcardBack || qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
      return { topicId, questions: data };
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Oral topics
export const fetchOralTopics = createAsyncThunk(
  "study/fetchOralTopics",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("oral_topics")
        .get();

      const data = snapshot.docs.map((doc) => {
        const tData = normalizeDocData(doc);
        return {
          name: tData.name || tData.title || "",
          ...tData,
        };
      });
      return data;
    } catch (err) {
      console.error("❌ Error fetching oral topics:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Oral questions
export const fetchOralQuestions = createAsyncThunk(
  "study/fetchOralQuestions",
  async (input, { rejectWithValue }) => {
    try {
      const subjectId = typeof input === "object" ? input?.subjectId : null;
      const topicId = typeof input === "object" ? input?.topicId : input;
      const lookupValue = subjectId || topicId;
      const lookupField = subjectId ? "subjectId" : "topicId";

      const snapshot = await firestore()
        .collection("oral")
        .where(lookupField, "==", lookupValue)
        .get();

      const data = snapshot.docs.map((doc) => {
        const qData = normalizeDocData(doc);
        return {
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          year: qData.askedYears && qData.askedYears.length > 0
            ? `Asked in ${qData.askedYears.join(", ")}`
            : qData.year || "",
          ...qData,
        };
      });
      return { topicId: lookupValue, questions: data };
    } catch (err) {
      console.error("❌ Error fetching oral questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTopicPracticeProgress = createAsyncThunk(
  "study/fetchTopicPracticeProgress",
  async ({ topicId }, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const doc = await firestore()
        .collection("studyTopicProgress")
        .doc(`${userId}_${topicId}`)
        .get();

      if (doc.exists) {
        const data = doc.data() || {};
        return {
          topicId,
          mcqSequence: Number(data.mcqSequence || 0),
          fillBlankSequence: Number(data.fillBlankSequence || 0),
          flashcardSequence: Number(data.flashcardSequence || 0),
        };
      }

      return {
        topicId,
        mcqSequence: 0,
        fillBlankSequence: 0,
        flashcardSequence: 0,
      };
    } catch (err) {
      console.error("❌ Error fetching topic practice progress:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const updateTopicPracticeProgress = createAsyncThunk(
  "study/updateTopicPracticeProgress",
  async ({ topicId, mcqSequence, fillBlankSequence, flashcardSequence }, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const updateData = {
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (mcqSequence !== undefined) updateData.mcqSequence = mcqSequence;
      if (fillBlankSequence !== undefined) updateData.fillBlankSequence = fillBlankSequence;
      if (flashcardSequence !== undefined) updateData.flashcardSequence = flashcardSequence;

      await firestore()
        .collection("studyTopicProgress")
        .doc(`${userId}_${topicId}`)
        .set(updateData, { merge: true });

      const payload = { topicId };
      if (mcqSequence !== undefined) payload.mcqSequence = mcqSequence;
      if (fillBlankSequence !== undefined) payload.fillBlankSequence = fillBlankSequence;
      if (flashcardSequence !== undefined) payload.flashcardSequence = flashcardSequence;

      return payload;
    } catch (err) {
      console.error("❌ Error updating topic practice progress:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch topic question counts
export const fetchTopicQuestionCounts = createAsyncThunk(
  "study/fetchTopicQuestionCounts",
  async (topicId, { rejectWithValue }) => {
    try {
      // Count COC questions
      const cocCountSnapshot = await firestore()
        .collection("questions")
        .where("topicId", "==", topicId)
        .count()
        .get();
      const cocCount = cocCountSnapshot.data().count;

      // Count Oral questions
      const oralCountSnapshot = await firestore()
        .collection("oral")
        .where("topicId", "==", topicId)
        .count()
        .get();
      const oralCount = oralCountSnapshot.data().count;

      return { topicId, cocCount, oralCount };
    } catch (err) {
      console.error("❌ Error fetching question counts:", err);
      return { topicId, cocCount: 0, oralCount: 0 };
    }
  }
);

export const fetchTopicQuestionCountsBatch = createAsyncThunk(
  "study/fetchTopicQuestionCountsBatch",
  async (topicIds, { rejectWithValue }) => {
    try {
      const entries = await Promise.all(
        topicIds.map(async (topicId) => {
          const [cocCountSnapshot, oralCountSnapshot] = await Promise.all([
            firestore()
              .collection("questions")
              .where("topicId", "==", topicId)
              .count()
              .get(),
            firestore()
              .collection("oral")
              .where("topicId", "==", topicId)
              .count()
              .get(),
          ]);

          return [
            topicId,
            {
              cocCount: cocCountSnapshot.data().count,
              oralCount: oralCountSnapshot.data().count,
            },
          ];
        })
      );

      return Object.fromEntries(entries);
    } catch (err) {
      console.error("âŒ Error fetching batch question counts:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Interview MCQs
export const fetchInterviewMcqs = createAsyncThunk(
  "study/fetchInterviewMcqs",
  async ({ selectedDepartmentId, lastSequence }, { rejectWithValue }) => {
    try {
      const collectionRef = firestore().collection("interview_mcqs");
      const queryRef = selectedDepartmentId !== undefined && selectedDepartmentId !== null
        ? collectionRef.where("departmentId", "==", selectedDepartmentId)
        : collectionRef;
      const snapshot = await queryRef.get();

      const data = snapshot.docs.map((doc) => {
        const qData = normalizeDocData(doc);
        return {
          question: qData.question || "",
          options: qData.options || [],
          correctOptionNumber: qData.correctOptionNumber !== undefined ? qData.correctOptionNumber : null,
          answer: qData.answer || (qData.options && qData.correctOptionNumber !== undefined ? qData.options[qData.correctOptionNumber] : ""),
          sequence: qData.sequence !== undefined ? Number(qData.sequence) : 0,
          ...qData,
        };
      })
      .filter((item) => selectedDepartmentId ? item.departmentId === selectedDepartmentId : (item.departmentId === null || item.departmentId === undefined))
      .filter((item) => item.sequence > lastSequence)
      .sort((a, b) => a.sequence - b.sequence)
      .slice(0, 20);

      return data;
    } catch (err) {
      console.error("❌ Error fetching interview mcqs:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Interview Fill Blanks
export const fetchInterviewFillBlanks = createAsyncThunk(
  "study/fetchInterviewFillBlanks",
  async ({ selectedDepartmentId, lastSequence }, { rejectWithValue }) => {
    try {
      const collectionRef = firestore().collection("interview_fill_blanks");
      const queryRef = selectedDepartmentId !== undefined && selectedDepartmentId !== null
        ? collectionRef.where("departmentId", "==", selectedDepartmentId)
        : collectionRef;
      const snapshot = await queryRef.get();

      const data = snapshot.docs.map((doc) => {
        const qData = normalizeDocData(doc);
        return {
          question: qData.question || "",
          answer: qData.answer || "",
          sequence: qData.sequence !== undefined ? Number(qData.sequence) : 0,
          ...qData,
        };
      })
      .filter((item) => selectedDepartmentId ? item.departmentId === selectedDepartmentId : (item.departmentId === null || item.departmentId === undefined))
      .filter((item) => item.sequence > lastSequence)
      .sort((a, b) => a.sequence - b.sequence)
      .slice(0, 20);

      return data;
    } catch (err) {
      console.error("❌ Error fetching interview fill blanks:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Interview Flashcards
export const fetchInterviewFlashcards = createAsyncThunk(
  "study/fetchInterviewFlashcards",
  async ({ selectedDepartmentId, lastSequence }, { rejectWithValue }) => {
    try {
      const collectionRef = firestore().collection("interview_flashcards");
      const queryRef = selectedDepartmentId !== undefined && selectedDepartmentId !== null
        ? collectionRef.where("departmentId", "==", selectedDepartmentId)
        : collectionRef;
      const snapshot = await queryRef.get();

      const data = snapshot.docs.map((doc) => {
        const qData = normalizeDocData(doc);
        return {
          front: qData.front || "",
          back: qData.back || "",
          sequence: qData.sequence !== undefined ? Number(qData.sequence) : 0,
          ...qData,
        };
      })
      .filter((item) => selectedDepartmentId ? item.departmentId === selectedDepartmentId : (item.departmentId === null || item.departmentId === undefined))
      .filter((item) => item.sequence > lastSequence)
      .sort((a, b) => a.sequence - b.sequence)
      .slice(0, 20);

      return data;
    } catch (err) {
      console.error("❌ Error fetching interview flashcards:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Interview Progress
export const fetchInterviewProgress = createAsyncThunk(
  "study/fetchInterviewProgress",
  async (_, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const doc = await firestore()
        .collection("interview_progress")
        .doc(userId)
        .get();

      if (doc.exists) {
        return doc.data();
      } else {
        return {
          mcqSequence: 0,
          fillBlankSequence: 0,
          flashcardSequence: 0,
        };
      }
    } catch (err) {
      console.error("❌ Error fetching interview progress:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Update Interview Progress
export const updateInterviewProgress = createAsyncThunk(
  "study/updateInterviewProgress",
  async ({ mcqSequence, fillBlankSequence, flashcardSequence }, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const updateData = {
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      if (mcqSequence !== undefined) updateData.mcqSequence = mcqSequence;
      if (fillBlankSequence !== undefined) updateData.fillBlankSequence = fillBlankSequence;
      if (flashcardSequence !== undefined) updateData.flashcardSequence = flashcardSequence;

      await firestore()
        .collection("interview_progress")
        .doc(userId)
        .set(updateData, { merge: true });

      return updateData;
    } catch (err) {
      console.error("❌ Error updating interview progress:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Fetch Bookmarks
export const fetchBookmarks = createAsyncThunk(
  "study/fetchBookmarks",
  async (_, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const snapshot = await firestore()
        .collection("studyBookmarks")
        .where("userId", "==", userId)
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return data;
    } catch (err) {
      console.error("❌ Error fetching bookmarks:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Toggle Bookmark
export const toggleBookmark = createAsyncThunk(
  "study/toggleBookmark",
  async ({ questionItem, questionType, sourceCollection, topicId, isBookmarked }, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");
      const questionId = questionItem.id;
      const docId = `${userId}_${questionId}`;
      const docRef = firestore().collection("studyBookmarks").doc(docId);

      if (isBookmarked) {
        await docRef.delete();
        return { questionId, isBookmarked: false };
      } else {
        const bookmarkData = {
          userId,
          questionId,
          questionType,
          sourceCollection,
          createdAt: firestore.FieldValue.serverTimestamp(),
          topicId: topicId || null,
          questionItem,
        };
        await docRef.set(bookmarkData);
        return { questionId, isBookmarked: true, bookmark: { id: docId, ...bookmarkData } };
      }
    } catch (err) {
      console.error("❌ Error toggling bookmark:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- Initial State ---
const initialState = {
  communities: [],
  levels: [],
  subjects: [],
  topics: [],
  questions: {}, // Map topicId -> array of COC questions
  oralTopics: [],
  oralSubjects: [],
  oralQuestions: {}, // Map topicId -> array of ORAL questions
  questionCounts: {}, // Map topicId -> { cocCount, oralCount }
  interviewMcqs: [],
  interviewFillBlanks: [],
  interviewFlashcards: [],
  interviewProgress: {
    mcqSequence: 0,
    fillBlankSequence: 0,
    flashcardSequence: 0,
  },
  topicPracticeProgress: {},
  bookmarks: [],
  savedSelection: null,

  loadingCommunities: false,
  loadingLevels: false,
  loadingSubjectsAndTopics: false,
  loadingQuestions: false,
  loadingOralTopics: false,
  loadingOralSubjects: false,
  loadingOralQuestions: false,
  loadingTopicPracticeProgress: false,
  loadingInterviewMcqs: false,
  loadingInterviewFillBlanks: false,
  loadingInterviewFlashcards: false,
  loadingBookmarks: false,
  
  error: null,
};

const studySlice = createSlice({
  name: "study",
  initialState,
  reducers: {
    clearStudyStore: (state) => {
      Object.assign(state, initialState);
    },
    clearQuestions: (state) => {
      state.questions = {};
      state.oralQuestions = {};
    },
    setSavedSelection: (state, action) => {
      state.savedSelection = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Communities
      .addCase(fetchCommunities.pending, (state) => {
        state.loadingCommunities = true;
        state.error = null;
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
        state.loadingCommunities = false;
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.loadingCommunities = false;
        state.error = action.payload;
      })

      // Fetch Levels
      .addCase(fetchLevels.pending, (state) => {
        state.loadingLevels = true;
        state.error = null;
      })
      .addCase(fetchLevels.fulfilled, (state, action) => {
        state.levels = action.payload;
        state.loadingLevels = false;
      })
      .addCase(fetchLevels.rejected, (state, action) => {
        state.loadingLevels = false;
        state.error = action.payload;
      })

      // Fetch Subjects & Topics
      .addCase(fetchSubjectsAndTopics.pending, (state) => {
        state.loadingSubjectsAndTopics = true;
        state.error = null;
      })
      .addCase(fetchSubjectsAndTopics.fulfilled, (state, action) => {
        state.subjects = action.payload.subjects;
        state.topics = action.payload.topics;
        state.loadingSubjectsAndTopics = false;
      })
      .addCase(fetchSubjectsAndTopics.rejected, (state, action) => {
        state.loadingSubjectsAndTopics = false;
        state.error = action.payload;
      })

      // Fetch Questions (COC)
      .addCase(fetchQuestions.pending, (state) => {
        state.loadingQuestions = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        const { topicId, questions } = action.payload;
        state.questions[topicId] = questions;
        state.loadingQuestions = false;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loadingQuestions = false;
        state.error = action.payload;
      })

      // Fetch Oral Topics
      .addCase(fetchOralTopics.pending, (state) => {
        state.loadingOralTopics = true;
        state.error = null;
      })
      .addCase(fetchOralTopics.fulfilled, (state, action) => {
        state.oralTopics = action.payload;
        state.loadingOralTopics = false;
      })
      .addCase(fetchOralTopics.rejected, (state, action) => {
        state.loadingOralTopics = false;
        state.error = action.payload;
      })

      .addCase(fetchOralSubjects.pending, (state) => {
        state.loadingOralSubjects = true;
        state.error = null;
      })
      .addCase(fetchOralSubjects.fulfilled, (state, action) => {
        state.oralSubjects = action.payload;
        state.loadingOralSubjects = false;
      })
      .addCase(fetchOralSubjects.rejected, (state, action) => {
        state.loadingOralSubjects = false;
        state.error = action.payload;
      })

      // Fetch Oral Questions
      .addCase(fetchOralQuestions.pending, (state) => {
        state.loadingOralQuestions = true;
        state.error = null;
      })
      .addCase(fetchOralQuestions.fulfilled, (state, action) => {
        const { topicId, questions } = action.payload;
        state.oralQuestions[topicId] = questions;
        state.loadingOralQuestions = false;
      })
      .addCase(fetchOralQuestions.rejected, (state, action) => {
        state.loadingOralQuestions = false;
        state.error = action.payload;
      })

      .addCase(fetchTopicPracticeProgress.pending, (state) => {
        state.loadingTopicPracticeProgress = true;
      })
      .addCase(fetchTopicPracticeProgress.fulfilled, (state, action) => {
        state.topicPracticeProgress[action.payload.topicId] = action.payload;
        state.loadingTopicPracticeProgress = false;
      })
      .addCase(fetchTopicPracticeProgress.rejected, (state) => {
        state.loadingTopicPracticeProgress = false;
      })

      // Fetch Topic Counts
      .addCase(fetchTopicQuestionCounts.fulfilled, (state, action) => {
        const { topicId, cocCount, oralCount } = action.payload;
        state.questionCounts[topicId] = { cocCount, oralCount };
      })
      .addCase(fetchTopicQuestionCountsBatch.fulfilled, (state, action) => {
        Object.entries(action.payload).forEach(([topicId, counts]) => {
          state.questionCounts[topicId] = counts;
        });
      })

      // Fetch Interview MCQs
      .addCase(fetchInterviewMcqs.pending, (state) => {
        state.loadingInterviewMcqs = true;
        state.error = null;
      })
      .addCase(fetchInterviewMcqs.fulfilled, (state, action) => {
        state.interviewMcqs = action.payload;
        state.loadingInterviewMcqs = false;
      })
      .addCase(fetchInterviewMcqs.rejected, (state, action) => {
        state.loadingInterviewMcqs = false;
        state.error = action.payload;
      })

      // Fetch Interview Fill Blanks
      .addCase(fetchInterviewFillBlanks.pending, (state) => {
        state.loadingInterviewFillBlanks = true;
        state.error = null;
      })
      .addCase(fetchInterviewFillBlanks.fulfilled, (state, action) => {
        state.interviewFillBlanks = action.payload;
        state.loadingInterviewFillBlanks = false;
      })
      .addCase(fetchInterviewFillBlanks.rejected, (state, action) => {
        state.loadingInterviewFillBlanks = false;
        state.error = action.payload;
      })

      // Fetch Interview Flashcards
      .addCase(fetchInterviewFlashcards.pending, (state) => {
        state.loadingInterviewFlashcards = true;
        state.error = null;
      })
      .addCase(fetchInterviewFlashcards.fulfilled, (state, action) => {
        state.interviewFlashcards = action.payload;
        state.loadingInterviewFlashcards = false;
      })
      .addCase(fetchInterviewFlashcards.rejected, (state, action) => {
        state.loadingInterviewFlashcards = false;
        state.error = action.payload;
      })

      // Fetch Interview Progress
      .addCase(fetchInterviewProgress.fulfilled, (state, action) => {
        state.interviewProgress = action.payload;
      })

      // Update Interview Progress
      .addCase(updateInterviewProgress.fulfilled, (state, action) => {
        state.interviewProgress = {
          ...state.interviewProgress,
          ...action.payload,
        };
      })

      .addCase(updateTopicPracticeProgress.fulfilled, (state, action) => {
        const { topicId, ...progress } = action.payload;
        state.topicPracticeProgress[topicId] = {
          ...(state.topicPracticeProgress[topicId] || {}),
          ...progress,
        };
      })

      // Fetch Bookmarks
      .addCase(fetchBookmarks.pending, (state) => {
        state.loadingBookmarks = true;
        state.error = null;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
        state.loadingBookmarks = false;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.loadingBookmarks = false;
        state.error = action.payload;
      })

      // Toggle Bookmark
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const { questionId, isBookmarked, bookmark } = action.payload;
        if (isBookmarked) {
          state.bookmarks.push(bookmark);
        } else {
          state.bookmarks = state.bookmarks.filter((b) => b.questionId !== questionId);
        }
      });
  },
});

export const { clearStudyStore, clearQuestions, setSavedSelection } = studySlice.actions;
export default studySlice.reducer;
