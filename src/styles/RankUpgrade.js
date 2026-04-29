import { StyleSheet } from "react-native";

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F0F6FF",
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Background blobs */
  blobTL: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 56,
    backgroundColor: "#D6E8FF",
    opacity: 0.55,
    transform: [{ rotate: "45deg" }],
    top: -120,
    left: -140,
  },
  blobTR: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 40,
    backgroundColor: "#C7DCFF",
    opacity: 0.4,
    transform: [{ rotate: "30deg" }],
    top: 80,
    right: -100,
  },
  blobBL: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 60,
    backgroundColor: "#DCE9FF",
    opacity: 0.45,
    transform: [{ rotate: "45deg" }],
    bottom: -160,
    left: -180,
  },

  /* Back */
  backBtn: {
    marginTop: 8,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(79,142,247,0.15)",
  },
  backArrow: {
    fontSize: 26,
    color: "#4F8EF7",
    lineHeight: 32,
    marginTop: -2,
  },

  /* Header */
  header: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 32,
  },
  badgeRow: {
    marginBottom: 14,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(79,142,247,0.12)",
    borderWidth: 1,
    borderColor: "rgba(79,142,247,0.2)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F8EF7",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0F1D35",
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7C99",
    fontWeight: "400",
    lineHeight: 22,
  },

  /* Card */
  card: {
    marginHorizontal: 18,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 24,
    shadowColor: "#3B6FCC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(200,220,255,0.6)",
  },

  /* Fields */
  fieldWrap: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F5E7B",
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Dropdown */
  dropdownBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F5F8FF",
    borderWidth: 1.5,
    borderColor: "#E0E9FF",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  dropdownTxt: {
    fontSize: 15,
    fontWeight: "500",
    color: "#A0AECB",
  },

  /* Upload box */
  uploadBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C5D6F7",
    backgroundColor: "#F5F8FF",
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadBoxFilled: {
    borderStyle: "solid",
    borderColor: "#4F8EF7",
    backgroundColor: "#F0F6FF",
  },
  uploadEmpty: {
    alignItems: "center",
    paddingVertical: 20,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(79,142,247,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadIcon: {
    fontSize: 20,
    color: "#4F8EF7",
    fontWeight: "700",
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F8EF7",
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: "#A0AECB",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    width: "100%",
    gap: 12,
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(79,142,247,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconText: {
    fontSize: 20,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 3,
  },
  fileSize: {
    fontSize: 12,
    color: "#8A9ABB",
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(79,142,247,0.1)",
  },
  changeTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F8EF7",
  },

  /* Progress */
  progressWrap: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E8EFFF",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#4F8EF7",
  },
  progressTxt: {
    fontSize: 12,
    color: "#6B7C99",
    textAlign: "right",
  },

  /* Submit */
  submitBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#4F8EF7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#4F8EF7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  submitDisabled: {
    backgroundColor: "#A0C0F5",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  submitArrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disclaimer: {
    marginTop: 14,
    fontSize: 12,
    color: "#A0AECB",
    textAlign: "center",
    lineHeight: 18,
  },
});

/* ─────────────────────────────────────────
   In-Progress styles
───────────────────────────────────────── */
export const inProgress = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ring: {
    position: "absolute",
    top: 4,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(79,142,247,0.2)",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(79,142,247,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(79,142,247,0.2)",
  },
  iconText: {
    fontSize: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F1D35",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    color: "#6B7C99",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(79,142,247,0.1)",
    borderWidth: 1,
    borderColor: "rgba(79,142,247,0.2)",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F8EF7",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F8EF7",
    letterSpacing: 0.3,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EFF4FF",
    marginBottom: 20,
  },
  note: {
    fontSize: 13,
    color: "#8A9ABB",
    textAlign: "center",    
    lineHeight: 20,
  },
});
