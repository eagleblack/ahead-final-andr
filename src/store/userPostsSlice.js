// userPostsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore ,{FieldValue,FieldPath}from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

let unsubscribeUserPosts = null;

/**
 * 🔄 Start listening to user's posts (with snapshot)
 */

const enrichPosts = async (posts, currentUserId) => {
  if (!posts.length) return [];
 
  const userIds = [...new Set(posts.map((p) => p.userId).filter(Boolean))];

  const userMap = {};
  if (userIds.length) {
    const userDocs = await firestore()
      .collection("users")
      .where("uid", "in", userIds)
      .get();
    userDocs.forEach((doc) => {
      userMap[doc.id] = doc.data();
    });
  }

  const likesSnapshot = await firestore()
    .collectionGroup("likes")
    .where("userId", "==", currentUserId)
    .orderBy("createdAt", "desc")
    .get();
  const likedPostIds = likesSnapshot.docs.map((d) => d.ref.parent.parent.id);


const votesSnapshot = await firestore()
  .collectionGroup("votes")
  .where("userId", "==", currentUserId)
   .orderBy("createdAt", "desc")
  .get();

const voteMap = {};
votesSnapshot.docs.forEach((doc) => {
  const postId = doc.ref.parent.parent.id;
  voteMap[postId] = doc.data().optionIndex;
});
  return posts.map((post) => {
  const userData = userMap[post.userId] || {};

  const votedOption = voteMap[post.id]; // 👈 get voted option

  return {
    ...post,
    likedByCurrentUser: likedPostIds.includes(post.id),
    bookmarkedByCurrentUser:false,
    totalLikes: post.totalLikes || 0,
    totalViews: post.totalViews || 0,

    // ✅ FIXED
    isVoted: votedOption !== undefined,
    votedOption: votedOption ?? null,

    user: {
      uid: userData.uid || post.userId,
      name: userData.name || "Anonymous",
      avatar: userData.profilePic || "https://i.pravatar.cc/150",
      tagline: userData.profileTitle || "A new user",
    },
  };
});  
};
export const listenToUserPosts = createAsyncThunk(
  "userPosts/listenToUserPosts",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      // 🔁 detach old listener
      if (unsubscribeUserPosts) unsubscribeUserPosts();

      unsubscribeUserPosts = firestore()
        .collection("posts")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(20)
        .onSnapshot(
  async (snapshot) => {
    try {
      if (snapshot.empty) {
        dispatch(setUserPosts([]));
        return;
      }

      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 👇 move heavy work outside

     const enriched =  await enrichPosts(posts, user.uid);
    //console.error(enriched)
    dispatch(setUserPosts(enriched)); // ✅ FIX

    } catch (err) {
      console.error("Snapshot error:", err);
      dispatch(setUserPostsError(err.message));
    }
  },
        );

      return true;
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to listen to user posts"
      );
    }
  }
);

/**
 * ❤️ Toggle like/unlike on user's posts
 */
export const toggleLikeUserPost = createAsyncThunk(
  "userPosts/toggleLikeUserPost",
  async (post, { rejectWithValue }) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const postRef = firestore().collection("posts").doc(post.id);
      const likeRef = postRef.collection("likes").doc(user.uid);
      const likeDoc = await likeRef.get();

      if (
        (typeof likeDoc.exists === "function" && likeDoc.exists()) ||
        (typeof likeDoc.exists === "boolean" && likeDoc.exists)
      ) {
        // unlike
        await likeRef.delete();
        await postRef.update({
          totalLikes: FieldValue.increment(-1),
        });
        return { postId: post.id, liked: false };
      } else {
        // like
        await likeRef.set({
          createdAt: FieldValue.serverTimestamp(),
        });
        await postRef.update({
          totalLikes: FieldValue.increment(1),
        });
        return { postId: post.id, liked: true };
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      return rejectWithValue(err.message || "Failed to toggle like");
    }
  }
);

const userPostsSlice = createSlice({
  name: "userPosts",
  initialState: {
    posts: [],
    loading: false,
    error: null,
  },
  reducers: {
    setUserPosts: (state, action) => {
      state.posts = action.payload;
      state.loading = false;
    },
    setUserPostsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    toggleUserPostOptimistic: (state, action) => {
      const { postId } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        if (post.likedByCurrentUser) {
          post.likedByCurrentUser = false;
          if (post.totalLikes > 0) post.totalLikes -= 1;
        } else {
          post.likedByCurrentUser = true;
          post.totalLikes += 1;
        }
      }
    },
     votePollOptimisticProfile: (state, action) => {
  const { postId, optionIndex } = action.payload;

  const post = state.posts.find((p) => p.id === postId);
  if (!post || !post.poll?.options) return;

  const prev = post.votedOption;

  // 🆕 First vote
  if (prev === null || prev === undefined) {
    post.poll.options[optionIndex].votes += 1;
    post.poll.totalVotes += 1;
  }

  // 🔄 Revote
  else if (prev !== optionIndex) {
    if (typeof prev === "number" && post.poll.options[prev]) {
      post.poll.options[prev].votes -= 1;
    }
    post.poll.options[optionIndex].votes += 1;
  }

  // ✅ update local state
  post.votedOption = optionIndex;
  post.isVoted = true;
},
  },
  extraReducers: (builder) => {
    builder
      .addCase(listenToUserPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(listenToUserPosts.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(toggleLikeUserPost.fulfilled, (state, action) => {
        const { postId, liked } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.likedByCurrentUser = liked;
          if (post.totalLikes < 0) post.totalLikes = 0;
        }
      });
  },
});

export const {
  setUserPosts,
  setUserPostsError,
  toggleUserPostOptimistic,votePollOptimisticProfile
} = userPostsSlice.actions;

export default userPostsSlice.reducer;
