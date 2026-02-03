import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import PhotoCard from "./src/components/PhotoCard";

const PAGE_SIZE = 60;

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [permissionStatus, setPermissionStatus] = useState("undetermined");
  const [assets, setAssets] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return assets;
    return assets.filter((item) => (item.filename || "").toLowerCase().includes(needle));
  }, [assets, query]);

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      setPermissionStatus("granted");
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      await loadAssets(true);
    }
  };

  const loadAssets = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 1
        });
        if (!result.canceled) {
          const picked = result.assets.map((asset, index) => ({
            id: asset.assetId || `${Date.now()}-${index}`,
            uri: asset.uri,
            filename: asset.fileName || "선택한 사진",
            creationTime: asset.creationTime || null
          }));
          setAssets((prev) => (reset ? picked : [...picked, ...prev]));
        }
        setHasNextPage(false);
        setEndCursor(null);
        return;
      }

      const response = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: PAGE_SIZE,
        after: reset ? undefined : endCursor || undefined
      });

      const nextAssets = response.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime
      }));

      setAssets((prev) => (reset ? nextAssets : [...prev, ...nextAssets]));
      setEndCursor(response.endCursor || null);
      setHasNextPage(response.hasNextPage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (permissionStatus !== "granted") {
      await requestPermission();
      return;
    }
    await loadAssets(true);
  };

  const renderItem = ({ item }) => (
    <PhotoCard item={item} onPress={() => setSelected(item)} />
  );

  const showGallery = permissionStatus === "granted" || Platform.OS === "web";
  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 사진 갤러리</Text>
          <Text style={styles.subtitle}>기기 라이브러리에서 바로 불러옵니다</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.primary} onPress={handlePrimaryAction}>
            <Text style={styles.primaryText}>
              {isWeb ? "사진 가져오기" : permissionStatus === "granted" ? "새로고침" : "권한 요청"}
            </Text>
          </Pressable>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{assets.length}장</Text>
          </View>
        </View>

        {showGallery ? (
          <>
            <View style={styles.searchWrap}>
              <TextInput
                placeholder="파일명으로 검색"
                placeholderTextColor="#a79a90"
                value={query}
                onChangeText={setQuery}
                style={styles.search}
              />
            </View>

            {isWeb && selected ? (
              <View style={styles.webDetail}>
                <Image source={{ uri: selected.uri }} style={styles.webDetailImage} />
                <View style={styles.webDetailMeta}>
                  <Text style={styles.webDetailTitle}>{selected.filename || "사진"}</Text>
                  <Text style={styles.webDetailDate}>{formatDate(selected.creationTime)}</Text>
                </View>
                <Pressable onPress={() => setSelected(null)} style={styles.webDetailClose}>
                  <Text style={styles.webDetailCloseText}>닫기</Text>
                </Pressable>
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={2}
              columnWrapperStyle={styles.column}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!isWeb && hasNextPage) {
                  loadAssets();
                }
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loading ? <ActivityIndicator style={styles.loader} color="#1f1b16" /> : null
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>사진이 없어요</Text>
                  <Text style={styles.emptyText}>다른 폴더를 확인하거나 사진을 추가해보세요.</Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>사진 접근 권한이 필요해요</Text>
            <Text style={styles.permissionText}>권한을 허용하면 기기 사진을 바로 볼 수 있어요.</Text>
          </View>
        )}
      </View>

      {!isWeb ? (
        <Modal visible={!!selected} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modal}>
              {selected ? (
                <>
                  <Image source={{ uri: selected.uri }} style={styles.modalImage} />
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{selected.filename || "사진"}</Text>
                      <Pressable onPress={() => setSelected(null)} style={styles.close}>
                        <Text style={styles.closeText}>닫기</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.modalMeta}>{formatDate(selected.creationTime)}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f1ed"
  },
  background: {
    position: "absolute",
    top: -200,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#f0c3a4",
    opacity: 0.35
  },
  container: {
    flex: 1,
    paddingHorizontal: 20
  },
  header: {
    marginTop: 12
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1f1b16"
  },
  subtitle: {
    fontSize: 13,
    color: "#6b6259",
    marginTop: 4
  },
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  primary: {
    flex: 1,
    backgroundColor: "#1f1b16",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13
  },
  countPill: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#efe8e1"
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b6259"
  },
  searchWrap: {
    marginTop: 16
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f1b16",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  webDetail: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  webDetailImage: {
    width: "100%",
    height: 380
  },
  webDetailMeta: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4
  },
  webDetailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f1b16"
  },
  webDetailDate: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b6259"
  },
  webDetailClose: {
    alignSelf: "flex-end",
    marginRight: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f4f1ed"
  },
  webDetailCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b6259"
  },
  list: {
    paddingBottom: 120,
    marginTop: 16
  },
  column: {
    gap: 14
  },
  loader: {
    marginVertical: 20
  },
  empty: {
    marginTop: 50,
    alignItems: "center"
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3f342c"
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#7a6d63"
  },
  permissionBox: {
    marginTop: 40,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1b16"
  },
  permissionText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b6259"
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end"
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    overflow: "hidden"
  },
  modalImage: {
    width: "100%",
    height: 360
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f1b16",
    flex: 1,
    marginRight: 10
  },
  close: {
    backgroundColor: "#f4f1ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  closeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b6259"
  },
  modalMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b6259"
  }
});