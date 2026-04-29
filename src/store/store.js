import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers } from "redux";

import userReducer from "./userSlice";
import feedReducer from "./feedSlice"; // 👈 import feed slice
import userPostsSlice from "./userPostsSlice"; // 👈 import feed slice
import commentsReducer from "./commentsSlice"; // 👈 import feed slice
import otherProfileReducer from "./otherProfileSlice"; // 👈 import feed slice
import chatReducer from "./chatSlice"; // 👈 import feed slice
import chatListReducer from "./chatListSlice"; // 👈 import feed slice
import otherProfilePostReducer from "./otherProfilePostSlice"; // 👈 import feed slice
import bookmarkReducer from "./bookMarkSlice"; // 👈 import feed slice
import groupChatReducer from "./groupChatSlice"; // 👈 import feed slice
import newsReducer from "./newsSlice"; // 👈 import feed slice
import auth from "@react-native-firebase/auth"; // assuming Firebase Auth is used
import notificationReducer from "./notificationsSlice"; // 👈 import feed slice
import jobsReducer from "./JobSlice"; // 👈 import feed slice
import companyReducer from "./companySlice"; // 👈 import feed slice
import followerReducer from "./followersSlice"; // 👈 import feed slice
import appliedJobsReducer from "./appliedJobSlice"; // 👈 import feed slice
import selectionReducer from "./selectionSlice"; // 👈 import feed slice
import firestore ,{FieldValue,FieldPath}from "@react-native-firebase/firestore";


    








export const logoutUser = async (dispatch) => {
  try {
    console.log("🚪 Logging out...");

    const user = auth().currentUser;

    if (user?.uid) {
      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          fcmToken: null,
        });
    }

    await auth().signOut();

    // 💥 Reset Redux memory
    dispatch({ type: "RESET_APP" });

    // 🧹 Clear storage
    await persistor.purge();
    await AsyncStorage.clear();

    console.log("✅ Logged out successfully.");
  } catch (err) {
    console.error("❌ Logout failed:", err);
  }
};

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
   whitelist: ["user"], // only persist user slice
};

const appReducer = combineReducers({
  user: userReducer,
  feed: feedReducer,
  userPosts: userPostsSlice,
  comments: commentsReducer,
  otherProfile: otherProfileReducer,
  chat: chatReducer,
  chatList: chatListReducer,
  otherProfilePost: otherProfilePostReducer,
  bookmarks: bookmarkReducer,
  groupChat: groupChatReducer,
  news: newsReducer,
  notifications: notificationReducer,
  jobs: jobsReducer,
  company: companyReducer,
  followers: followerReducer,
  appliedJobs: appliedJobsReducer,
  selection: selectionReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "RESET_APP") {
    state = undefined; // 💥 wipes everything
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);
