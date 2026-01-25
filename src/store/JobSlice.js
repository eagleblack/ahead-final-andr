import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import firestore,{FieldValue,FieldPath} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getChatId } from "../services/chatService";
const COMPANY_SWIPE_WINDOW_DAYS = 15;
const JOBS_PER_PAGE = 30;
import axios from 'axios';
const sendMatchMessages = async (chatId, userId, companyId, job) => {
  const ref = firestore().collection("chats").doc(chatId);
  const chatDoc = await ref.get();

  if (!chatDoc.exists()) {
    await ref.set({
      participants: [companyId, userId],
      status: "ACCEPTED",
      requestedBy: companyId,
      acceptedBy: companyId,

      isJobMessage: true,
      jobId: job.id,
      jobTitle: job.title,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),

      lastMessage: {
        text: `Hey, can I get more info about ${job.title}?`,
        from: userId,
        sentOn: FieldValue.serverTimestamp(),
        status:'UNREAD',
      },
    });

    await ref.collection("messages").add({
      from: companyId,
      to: userId,
      text: `User swiped for your job: ${job.title}`,
      type: "MESSAGE",
      sentOn: FieldValue.serverTimestamp(),
    });

    await ref.collection("messages").add({
      from: userId,
      to: companyId,
      text: `Hey, can I get more info about ${job.title}?`,
      type: "MESSAGE",
      sentOn: FieldValue.serverTimestamp(),
    });
  }
};
// 🔹 Fetch jobs paginated


export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.user.user;
      if (!user?.uid) throw new Error("User not logged in");

      const now = firestore.Timestamp.now();

      // ✅ Parse saved timestamps safely
      let lastSwipedDeadline = user?.lastSwipedDeadline;
      let lastSwipedCreatedAt = user?.lastSwipedCreatedAt;

      if (lastSwipedDeadline && !(lastSwipedDeadline instanceof firestore.Timestamp)) {
        lastSwipedDeadline = new firestore.Timestamp(
          lastSwipedDeadline.seconds,
          lastSwipedDeadline.nanoseconds
        );
      }

      if (lastSwipedCreatedAt && !(lastSwipedCreatedAt instanceof firestore.Timestamp)) {
        lastSwipedCreatedAt = new firestore.Timestamp(
          lastSwipedCreatedAt.seconds,
          lastSwipedCreatedAt.nanoseconds
        );
      }

      console.log("🕒 lastSwipedDeadline:", lastSwipedDeadline);
      console.log("🕒 lastSwipedCreatedAt:", lastSwipedCreatedAt);

      // 🔹 Step 1: Base Firestore query
    let query = firestore()
  .collection("jobs")
  .where("status", "==", "open")
  .where("deadline", ">", now); // inequality field
   console.log(user)
// ✅ Conditionally filter by jobType if user.value exists
if (user.label=="I am a") {
  
  query = query.where("jobType", "==", user.value);
  console.log("🎯 Filtering jobs for jobType:", user.value);
} else {
  console.log("⚪ No user.value found — fetching all job types");
}

// Continue ordering + limit
query = query
  .orderBy("deadline", "asc")
  .orderBy("createdAt", "asc")
  .limit(JOBS_PER_PAGE);

      // 🔹 Step 2: Apply pagination if we have last swipe info
      if (lastSwipedDeadline && lastSwipedCreatedAt) {
        console.log(
          "⏩ [fetchJobs] Paginating startAfter:",
          lastSwipedDeadline.toDate(),
          lastSwipedCreatedAt.toDate()
        );
        query = query.startAfter(lastSwipedDeadline, lastSwipedCreatedAt);
      }

      // 🔹 Step 3: Fetch jobs
      const snapshot = await query.get();
      console.log("📦 Jobs fetched:", snapshot.size);

      // 🔹 Step 4: Check company swipe activity (15-day window)
      const companySwipeCache = new Map();
      const fifteenDaysAgo = firestore.Timestamp.fromDate(
        new Date(Date.now() - COMPANY_SWIPE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      );

      const companyIds = [...new Set(snapshot.docs.map(doc => doc.data().companyId))];

      await Promise.all(
        companyIds.map(async companyId => {
          try {
            const swipeSnap = await firestore()
              .collection("users")
              .doc(companyId)
              .collection("swipedUsers")
              .where("userId", "==", user.uid)
              .where("createdAt", ">", fifteenDaysAgo)
              .limit(1)
              .get();

            companySwipeCache.set(companyId, !swipeSnap.empty);
          } catch (err) {
            console.log(`⚠️ Swipe check failed for company ${companyId}:`, err);
            companySwipeCache.set(companyId, false);
          }
        })
      );

      // 🔹 Step 5: Map jobs with swipe flag
      const jobs = snapshot.docs.map(doc => {
        const jobData = doc.data();
        const companyId = jobData.companyId;
        return {
          id: doc.id,
          ...jobData,
          hasCompanySwipedUserRecently: companySwipeCache.get(companyId) || false,
        };
      });

      console.log("✅ Jobs prepared:", jobs.length);
      return jobs;
    } catch (error) {
      console.warn("🔥 Firestore fetchJobs error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// 🔹 Save user swipe

export const swipeJob = createAsyncThunk(
  "jobs/swipeJob",
  async ({ job, direction }, { getState, rejectWithValue }) => {
    console.log("🚀 swipeJob called with:", { job, direction });

    try {
      const state = getState();
      const user = state.user.user;
      const now = firestore.Timestamp.now();

      if (!user || !user.uid) {
        console.log("❌ No user found in state.user.user");
        return rejectWithValue("User not authenticated");
      }

      if (!job || !job.id) {
        console.log("❌ Invalid job object passed:", job);
        return rejectWithValue("Invalid job data");
      }

      const userRef = firestore().collection("users").doc(user.uid);
      const swipedJobRef = userRef.collection("swipedJobs").doc(job.id);
      const swipeRef = firestore().collection("swipes").doc();
      const batch = firestore().batch();

      console.log("📝 Checking if already swiped...");
      const existingSwipe = await swipedJobRef.get();
      console.log(existingSwipe)
      if (existingSwipe.exists()) {
        console.log(`⏭️ Already swiped this job: ${job.title} — Direction: ${existingSwipe.data().direction}`);
        return { jobId: job.id, direction: existingSwipe.data().direction };
      }

      console.log("✅ Creating new swipe docs...");

      batch.set(swipeRef, {
        swiperId: user.uid,
        targetId: job.id,
        targetType: "job",
        direction,
        createdAt: now,
        validUntil: job.deadline || null,
        companyId: job.companyId || null,
        jobTitle: job.title || "Untitled",
        jobDescription: job.description || "",
      });

      batch.set(swipedJobRef, {
        direction,
        createdAt: now,
        jobTitle: job.title || "Untitled",
        jobDescription: job.description || "",
        validUntil: job.deadline || null,
        companyId: job.companyId || null,
      });

      console.log("📦 Updating user last swipe metadata...");
      batch.update(userRef, {
        lastSwipedDeadline: job.deadline || null,
        lastSwipedCreatedAt: job.createdAt || now,
      });

      console.log("📤 Committing batch...");
      await batch.commit();
      console.log("✅ Batch committed successfully");

      console.log("🏢 Checking if company already swiped this user...");
        
      console.log("✅ swipeJob completed for jobId:", job.id);
      return { jobId: job.id, direction };
    } catch (error) {
      console.log("⚠️ Firestore swipeJob error:", error);
      return rejectWithValue(error.message);
    }
  }
);


// 🔹 Redux slice
const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetJobs: (state) => {
      state.jobs = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = [...state.jobs, ...action.payload];
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch jobs';
      })
      .addCase(swipeJob.rejected, (state, action) => {
        state.error = action.payload || 'Failed to record swipe';
      });
  },
});

export const { resetJobs } = jobSlice.actions;
export default jobSlice.reducer;