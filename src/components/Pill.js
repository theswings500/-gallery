import { Pressable, StyleSheet, Text } from "react-native";

export default function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, active && styles.active, pressed && styles.pressed]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e0d7cf",
    backgroundColor: "#f8f4f1",
    marginRight: 8
  },
  active: {
    backgroundColor: "#1f1b16",
    borderColor: "#1f1b16"
  },
  pressed: {
    transform: [{ scale: 0.97 }]
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d544b"
  },
  textActive: {
    color: "#f7f3ef"
  }
});
