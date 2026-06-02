import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

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

// Fetch all subjects and topics for a given community (filtering levels in-memory for index-safety)
export const fetchSubjectsAndTopics = createAsyncThunk(
  "study/fetchSubjectsAndTopics",
  async ({ communityId, examLevelId }, { rejectWithValue }) => {
    try {
      // Fetch subjects for this community
      const subjectsSnapshot = await firestore()
        .collection("subjects")
        .where("communityId", "==", communityId)
        .get();

      const allSubjects = subjectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const sanitized = {};
        Object.keys(data).forEach((key) => {
          sanitized[key.trim()] = data[key];
        });
        return {
          id: doc.id,
          ...sanitized,
        };
      });

      // Filter by examLevelId in-memory to prevent requiring custom composite indexes
      const filteredSubjects = allSubjects.filter(
        (sub) => sub.examLevelId === examLevelId
      );

      // Fetch topics for this community
      const topicsSnapshot = await firestore()
        .collection("topics")
        .where("communityId", "==", communityId)
        .get();

      const allTopics = topicsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const sanitized = {};
        Object.keys(data).forEach((key) => {
          sanitized[key.trim()] = data[key];
        });
        return {
          id: doc.id,
          ...sanitized,
        };
      });

      // Filter by examLevelId in-memory
      const filteredTopics = allTopics.filter(
        (topic) => topic.examLevelId === examLevelId
      );

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
        const rawData = doc.data();
        const qData = {};
        Object.keys(rawData).forEach((key) => {
          qData[key.trim()] = rawData[key];
        });
        
        return {
          id: doc.id,
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
        const rawData = doc.data();
        const tData = {};
        Object.keys(rawData).forEach((key) => {
          tData[key.trim()] = rawData[key];
        });
        return {
          id: doc.id,
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
  async (topicId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection("oral")
        .where("topicId", "==", topicId)
        .get();

      const data = snapshot.docs.map((doc) => {
        const rawData = doc.data();
        const qData = {};
        Object.keys(rawData).forEach((key) => {
          qData[key.trim()] = rawData[key];
        });
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          year: qData.askedYears && qData.askedYears.length > 0
            ? `Asked in ${qData.askedYears.join(", ")}`
            : qData.year || "",
          ...qData,
        };
      });
      return { topicId, questions: data };
    } catch (err) {
      console.error("❌ Error fetching oral questions:", err);
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

// Fetch Interview MCQs
export const fetchInterviewMcqs = createAsyncThunk(
  "study/fetchInterviewMcqs",
  async ({ selectedDepartmentId, lastSequence }, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("interview_mcqs").get();

      const data = snapshot.docs.map((doc) => {
        const rawData = doc.data();
        const qData = {};
        Object.keys(rawData).forEach((key) => {
          qData[key.trim()] = rawData[key];
        });
        return {
          id: doc.id,
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
      const snapshot = await firestore().collection("interview_fill_blanks").get();

      const data = snapshot.docs.map((doc) => {
        const rawData = doc.data();
        const qData = {};
        Object.keys(rawData).forEach((key) => {
          qData[key.trim()] = rawData[key];
        });
        return {
          id: doc.id,
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
      const snapshot = await firestore().collection("interview_flashcards").get();

      const data = snapshot.docs.map((doc) => {
        const rawData = doc.data();
        const qData = {};
        Object.keys(rawData).forEach((key) => {
          qData[key.trim()] = rawData[key];
        });
        return {
          id: doc.id,
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
  bookmarks: [],
  savedSelection: null,

  loadingCommunities: false,
  loadingLevels: false,
  loadingSubjectsAndTopics: false,
  loadingQuestions: false,
  loadingOralTopics: false,
  loadingOralQuestions: false,
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

      // Fetch Topic Counts
      .addCase(fetchTopicQuestionCounts.fulfilled, (state, action) => {
        const { topicId, cocCount, oralCount } = action.payload;
        state.questionCounts[topicId] = { cocCount, oralCount };
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
