// feedSlice.js (Trending + Recent Support)
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import firestore,{FieldValue,FieldPath} from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

console.log("[feedSlice] module loaded");

const docExists = (doc) =>
  typeof doc.exists === "function" ? doc.exists() : !!doc.exists;

const togglingPosts = new Set();
 
const enrichPosts = async (posts, currentUserId) => {
  if (!posts.length) return [];
    const reportsSnap = await firestore()
    .collectionGroup("reports")
    .where("userId", "==", currentUserId)
    .orderBy("createdAt", "desc")
    .get();
console.log("REPORT DOCS:", reportsSnap.docs.length);

reportsSnap.docs.forEach((doc) => {
  console.log("Report Path:", doc.ref.path);
  console.log("Post ID:", doc.ref.parent.parent?.id);
});
  const reportedPostIds = new Set(
    reportsSnap.docs
      .map((doc) => doc.ref.parent.parent?.id)
      .filter(Boolean)
  );

  // ✅ STEP 2: filter safely.  
  const filteredPosts = posts.filter(
    (post) => !reportedPostIds.has(post.id)
  );

  if (!filteredPosts.length) return [];
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

  const bookmarksSnapshot = await firestore()
    .collectionGroup("bookmarks")
    .where("userId", "==", currentUserId)
    .orderBy("createdAt", "desc")
    .get();
  const bookmarkedPostIds = bookmarksSnapshot.docs.map(
    (d) => d.ref.parent.parent.id
  );
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
  return filteredPosts.map((post) => {
  const userData = userMap[post.userId] || {};

  const votedOption = voteMap[post.id]; // 👈 get voted option

  return {
    ...post,
    likedByCurrentUser: likedPostIds.includes(post.id),
    bookmarkedByCurrentUser: bookmarkedPostIds.includes(post.id),
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
export const markPostSeen = createAsyncThunk(
  "feed/markPostSeen",
  async (postId, { getState }) => {
    try {
      const user = getState().user.user;
      if (!user?.uid || !postId) return;

      const postRef = firestore().collection("posts").doc(postId);
      const viewRef = postRef.collection("views").doc(user.uid);

      await firestore().runTransaction(async (transaction) => {
        const viewDoc = await transaction.get(viewRef);

        if (!viewDoc.exists()) {
          transaction.set(viewRef, {
            seenAt: firestore.FieldValue.serverTimestamp(),
          });

          transaction.update(postRef, {
            totalViews: firestore.FieldValue.increment(1),
          });
        }
      });
    } catch (err) {
      console.log("markPostSeen error:", err);
    }
  }
);

//
// 🔹 Fetch Trending (postIndex desc)
//
export const reportPost = createAsyncThunk(
  "feed/reportPost",
  async ({ postId, reason }, { rejectWithValue }) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      const postRef = firestore().collection("posts").doc(postId);
      const reportRef = postRef.collection("reports").doc(user.uid);

      const reportDoc = await reportRef.get();

      // ❌ already reported
      if (docExists(reportDoc)) {
        return { postId, alreadyReported: true };
      }

      // ✅ save report
      await reportRef.set({
        userId: user.uid,
        reason,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 🔥 optional: increment report count
      await postRef.update({
        reportCount: FieldValue.increment(1),
      });

      return { postId };
    } catch (err) {
      console.error("reportPost error:", err);
      return rejectWithValue(err.message || "Failed to report post");
    }
  }
);
export const votePoll = createAsyncThunk(
  "feed/votePoll",
  async ({ postId, optionIndex }, { rejectWithValue }) => {
    try {
      console.error(postId,optionIndex)
      const user = auth().currentUser;
      if (!user) throw new Error("Not authenticated");

      const db = firestore();
      const postRef = db.collection("posts").doc(postId);
      const voteRef = postRef.collection("votes").doc(user.uid);
await db.runTransaction(async (transaction) => {
  const postDoc = await transaction.get(postRef);
  const voteDoc = await transaction.get(voteRef);

  const postData = postDoc.data();
  if (!postData?.poll?.options) {
    throw new Error("Poll data missing");
  }

  let options = [...postData.poll.options];
  let totalVotes = postData.poll.totalVotes || 0;

  if (voteDoc.exists()) {
    const prevIndex = voteDoc.data()?.optionIndex;

    if (prevIndex === optionIndex) return;

    // 🔄 revote
    if (typeof prevIndex === "number") {
      options[prevIndex].votes -= 1;
    }

    options[optionIndex].votes += 1;

    transaction.update(voteRef, {
      optionIndex,
      updatedAt: FieldValue.serverTimestamp(),
    });

  } else {
    // 🆕 first vote
    options[optionIndex].votes += 1;
    totalVotes += 1;

    transaction.set(voteRef, {
      userId: user.uid,
      optionIndex,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // ✅ SAFE update (whole array)
  transaction.update(postRef, { 
    "poll.options": options,
    "poll.totalVotes": totalVotes,
  });
});

      return { postId, optionIndex };
    } catch (e) {
      console.error(e)
      return rejectWithValue(e.message);
    }
  }
);
export const fetchTrendingPosts = createAsyncThunk(
  "feed/fetchTrendingPosts",
  async ({ loadMore = false } = {}, { getState, rejectWithValue }) => {
    try {
      const { feed } = getState();
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      let query = firestore()
        .collection("posts")
        .orderBy("postIndex", "desc")
        .limit(10);

      if (loadMore && feed.trending.lastPostFetched)
        query = query.startAfter(feed.trending.lastPostFetched);

      const snapshot = await query.get();
      if (snapshot.empty)
        return { posts: [], lastCursor: null, isLastPage: true };

      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        postIndex: doc.data().postIndex || 0,
      }));

      const posts = await enrichPosts(postsData, user.uid);

      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      const isLastPage = snapshot.docs.length < 10;

      return { posts, lastCursor: lastVisibleDoc, isLastPage };
    } catch (err) {
      console.error("fetchTrendingPosts error:", err);
      return rejectWithValue(err.message || "Failed to fetch trending posts");
    }
  },
  {
    condition: (_, { getState }) => {
      const { feed } = getState();
      return !feed.trending.isFetching;
    },
  }
);

//
// 🔹 Fetch Recent (createdAt desc)
//
export const fetchRecentPosts = createAsyncThunk(
  "feed/fetchRecentPosts",
  async ({ loadMore = false } = {}, { getState, rejectWithValue }) => {
    try {
      const { feed } = getState();
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");

      let query = firestore()
        .collection("posts")
        .orderBy("createdAt", "desc")
        .limit(10);

      if (loadMore && feed.recent.lastPostFetched)
        query = query.startAfter(feed.recent.lastPostFetched);

      const snapshot = await query.get();
      if (snapshot.empty)
        return { posts: [], lastCursor: null, isLastPage: true };

      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || null,
      }));

      const posts = await enrichPosts(postsData, user.uid);

      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      const isLastPage = snapshot.docs.length < 10;

      return { posts, lastCursor: lastVisibleDoc, isLastPage };
    } catch (err) {
      console.error("fetchRecentPosts error:", err);
      return rejectWithValue(err.message || "Failed to fetch recent posts");
    }
  },
  {
    condition: (_, { getState }) => {
      const { feed } = getState();
      return !feed.recent.isFetching;
    },
  }
);

// ----------------------------
// 🔹 Likes & Bookmarks (unchanged)
// ----------------------------
export const toggleBookmark = createAsyncThunk(
  "feed/toggleBookmark",
  async (post, { rejectWithValue }) => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User not authenticated");
      if (togglingPosts.has(post.id)) return { postId: post.id };
      togglingPosts.add(post.id);

      const postRef = firestore().collection("posts").doc(post.id);
      const bookmarkRef = postRef.collection("bookmarks").doc(user.uid);
      const globalBookmarkRef = firestore()
        .collection("userBookmarks")
        .doc(`${user.uid}_${post.id}`);

      let bookmarked = false;
      await firestore().runTransaction(async (transaction) => {
        const bookmarkDoc = await transaction.get(bookmarkRef);
        if (!docExists(bookmarkDoc)) {
          transaction.set(bookmarkRef, {
            userId: user.uid,
            createdAt: FieldValue.serverTimestamp(),
          });
          transaction.set(globalBookmarkRef, {
            userId: user.uid,
            postId: post.id,
            bookmarkedOn: FieldValue.serverTimestamp(),
          });
          transaction.update(postRef, {
            postIndex: FieldValue.increment(3),
          });
          bookmarked = true;
        } else {
          transaction.delete(bookmarkRef);
          transaction.delete(globalBookmarkRef);
          transaction.update(postRef, {
            postIndex: FieldValue.increment(-3),
          });
          bookmarked = false;
        }
      });

      togglingPosts.delete(post.id);
      return { postId: post.id, bookmarked };
    } catch (err) {
      togglingPosts.delete(post.id);
      console.error("toggleBookmark error:", err);
      return rejectWithValue(err.message || "Failed to toggle bookmark");
    }
  }
);

export const toggleLike = createAsyncThunk(
  "feed/toggleLike",
  async (post, { rejectWithValue }) => {
    const user = auth().currentUser;
    if (!user) return rejectWithValue("User not authenticated");
    if (togglingPosts.has(post.id)) return { postId: post.id };
    togglingPosts.add(post.id);

    const postRef = firestore().collection("posts").doc(post.id);
    const likeRef = postRef.collection("likes").doc(user.uid);
    const notificationsRef = firestore().collection("notifications");

    try {
      const { liked, postData } = await firestore().runTransaction(
        async (transaction) => {
          const postDoc = await transaction.get(postRef);
          if (!docExists(postDoc)) throw new Error("Post does not exist");
          const likeDoc = await transaction.get(likeRef);
          const postData = postDoc.data();

          if (!docExists(likeDoc)) {
            transaction.set(likeRef, {
              userId: user.uid,
              createdAt: FieldValue.serverTimestamp(),
            });
            transaction.update(postRef, {
              totalLikes: FieldValue.increment(1),
              postIndex: FieldValue.increment(1),
            });
            return { liked: true, postData };
          } else {
            transaction.delete(likeRef);
            transaction.update(postRef, {
              totalLikes: FieldValue.increment(-1),
              postIndex: FieldValue.increment(-1),
            });
            return { liked: false, postData };
          }
        }
      );

      if (postData.userId !== user.uid) {
        const notifQuery = await notificationsRef
          .where("postId", "==", post.id)
          .where("notificationTo", "==", postData.userId)
          .where("notificationType", "==", "LIKE")
          .limit(1)
          .get();

        const username = user.displayName || "Someone";
        if (notifQuery.empty) {
          await notificationsRef.add({
            notificationFrom: user.uid,
            notificationTo: postData.userId,
            notificationType: "LIKE",
            notificationText: `${username} liked your post`,
            postId: post.id,
            totalUser: 1,
            createdOn: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            read: false,
          status:'UNREAD'

          });
        }
      }

      togglingPosts.delete(post.id);
      return { postId: post.id };
    } catch (err) {
      togglingPosts.delete(post.id);
      console.error("toggleLike error:", err);
      return rejectWithValue(err.message || "Failed to toggle like");
    }
  }
);

//
// 🔹 Slice
//
const feedSlice = createSlice({
  name: "feed",
  initialState: {
    trending: {
      posts: [],
      isFetching: false,
      error: null,
      lastPostFetched: null,
      isLastPage: false,
    },
    recent: {
      posts: [],
      isFetching: false,
      error: null,
      lastPostFetched: null,
      isLastPage: false,
    },
  },
  reducers: {
    toggleLikeOptimistic: (state, action) => {
      const { feedType, postId } = action.payload;
      const post = state[feedType].posts.find((p) => p.id === postId);
      if (post) {
        post.likedByCurrentUser = !post.likedByCurrentUser;
        post.totalLikes += post.likedByCurrentUser ? 1 : -1;
      }
    },
    toggleBookmarkOptimistic: (state, action) => {
      const { feedType, postId } = action.payload;
      const post = state[feedType].posts.find((p) => p.id === postId);
      if (post) {
        post.bookmarkedByCurrentUser = !post.bookmarkedByCurrentUser;
      }
    },
    
votePollOptimistic: (state, action) => {
  const { postId, optionIndex } = action.payload;

  const updatePost = (post) => {
    if (!post || !post.poll) return post;

    const prev = post.votedOption;

    let newOptions = post.poll.options.map((opt, i) => {
      if (prev == null) {
        return i === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt;
      } else if (prev !== optionIndex) {
        if (i === prev) return { ...opt, votes: opt.votes - 1 };
        if (i === optionIndex) return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    let newTotal = post.poll.totalVotes;
    if (prev == null) newTotal += 1;

    return {
      ...post,
      votedOption: optionIndex,
      isVoted: true,
      poll: {
        ...post.poll,
        options: newOptions,
        totalVotes: newTotal,
      },
    };
  };

  // ✅ update BOTH feeds centrally
  state.recent.posts = state.recent.posts.map((p) =>
    p.id === postId ? updatePost(p) : p
  );

  state.trending.posts = state.trending.posts.map((p) =>
    p.id === postId ? updatePost(p) : p
  );
},
   removePostOptimistic: (state, action) => {
    const postId = action.payload;

    // 🔥 remove from BOTH feeds
    state.recent.posts = state.recent.posts.filter(
      (p) => p.id !== postId
    );

    state.trending.posts = state.trending.posts.filter(
      (p) => p.id !== postId
    );
  },
  removeBlockedUserPosts: (state, action) => {
  const blockedUserId = action.payload;

  state.recent.posts = state.recent.posts.filter(
    (p) => p.userId !== blockedUserId
  );

  state.trending.posts = state.trending.posts.filter(
    (p) => p.userId !== blockedUserId
  );
},
  },
  extraReducers: (builder) => {
    // 🔹 Trending
    builder
      .addCase(fetchTrendingPosts.pending, (state) => {
        state.trending.isFetching = true;
        state.trending.error = null; // ✅ reset error
      })
      .addCase(fetchTrendingPosts.fulfilled, (state, action) => {
        const { posts, lastCursor, isLastPage } = action.payload;
        const combined = [...state.trending.posts, ...posts];
        const seen = new Set();
        state.trending.posts = combined.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        state.trending.lastPostFetched = lastCursor;
        state.trending.isLastPage = isLastPage;
        state.trending.isFetching = false;
      })
      .addCase(fetchTrendingPosts.rejected, (state, action) => {
        state.trending.isFetching = false;
        state.trending.error = action.payload;
      });

    // 🔹 Recent
    builder
      .addCase(fetchRecentPosts.pending, (state) => {
        state.recent.isFetching = true;
        state.recent.error = null; // ✅ reset error
      })
      .addCase(fetchRecentPosts.fulfilled, (state, action) => {
        const { posts, lastCursor, isLastPage } = action.payload;
        const combined = [...state.recent.posts, ...posts];
        const seen = new Set();
        state.recent.posts = combined.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        state.recent.lastPostFetched = lastCursor;
        state.recent.isLastPage = isLastPage;
        state.recent.isFetching = false;
      })
      .addCase(fetchRecentPosts.rejected, (state, action) => {
        state.recent.isFetching = false;
        state.recent.error = action.payload;
      });
  },
});

export const { toggleLikeOptimistic, toggleBookmarkOptimistic,votePollOptimistic,removeBlockedUserPosts,removePostOptimistic } =
  feedSlice.actions;

export default feedSlice.reducer;
