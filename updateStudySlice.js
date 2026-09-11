const fs = require('fs');
const file = 'c:/Users/NIKHIL/Desktop/final/aheadai/src/store/studySlice.js';
let content = fs.readFileSync(file, 'utf8');

const stcwActions = `
// --- STCW Actions ---

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
`;

if (!content.includes('fetchStcwLevels')) {
  content = content.replace('// --- Initial State ---', stcwActions + '\n// --- Initial State ---');
}

const stcwInitialState = `
  stcwLevels: [],
  stcwSubjects: [],
  stcwMockExam: { sessions: {} },
  loadingStcwLevels: false,
  loadingStcwSubjects: false,
`;

if (!content.includes('stcwLevels: []')) {
  content = content.replace('communities: [],', stcwInitialState + '\n  communities: [],');
}

const stcwReducers = `
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
`;

if (!content.includes('createStcwMockExamSession')) {
  content = content.replace('reducers: {', 'reducers: {\n' + stcwReducers);
}

const stcwExtraReducers = `
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
`;

if (!content.includes('fetchStcwLevels.pending')) {
  content = content.replace('extraReducers: (builder) => {\n    builder', 'extraReducers: (builder) => {\n    builder\n' + stcwExtraReducers);
}

const exportsMatch = content.match(/export const \{([^}]+)\}\s*=\s*studySlice\.actions;/);
if (exportsMatch && !exportsMatch[0].includes('createStcwMockExamSession')) {
  const exportsList = exportsMatch[1].trim();
  const newExports = exportsList + ', createStcwMockExamSession, updateStcwMockExamAnswer, updateStcwMockExamIndex, clearStcwMockExamSession';
  content = content.replace(exportsMatch[0], 'export const { ' + newExports + ' } = studySlice.actions;');
}

fs.writeFileSync(file, content);
console.log('Update studySlice complete');
