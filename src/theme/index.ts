import { StyleSheet } from "react-native";
export const colors = {
  background: "#F8F6F0",
  paper: "#FFFFFF",
  ink: "#20382E",
  muted: "#768177",
  accent: "#D95D39",
  soft: "#FCECE4",
  border: "#E7E8DF",
  green: "#3D7356",
};
export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: colors.ink,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center" },
  primary: {
    backgroundColor: colors.ink,
    padding: 17,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    color: colors.ink,
    fontSize: 16,
    marginBottom: 12,
  },
});
