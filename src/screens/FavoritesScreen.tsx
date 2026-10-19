import { SavedAd } from "../components/SavedAd";
import { DEMO_MODE } from "../config/demo";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useLibrary } from "../contexts/LibraryContext";
import { GoogleAttribution } from "../components/GoogleAttribution";
import { RestaurantImage } from "../components/RestaurantImage";
import { colors, layout } from "../theme";
export default function FavoritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    favorites,
    remove,
    ready,
    searchReady,
    error,
    reload,
    loadSavedDetails,
    loadMoreSaved,
    savedDetailLimit,
  } = useLibrary();
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) loadSavedDetails();
  }, [focused, loadSavedDetails]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "rating">("recent");
  const [message, setMessage] = useState("");
  const filtered = favorites
    .slice(0, savedDetailLimit)
    .filter((r) =>
      `${r.name} ${r.location.address1} ${r.categories?.map((c) => c.title).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
  const missingDetails = favorites
    .slice(0, savedDetailLimit)
    .some((r) => r.saved_details_unavailable);
  const results =
    sort === "rating"
      ? [...filtered].sort((a, b) => b.rating - a.rating)
      : filtered;
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <View style={[layout.content, { paddingTop: 28, paddingBottom: 16 }]}>
        <Text style={styles.eyebrow}>YOUR LITTLE BLACK BOOK</Text>
        <Text style={[layout.title, { marginTop: 10 }]}>
          Worth coming back to.
        </Text>
        <Text style={[layout.subtitle, { marginTop: 10 }]}>
          {favorites.length} saved {favorites.length === 1 ? "place" : "places"}{" "}
          for your next food adventure.
        </Text>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search loaded saved restaurants"
            placeholder="Search loaded saved places"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              color: colors.ink,
              fontSize: 14,
              paddingVertical: 14,
            }}
          />
          {query !== "" && (
            <TouchableOpacity
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            layout.row,
            { justifyContent: "space-between", marginTop: 14 },
          ]}
        >
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {results.length}{" "}
            {results.length === 1 ? "discovery" : "discoveries"}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setSort(sort === "recent" ? "rating" : "recent")}
          >
            <Text
              style={{ color: colors.green, fontSize: 12, fontWeight: "700" }}
            >
              {sort === "recent" ? "Recently saved" : "Highest rated"} ↓
            </Text>
          </TouchableOpacity>
        </View>
        {!!(message || error) && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.accent, fontSize: 12, marginTop: 12 }}
          >
            {message || error}
          </Text>
        )}
      </View>
      {missingDetails && ready && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.muted }}
          >
            Some saved places could not load. Your saves are safe. Check your
            connection or try again after the daily limit resets.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={reload}
            style={{ paddingVertical: 12 }}
          >
            <Text style={{ color: colors.accent }}>
              Retry loading saved places
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {!!error && (
        <TouchableOpacity
          onPress={reload}
          style={{ padding: 12, alignItems: "center" }}
        >
          <Text style={{ color: colors.accent, fontWeight: "700" }}>
            Retry loading your library
          </Text>
        </TouchableOpacity>
      )}
      {!DEMO_MODE && (
        <View style={{ paddingHorizontal: 24 }}>
          <GoogleAttribution />
        </View>
      )}
      {!ready && !searchReady ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <FlatList
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          data={results}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[
            layout.content,
            { paddingBottom: 24, flexGrow: 1 },
          ]}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ flexDirection: "row", flex: 1 }}
                  accessibilityLabel={`View ${item.name}`}
                  onPress={() =>
                    navigation.navigate("RestaurantDetail", { id: item.id })
                  }
                >
                  <RestaurantImage
                    uri={item.image_url}
                    style={{ width: 94, height: 104, borderRadius: 15 }}
                  />
                  <View
                    style={{
                      flex: 1,
                      paddingLeft: 14,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={styles.name}>{item.name}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 7,
                      }}
                    >
                      {item.saved_details_unavailable
                        ? "Details unavailable"
                        : `★ ${item.rating.toFixed(1)}`}{" "}
                      {item.price ? ` · ${item.price}` : ""}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.muted,
                        marginTop: 8,
                      }}
                      numberOfLines={1}
                    >
                      {item.location.address1}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel={`Remove ${item.name} from saved places`}
                  accessibilityRole="button"
                  onPress={() => {
                    void remove(item.id)
                      .then(() =>
                        setMessage(`${item.name} removed from saved places.`),
                      )
                      .catch((e) => setMessage(e.message));
                  }}
                  style={{ padding: 10, justifyContent: "center" }}
                >
                  <Ionicons name="heart" size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>
              {!DEMO_MODE && (
                <View style={{ marginTop: 10 }}>
                  <GoogleAttribution providers={item.provider_attributions} />
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            favorites.length > savedDetailLimit ? (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={!ready}
                onPress={loadMoreSaved}
                style={layout.primary}
              >
                <Text style={layout.primaryText}>Load more saved places</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="heart-outline"
                  size={38}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {query
                  ? "No matches just yet."
                  : "Save a little deliciousness."}
              </Text>
              <Text
                style={[
                  layout.subtitle,
                  { textAlign: "center", marginVertical: 12 },
                ]}
              >
                {query
                  ? "Try another name or clear your search."
                  : "Tap the heart on a place you love. Your next adventure will be waiting here."}
              </Text>
              <TouchableOpacity
                style={layout.primary}
                onPress={() =>
                  query
                    ? setQuery("")
                    : navigation
                        .getParent()
                        ?.navigate("MainApp", { screen: "Home" })
                }
              >
                <Text style={layout.primaryText}>
                  {query ? "Clear search" : "Discover a place"}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {ready && favorites.length > 0 && <SavedAd />}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.7,
    color: colors.green,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    marginTop: 22,
  },
  card: {
    backgroundColor: colors.paper,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.ink },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 45,
  },
  emptyIcon: { padding: 22, borderRadius: 40, backgroundColor: colors.soft },
  emptyTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 24,
  },
});
