import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useDispatch } from "react-redux";
import { votePoll, votePollOptimistic } from "../store/feedSlice";
import { votePollOptimisticUserProfile } from "../store/otherProfilePostSlice";
import { votePollOptimisticProfile } from "../store/userPostsSlice";


const PollCard = ({ item, colors }) => {
  const dispatch = useDispatch();

  // ✅ Single source of truth (from Redux)
  const voted = item.votedOption;

  const totalVotes = item.poll?.totalVotes || 0;

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleVote = (index) => {
    // ✅ prevent duplicate vote
    if (voted === index) return;
   dispatch(votePoll({
        postId:item.id,
        optionIndex: index,

    }))
   dispatch(
  votePollOptimistic({
    postId: item.id,
    optionIndex: index,
  })
);
   dispatch(
  votePollOptimisticUserProfile({
    postId: item.id,
    optionIndex:index,
  })
);
dispatch(
  votePollOptimisticProfile({
    postId: item.id,
    optionIndex:index,
  })
);
 
  };
  
  return (
    <View
      style={{
        marginTop: 10,
        borderRadius: 14,
        padding: 12,
        backgroundColor: colors.surface,
      }}
    >
      {/* QUESTION */}
      <Text
        style={{
          color: colors.text,
          fontWeight: "700",
          fontSize: 15,
          marginBottom: 10,
        }}
      >
        {item.poll?.question}
      </Text>

      {/* OPTIONS */}
      {item.poll?.options?.map((opt, index) => {
        const percentage = getPercentage(opt.votes);

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => handleVote(index)}
            style={{
              marginBottom: 10,
              borderRadius: 10,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.divider,
            backgroundColor:
  voted === index
    ? colors.primary + '60'
    : item.isVoted
    ? colors.surface // 👈 faded if already voted
    : colors.background + "30",
            }}
          >
            {/* PROGRESS BAR */}
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${percentage}%`,
                backgroundColor:
                  voted === index
                    ? "rgba(255,255,255,0.2)"
                    : colors.primary + "40",
              }}
            />

            {/* TEXT ROW */}
            <View
              style={{
                padding: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                }}
              >
                {opt.text}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                {percentage}%
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* FOOTER */}
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 6,
        }}
      >
        {totalVotes} votes
      </Text>
    </View>
  );
};

export default PollCard;

const styles = StyleSheet.create({});