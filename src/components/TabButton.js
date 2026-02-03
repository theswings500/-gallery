import { Pressable, StyleSheet, Text } from "react-native";

export default function TabButton({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.active]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#efe8e1"
  },
  active: {
    backgroundColor: "#d86b5a"
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4e4540"
  },
  textActive: {
    color: "#fff"
  }
});
