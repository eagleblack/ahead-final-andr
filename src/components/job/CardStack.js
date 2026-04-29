import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import SwipeableCard from "./SwipeableCard";
import JobCard from "../JobCard";

export default function CardStack({
  data = [],
  onSwipe,
  onSwipedAll,  
  onEndReached,
  hasMore,
  viewJob,
}) {
  const [index, setIndex] = useState(0);

  // ✅ Prevent duplicate view calls
  const viewedJobs = useRef(new Set());

  // 🎯 Handle swipe
  const handleSwipe = (dir) => {
    const job = data[index];
    if (job) {
      onSwipe && onSwipe(job, dir);
    }
    setIndex((prev) => prev + 1);
  };

  // 🎯 Fire "view" when card becomes visible
 const currentItem = data[index];
useEffect(() => {
  setIndex(0);
  viewedJobs.current.clear(); // reset view tracking too
}, [data]);
useEffect(() => {
  const job = data[index];
  if (!job) return;

  const jobId = job._id || job.id; // IMPORTANT FIX

  const timer = setTimeout(() => {
    if (!jobId) return;

    if (!viewedJobs.current.has(jobId)) {
      viewedJobs.current.add(jobId);

      console.log("🔥 VIEW FIRED:", jobId);

      viewJob?.(jobId);
    }
  }, 600); // slightly safer delay

  return () => clearTimeout(timer);
}, [index, data]);

  // 🎯 When all cards swiped
  useEffect(() => {
    if (index >= data.length && data.length > 0) {
      onSwipedAll && onSwipedAll();
    }
  }, [index, data.length]);

  // 🎯 Pagination trigger
  useEffect(() => {
    if (hasMore && data.length - index <= 5) {
      onEndReached && onEndReached();
    }
  }, [index, hasMore, data.length]);

  // 🚫 Nothing to render
  if (data.length === 0 || index >= data.length) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <SwipeableCard
        key={(currentItem._id || currentItem.id) + "_" + index}
        onSwipeLeft={() => handleSwipe("left")}
        onSwipeRight={() => handleSwipe("right")}
      >
        <JobCard
          job={currentItem}
          onAccept={() => handleSwipe("right")}
          onReject={() => handleSwipe("left")}
        />
      </SwipeableCard>
    </View>
  );
}