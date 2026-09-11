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

export const fetchSubjectPracticeProgress = createAsyncThunk(
  "study/fetchSubjectPracticeProgress",
  async ({ subjectId }, { rejectWithValue }) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const doc = await firestore()
        .collection("studySubjectProgress")
        .doc(`${userId}_${subjectId}`)
        .get();

      if (doc.exists) {
        const data = doc.data() || {};
        return {
          subjectId,
          mcqSequence: Number(data.mcqSequence || 0),
          fillBlankSequence: Number(data.fillBlankSequence || 0),
          flashcardSequence: Number(data.flashcardSequence || 0),
        };
      }

      return {
        subjectId,
        mcqSequence: 0,
        fillBlankSequence: 0,
        flashcardSequence: 0,
      };
    } catch (err) {
      console.error("❌ Error fetching subject practice progress:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const updateSubjectPracticeProgress = createAsyncThunk(
  "study/updateSubjectPracticeProgress",
  async ({ subjectId, mcqSequence, fillBlankSequence, flashcardSequence }, { rejectWithValue }) => {
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
        .collection("studySubjectProgress")
        .doc(`${userId}_${subjectId}`)
        .set(updateData, { merge: true });

      const payload = { subjectId };
      if (mcqSequence !== undefined) payload.mcqSequence = mcqSequence;
      if (fillBlankSequence !== undefined) payload.fillBlankSequence = fillBlankSequence;
      if (flashcardSequence !== undefined) payload.flashcardSequence = flashcardSequence;

      return payload;
    } catch (err) {
      console.error("❌ Error updating subject practice progress:", err);
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


// --- Study & Guide Actions ---
export const fetchStudyLevels = createAsyncThunk(
  "study/fetchStudyLevels",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("studyLevels").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching Study Levels:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchStudySubjects = createAsyncThunk(
  "study/fetchStudySubjects",
  async (studyLevelId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("studySubjects").where("studyLevelId", "==", studyLevelId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching Study Subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchStudyNotes = createAsyncThunk(
  "study/fetchStudyNotes",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("studyQuestions").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching Study Notes:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- ETO Actions ---
export const fetchEtoSubjects = createAsyncThunk(
  "study/fetchEtoSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("etoSubjects").orderBy("name", "asc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching ETO subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEtoQuestions = createAsyncThunk(
  "study/fetchEtoQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("etoQuestions").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("Error fetching ETO questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- GME Actions ---
export const fetchGmeSubjects = createAsyncThunk(
  "study/fetchGmeSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("gmeSubjects").orderBy("name", "asc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching GME subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGmeQuestions = createAsyncThunk(
  "study/fetchGmeQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("gmeQuestions").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("Error fetching GME questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- B.Tech Actions ---
export const fetchBtechSubjects = createAsyncThunk(
  "study/fetchBtechSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("btechSubjects").orderBy("name", "asc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching B.Tech subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBtechQuestions = createAsyncThunk(
  "study/fetchBtechQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("btechQuestions").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("Error fetching B.Tech questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- DNS Actions ---
export const fetchDnsSubjects = createAsyncThunk(
  "study/fetchDnsSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("dnsSubjects").orderBy("name", "asc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching DNS subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchDnsQuestions = createAsyncThunk(
  "study/fetchDnsQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("dnsQuestions").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("Error fetching DNS questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- GP Actions ---
export const fetchGpSubjects = createAsyncThunk(
  "study/fetchGpSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("gpSubjects").orderBy("name", "asc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching GP subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGpMcqQuestions = createAsyncThunk(
  "study/fetchGpMcqQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("gpMcq").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching GP MCQs:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGpPracticeQuestions = createAsyncThunk(
  "study/fetchGpPracticeQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("gpQuestion").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("Error fetching GP practice questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- STCW Actions ---

export const fetchStcwPracticeQuestions = createAsyncThunk(
  "study/fetchStcwPracticeQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("stcwQuestion").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => {
        const qData = doc.data();
        return {
          id: doc.id,
          question: qData.question || "",
          answer: qData.answerHtml || qData.answer || "",
          ...qData,
        };
      });
    } catch (err) {
      console.error("❌ Error fetching STCW practice questions:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchStcwLevels = createAsyncThunk(
  "study/fetchStcwLevels",
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("stcwLevels").orderBy("name", "asc").get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("❌ Error fetching STCW levels:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchStcwSubjects = createAsyncThunk(
  "study/fetchStcwSubjects",
  async (stcwLevelId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("stcwSubjects").where("stcwLevelId", "==", stcwLevelId).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("❌ Error fetching STCW subjects:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchStcwMcqQuestions = createAsyncThunk(
  "study/fetchStcwMcqQuestions",
  async (subjectId, { rejectWithValue }) => {
    try {
      const snapshot = await firestore().collection("stcwMcq").where("subjectId", "==", subjectId).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("❌ Error fetching STCW MCQs:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- Initial State ---
const initialState = {
  
  stcwLevels: [],
  stcwSubjects: [],
  stcwPracticeQuestions: {},
  loadingStcwPracticeQuestions: false,
  stcwMockExam: { sessions: {} },
  loadingStcwLevels: false,
  loadingStcwSubjects: false,
  
  studyLevels: [],
  studyGuideSubjects: {},
  studyNotes: {},
  loadingStudyLevels: false,
  loadingStudyGuideSubjects: false,
  loadingStudyNotes: false,

  etoSubjects: [],
  etoQuestions: {},
  loadingEtoSubjects: false,
  loadingEtoQuestions: false,

  gmeSubjects: [],
  gmeQuestions: {},
  loadingGmeSubjects: false,
  loadingGmeQuestions: false,

  btechSubjects: [],
  btechQuestions: {},
  loadingBtechSubjects: false,
  loadingBtechQuestions: false,

  dnsSubjects: [],
  dnsQuestions: {},
  loadingDnsSubjects: false,
  loadingDnsQuestions: false,

  gpSubjects: [],
  gpPracticeQuestions: {},
  loadingGpSubjects: false,
  loadingGpPracticeQuestions: false,
  gpMockExam: { sessions: {} },

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
  subjectPracticeProgress: {},
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
  loadingSubjectPracticeProgress: false,
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

    createGpMockExamSession: (state, action) => {
      const { subjectId, questions, durationSeconds } = action.payload;
      state.gpMockExam.sessions[subjectId] = {
        sessionId: Date.now().toString(),
        subjectId,
        questions,
        answers: {},
        currentQuestionIndex: 0,
        startedAt: Date.now(),
        expiresAt: Date.now() + durationSeconds * 1000,
        durationSeconds,
        status: "active"
      };
    },
    updateGpMockExamAnswer: (state, action) => {
      const { subjectId, questionId, selectedOptionNumber } = action.payload;
      const session = state.gpMockExam.sessions[subjectId];
      if (session) {
        session.answers[questionId] = selectedOptionNumber;
      }
    },
    updateGpMockExamIndex: (state, action) => {
      const { subjectId, index } = action.payload;
      const session = state.gpMockExam.sessions[subjectId];
      if (session) {
        session.currentQuestionIndex = index;
      }
    },
    clearGpMockExamSession: (state, action) => {
      const { subjectId } = action.payload;
      if (state.gpMockExam.sessions[subjectId]) {
        delete state.gpMockExam.sessions[subjectId];
      }
    },
    createStcwMockExamSession: (state, action) => {
      const { subjectId, questions, durationSeconds } = action.payload;
      state.stcwMockExam.sessions[subjectId] = {
        sessionId: Date.now().toString(),
        subjectId,
        questions,
        answers: {},
        currentQuestionIndex: 0,
        startedAt: Date.now(),
        expiresAt: Date.now() + durationSeconds * 1000,
        durationSeconds,
        status: "active"
      };
    },
    updateStcwMockExamAnswer: (state, action) => {
      const { subjectId, questionId, selectedOptionNumber } = action.payload;
      const session = state.stcwMockExam.sessions[subjectId];
      if (session) {
        session.answers[questionId] = selectedOptionNumber;
      }
    },
    updateStcwMockExamIndex: (state, action) => {
      const { subjectId, index } = action.payload;
      const session = state.stcwMockExam.sessions[subjectId];
      if (session) {
        session.currentQuestionIndex = index;
      }
    },
    clearStcwMockExamSession: (state, action) => {
      const { subjectId } = action.payload;
      if (state.stcwMockExam.sessions[subjectId]) {
        delete state.stcwMockExam.sessions[subjectId];
      }
    },

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

      // Study & Guide
      .addCase(fetchStudyLevels.pending, (state) => { state.loadingStudyLevels = true; })
      .addCase(fetchStudyLevels.fulfilled, (state, action) => { state.studyLevels = action.payload; state.loadingStudyLevels = false; })
      .addCase(fetchStudyLevels.rejected, (state, action) => { state.loadingStudyLevels = false; })

      .addCase(fetchStudySubjects.pending, (state) => { state.loadingStudyGuideSubjects = true; })
      .addCase(fetchStudySubjects.fulfilled, (state, action) => {
        state.studyGuideSubjects[action.meta.arg] = action.payload;
        state.loadingStudyGuideSubjects = false;
      })
      .addCase(fetchStudySubjects.rejected, (state, action) => { state.loadingStudyGuideSubjects = false; })

      .addCase(fetchStudyNotes.pending, (state) => { state.loadingStudyNotes = true; })
      .addCase(fetchStudyNotes.fulfilled, (state, action) => {
        state.studyNotes[action.meta.arg] = action.payload;
        state.loadingStudyNotes = false;
      })
      .addCase(fetchStudyNotes.rejected, (state, action) => { state.loadingStudyNotes = false; })

      // ETO Subjects
      .addCase(fetchEtoSubjects.pending, (state) => { state.loadingEtoSubjects = true; })
      .addCase(fetchEtoSubjects.fulfilled, (state, action) => { state.etoSubjects = action.payload; state.loadingEtoSubjects = false; })
      .addCase(fetchEtoSubjects.rejected, (state, action) => { state.loadingEtoSubjects = false; state.error = action.payload; })
      
      // ETO Questions
      .addCase(fetchEtoQuestions.pending, (state) => { state.loadingEtoQuestions = true; })
      .addCase(fetchEtoQuestions.fulfilled, (state, action) => {
        state.etoQuestions[action.meta.arg] = action.payload;
        state.loadingEtoQuestions = false;
      })
      .addCase(fetchEtoQuestions.rejected, (state, action) => { state.loadingEtoQuestions = false; state.error = action.payload; })

      // GME Subjects
      .addCase(fetchGmeSubjects.pending, (state) => { state.loadingGmeSubjects = true; })
      .addCase(fetchGmeSubjects.fulfilled, (state, action) => { state.gmeSubjects = action.payload; state.loadingGmeSubjects = false; })
      .addCase(fetchGmeSubjects.rejected, (state, action) => { state.loadingGmeSubjects = false; state.error = action.payload; })
      
      // GME Questions
      .addCase(fetchGmeQuestions.pending, (state) => { state.loadingGmeQuestions = true; })
      .addCase(fetchGmeQuestions.fulfilled, (state, action) => {
        state.gmeQuestions[action.meta.arg] = action.payload;
        state.loadingGmeQuestions = false;
      })
      .addCase(fetchGmeQuestions.rejected, (state, action) => { state.loadingGmeQuestions = false; state.error = action.payload; })

      // B.Tech Subjects
      .addCase(fetchBtechSubjects.pending, (state) => { state.loadingBtechSubjects = true; })
      .addCase(fetchBtechSubjects.fulfilled, (state, action) => { state.btechSubjects = action.payload; state.loadingBtechSubjects = false; })
      .addCase(fetchBtechSubjects.rejected, (state, action) => { state.loadingBtechSubjects = false; state.error = action.payload; })
      
      // B.Tech Questions
      .addCase(fetchBtechQuestions.pending, (state) => { state.loadingBtechQuestions = true; })
      .addCase(fetchBtechQuestions.fulfilled, (state, action) => {
        state.btechQuestions[action.meta.arg] = action.payload;
        state.loadingBtechQuestions = false;
      })
      .addCase(fetchBtechQuestions.rejected, (state, action) => { state.loadingBtechQuestions = false; state.error = action.payload; })

      // DNS Subjects
      .addCase(fetchDnsSubjects.pending, (state) => { state.loadingDnsSubjects = true; })
      .addCase(fetchDnsSubjects.fulfilled, (state, action) => { state.dnsSubjects = action.payload; state.loadingDnsSubjects = false; })
      .addCase(fetchDnsSubjects.rejected, (state, action) => { state.loadingDnsSubjects = false; state.error = action.payload; })
      
      // DNS Questions
      .addCase(fetchDnsQuestions.pending, (state) => { state.loadingDnsQuestions = true; })
      .addCase(fetchDnsQuestions.fulfilled, (state, action) => {
        state.dnsQuestions[action.meta.arg] = action.payload;
        state.loadingDnsQuestions = false;
      })
      .addCase(fetchDnsQuestions.rejected, (state, action) => { state.loadingDnsQuestions = false; state.error = action.payload; })

      // GP Subjects
      .addCase(fetchGpSubjects.pending, (state) => {
        state.loadingGpSubjects = true;
      })
      .addCase(fetchGpSubjects.fulfilled, (state, action) => {
        state.gpSubjects = action.payload;
        state.loadingGpSubjects = false;
      })
      .addCase(fetchGpSubjects.rejected, (state, action) => {
        state.loadingGpSubjects = false;
        state.error = action.payload;
      })
      // GP Practice
      .addCase(fetchGpPracticeQuestions.pending, (state) => {
        state.loadingGpPracticeQuestions = true;
      })
      .addCase(fetchGpPracticeQuestions.fulfilled, (state, action) => {
        const subjectId = action.meta.arg;
        state.gpPracticeQuestions[subjectId] = action.payload;
        state.loadingGpPracticeQuestions = false;
      })
      .addCase(fetchGpPracticeQuestions.rejected, (state, action) => {
        state.loadingGpPracticeQuestions = false;
        state.error = action.payload;
      })

      // STCW Practice
      .addCase(fetchStcwPracticeQuestions.pending, (state) => {
        state.loadingStcwPracticeQuestions = true;
      })
      .addCase(fetchStcwPracticeQuestions.fulfilled, (state, action) => {
        const subjectId = action.meta.arg;
        state.stcwPracticeQuestions[subjectId] = action.payload;
        state.loadingStcwPracticeQuestions = false;
      })
      .addCase(fetchStcwPracticeQuestions.rejected, (state, action) => {
        state.loadingStcwPracticeQuestions = false;
        state.error = action.payload;
      })
      // STCW Levels
      .addCase(fetchStcwLevels.pending, (state) => {
        state.loadingStcwLevels = true;
      })
      .addCase(fetchStcwLevels.fulfilled, (state, action) => {
        state.stcwLevels = action.payload;
        state.loadingStcwLevels = false;
      })
      .addCase(fetchStcwLevels.rejected, (state, action) => {
        state.loadingStcwLevels = false;
        state.error = action.payload;
      })
      // STCW Subjects
      .addCase(fetchStcwSubjects.pending, (state) => {
        state.loadingStcwSubjects = true;
      })
      .addCase(fetchStcwSubjects.fulfilled, (state, action) => {
        state.stcwSubjects = action.payload;
        state.loadingStcwSubjects = false;
      })
      .addCase(fetchStcwSubjects.rejected, (state, action) => {
        state.loadingStcwSubjects = false;
        state.error = action.payload;
      })

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

      .addCase(fetchSubjectPracticeProgress.pending, (state) => {
        state.loadingSubjectPracticeProgress = true;
      })
      .addCase(fetchSubjectPracticeProgress.fulfilled, (state, action) => {
        state.subjectPracticeProgress[action.payload.subjectId] = action.payload;
        state.loadingSubjectPracticeProgress = false;
      })
      .addCase(fetchSubjectPracticeProgress.rejected, (state) => {
        state.loadingSubjectPracticeProgress = false;
      })

      .addCase(updateSubjectPracticeProgress.fulfilled, (state, action) => {
        const { subjectId, ...progress } = action.payload;
        state.subjectPracticeProgress[subjectId] = {
          ...(state.subjectPracticeProgress[subjectId] || {}),
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

export const { clearStudyStore, clearQuestions, setSavedSelection, createStcwMockExamSession, updateStcwMockExamAnswer, updateStcwMockExamIndex, clearStcwMockExamSession, createGpMockExamSession, updateGpMockExamAnswer, updateGpMockExamIndex, clearGpMockExamSession } = studySlice.actions;
export default studySlice.reducer;
