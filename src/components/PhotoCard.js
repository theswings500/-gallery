import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function PhotoCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>{item.filename || "사진"}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{formatDate(item.creationTime)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  },
  image: {
    width: "100%",
    height: 160
  },
  meta: {
    padding: 12
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f1b16"
  },
  subtitle: {
    fontSize: 11,
    color: "#6b6259",
    marginTop: 4
  }
});