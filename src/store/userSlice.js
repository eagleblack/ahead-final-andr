// userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const initialState = {
  user: null,
  loading: false,
  error: null,
  unsubscribe: null, // 👈 keep track of snapshot listener for cleanup
};
export const blockUser = createAsyncThunk(
  "feed/blockUser",
  async ({ blockedUserId }, { rejectWithValue }) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const myId = user.uid;

      const blockRef = firestore()
        .collection("users")
        .doc(myId)
        .collection("blockedUsers")
        .doc(blockedUserId);

      const blockedByRef = firestore()
        .collection("users")
        .doc(blockedUserId)
        .collection("blockedBy")
        .doc(myId);

      const blockDoc = await blockRef.get();

      if (blockDoc.exists()) {
        return { blockedUserId, alreadyBlocked: true };
      }

      // 🔥 batch write (IMPORTANT)
      const batch = firestore().batch();

      batch.set(blockRef, {
        blockedUserId,
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.set(blockedByRef, {
        blockedByUserId: myId,
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return { blockedUserId };
    } catch (err) {
      console.error("blockUser error:", err);
      return rejectWithValue(err.message || "Failed to block user");
    }
  }
);
// ✅ One-time fetch user data
export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const uid = auth().currentUser?.uid;
      if (!uid) return rejectWithValue("No user logged in");

      const doc = await firestore().collection("users").doc(uid).get();
      if (doc.exists) {
        return doc.data();
      } else {
        return rejectWithValue("User not found");
      }
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch user");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      if (state.unsubscribe) {
        state.unsubscribe(); // stop listening
        state.unsubscribe = null;
      }
    },
    setListener: (state, action) => {
      state.unsubscribe = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // One-time fetch
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ Real-time user listener
export const listenToUser = () => (dispatch, getState) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;

  // cleanup old listener if exists
  const { unsubscribe } = getState().user;
  if (unsubscribe) unsubscribe();

  const unsubscribeFn = firestore()
    .collection("users")
    .doc(uid)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          dispatch(setUser(doc.data()));
        } else {
          dispatch(clearUser());
        }
      },
      (error) => {
        console.error("User snapshot error:", error);
      }
    );

  dispatch(setListener(unsubscribeFn));
};

export const { setUser, clearUser, setListener } = userSlice.actions;
export default userSlice.reducer;
