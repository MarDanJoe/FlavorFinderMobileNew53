import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useRestaurants } from "../hooks/useRestaurants";
import { useLibrary } from "../contexts/LibraryContext";
import { DEMO_MODE } from "../config/demo";
import { colors, layout } from "../theme";
import { RestaurantImage } from "../components/RestaurantImage";
import { LocationPicker } from "../components/LocationPicker";
import { GoogleAttribution } from "../components/GoogleAttribution";
import { FilterSheet } from "../components/FilterSheet";

const cuisines = [
  { label: "All flavors", value: "", icon: "✨" },
  { label: "Pizza", value: "pizza", icon: "🍕" },
  { label: "Tacos", value: "tacos", icon: "🌮" },
  { label: "Japanese", value: "japanese", icon: "🍣" },
  { label: "Burgers", value: "burgers", icon: "🍔" },
  { label: "Brunch", value: "brunch", icon: "☕" },
];
export function HomeScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const library = useLibrary();
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 472);
  const [searchLocation, setSearchLocation] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const discovery = useRestaurants({
    ...library.preferences,
    searchLocation: searchLocation ?? undefined,
  });
  const {
    currentRestaurant: restaurant,
    loading,
    error,
    currentIndex,
    total,
  } = discovery;
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState<"save" | "skip" | null>(null);
  const position = useRef(new Animated.Value(0)).current;
  const busyRef = useRef(false);
  const latest = useRef({ restaurant, discovery, library, cardWidth });
  latest.current = { restaurant, discovery, library, cardWidth };
  const actRef = useRef<(save: boolean) => void>(() => {});
  actRef.current = async (save) => {
    const {
      restaurant: current,
      discovery: deck,
      library: store,
      cardWidth: distance,
    } = latest.current;
    if (!current || deck.loading || busyRef.current || !store.ready) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (save) await store.save(current);
      Animated.timing(position, {
        toValue: save ? distance + 100 : -distance - 100,
        duration: 230,
        useNativeDriver: true,
      }).start(() => {
        deck.nextRestaurant();
        position.setValue(0);
        busyRef.current = false;
        setBusy(false);
        setLastAction(save ? "save" : "skip");
        setMessage(
          save
            ? `${current.name} added to your saved places`
            : "Passed. Another flavor is waiting.",
        );
      });
    } catch (err) {
      busyRef.current = false;
      setBusy(false);
      setMessage(
        err instanceof Error ? err.message : "Could not save this place.",
      );
    }
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        if (!busyRef.current) position.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (busyRef.current) return;
        if (Math.abs(gesture.dx) > latest.current.cardWidth * 0.25)
          actRef.current(gesture.dx > 0);
        else
          Animated.spring(position, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: true,
        }).start(),
    }),
  ).current;
  const selectedCuisine =
    cuisines.find((c) => c.value === library.preferences.cuisine)?.label ??
    "All flavors";
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[layout.content, styles.brandRow]}>
          <View style={layout.row}>
            <View style={styles.mark}>
              <Ionicons name="restaurant" size={19} color="#fff" />
            </View>
            <Text style={styles.brand}>
              flavorfinder<Text style={{ color: colors.accent }}>.</Text>
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Open filters"
            accessibilityRole="button"
            onPress={() => setShowFilters(true)}
            style={styles.filter}
          >
            <Ionicons name="options-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <View style={layout.content}>
          <View style={[layout.row, { gap: 5, marginBottom: 10 }]}>
            <Ionicons name="location-outline" size={13} color={colors.green} />
            <Text style={styles.eyebrow}>
              {DEMO_MODE ? "DEMO NEIGHBORHOOD" : "AROUND YOU"} ·{" "}
              {Math.round(library.preferences.radius / 1609.34)} MI
            </Text>
          </View>
          {!DEMO_MODE && (
            <LocationPicker
              label={searchLocation?.label ?? "Near you"}
              onSelect={(value) => {
                setSearchLocation(value);
                if (!value) discovery.useDeviceLocation();
              }}
            />
          )}
          <Text style={layout.title}>Good food.{"\n"}Great discoveries.</Text>
          <Text style={[layout.subtitle, { marginTop: 9, marginBottom: 18 }]}>
            Discover your next favorite. Let your friends help choose.
          </Text>
        </View>
        <View style={[layout.content, { marginBottom: 18 }]}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={loading || discovery.restaurants.length < 2}
            style={[
              layout.primary,
              (loading || discovery.restaurants.length < 2) && { opacity: 0.5 },
            ]}
            onPress={() =>
              navigation.navigate("Room", {
                deck: discovery.restaurants.slice(0, 20).map((r) => r.id),
              })
            }
          >
            <Text style={layout.primaryText}>
              Eat together · Create a voting room
            </Text>
          </TouchableOpacity>
          <Text style={[layout.subtitle, { fontSize: 12, marginTop: 8 }]}>
            Share this deck with friends. Swipe, vote, settle dinner.
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Math.max(24, (width - 472) / 2),
            gap: 9,
            paddingBottom: 18,
          }}
        >
          {cuisines.map((c) => (
            <TouchableOpacity
              key={c.label}
              accessibilityRole="button"
              accessibilityState={{
                selected: c.value === library.preferences.cuisine,
              }}
              style={[
                styles.chip,
                c.value === library.preferences.cuisine && styles.chipActive,
              ]}
              onPress={() => {
                setLastAction(null);
                setMessage("");
                void library
                  .updatePreferences({
                    ...library.preferences,
                    cuisine: c.value,
                  })
                  .catch((e) => setMessage(e.message));
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color:
                    c.value === library.preferences.cuisine
                      ? "#fff"
                      : colors.ink,
                  fontWeight: "600",
                }}
              >
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View
          style={[
            layout.content,
            layout.row,
            { justifyContent: "space-between", marginBottom: 12 },
          ]}
        >
          <Text style={styles.sectionTitle}>
            {selectedCuisine === "All flavors"
              ? "Picked for your appetite"
              : `${selectedCuisine} on the menu`}
          </Text>
          <Text style={styles.counter}>
            {restaurant ? `${currentIndex + 1} / ${total}` : "Explore"}
          </Text>
        </View>
        <View style={{ width: cardWidth, alignSelf: "center", minHeight: 320 }}>
          {loading || !library.ready ? (
            <View style={styles.state}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.stateTitle}>Finding your flavor…</Text>
              <Text style={layout.subtitle}>
                A little discovery is on its way.
              </Text>
            </View>
          ) : error || !restaurant ? (
            <View style={styles.state}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name="compass-outline"
                  size={36}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.stateTitle}>A fresh search awaits.</Text>
              <Text
                style={[
                  layout.subtitle,
                  { textAlign: "center", marginBottom: 16 },
                ]}
              >
                {error || "Try a different cuisine or widen your distance."}
              </Text>
              <TouchableOpacity
                style={layout.primary}
                onPress={() => discovery.refreshRestaurants()}
              >
                <Text style={layout.primaryText}>Explore again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                style={{ padding: 16 }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  Adjust filters
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View
              {...pan.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position },
                    {
                      rotate: position.interpolate({
                        inputRange: [-cardWidth, 0, cardWidth],
                        outputRange: ["-9deg", "0deg", "9deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`View ${restaurant.name} details`}
                activeOpacity={0.95}
                onPress={() =>
                  navigation.navigate("RestaurantDetail", { id: restaurant.id })
                }
              >
                <RestaurantImage
                  uri={restaurant.image_url}
                  style={{
                    height: Math.max(165, Math.min(220, height * 0.23)),
                  }}
                />
                <View style={styles.imageBadge}>
                  <Ionicons name="star" size={12} color={colors.accent} />
                  <Text
                    style={{
                      color: colors.ink,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {restaurant.rating.toFixed(1)}
                  </Text>
                </View>
                {restaurant.is_open_now !== undefined && (
                  <View style={styles.openBadge}>
                    <View
                      style={[
                        styles.dot,
                        !restaurant.is_open_now && {
                          backgroundColor: colors.muted,
                        },
                      ]}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.ink,
                        fontWeight: "600",
                      }}
                    >
                      {restaurant.is_open_now ? "Open now" : "Closed now"}
                    </Text>
                  </View>
                )}
                <View style={{ padding: 20 }}>
                  <Text style={styles.restaurantName} numberOfLines={2}>
                    {restaurant.name}
                  </Text>
                  <Text style={[layout.subtitle, { marginTop: 5 }]}>
                    {restaurant.categories
                      .filter(
                        (c) =>
                          c.alias !== "restaurant" &&
                          c.alias !== "food" &&
                          c.alias !== "point_of_interest" &&
                          c.alias !== "establishment",
                      )
                      .slice(0, 2)
                      .map((c) => c.title)
                      .join(" · ") || "Something delicious nearby"}
                    {restaurant.price ? ` · ${restaurant.price}` : ""}
                  </Text>
                  <View
                    style={[
                      layout.row,
                      {
                        marginTop: 15,
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderColor: colors.border,
                        gap: 6,
                      },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.muted}
                    />
                    <Text
                      style={{ flex: 1, color: colors.muted, fontSize: 12 }}
                      numberOfLines={1}
                    >
                      {restaurant.location.address1}
                    </Text>
                    <Text
                      style={{
                        color: colors.ink,
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                    >
                      {restaurant.distance < 0.1
                        ? "Nearby"
                        : `${restaurant.distance.toFixed(1)} mi`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              {!DEMO_MODE && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                  <GoogleAttribution
                    authors={restaurant.photo_attributions}
                    providers={restaurant.provider_attributions}
                    photoSource={restaurant.photo_source_uri}
                  />
                </View>
              )}
            </Animated.View>
          )}
        </View>
        <View style={[layout.row, styles.actions]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Undo last skip"
            disabled={!currentIndex || busy || loading || lastAction !== "skip"}
            onPress={() => {
              discovery.previousRestaurant();
              setLastAction(null);
              setMessage("Back to your previous discovery.");
            }}
            style={[
              styles.undo,
              (!currentIndex || lastAction !== "skip") && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="arrow-undo-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Skip restaurant"
            disabled={!restaurant || busy || loading}
            onPress={() => actRef.current(false)}
            style={[styles.skip, (!restaurant || loading) && { opacity: 0.4 }]}
          >
            <Ionicons name="close" size={28} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Save restaurant"
            disabled={!restaurant || busy || loading}
            onPress={() => actRef.current(true)}
            style={[styles.save, (!restaurant || loading) && { opacity: 0.4 }]}
          >
            <Ionicons name="heart" size={29} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Restaurant details"
            disabled={!restaurant || busy}
            onPress={() =>
              restaurant &&
              navigation.navigate("RestaurantDetail", { id: restaurant.id })
            }
            style={styles.undo}
          >
            <Ionicons name="information-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {message ||
            library.error ||
            "Pass on the left. Fall in love on the right."}
        </Text>
        {DEMO_MODE && (
          <Text style={styles.demo}>PREVIEW MODE · SAMPLE RESTAURANTS</Text>
        )}
      </ScrollView>
      <FilterSheet
        visible={showFilters}
        value={library.preferences}
        onClose={() => setShowFilters(false)}
        onApply={(p) => {
          void library
            .updatePreferences(p)
            .then(() => {
              setShowFilters(false);
              setLastAction(null);
              setMessage("");
            })
            .catch((e) => setMessage(e.message));
        }}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 18,
  },
  mark: {
    width: 32,
    height: 32,
    backgroundColor: colors.accent,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.8,
  },
  filter: {
    borderRadius: 15,
    width: 43,
    height: 43,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 10,
    color: colors.green,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  chip: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingVertical: 12,
    paddingHorizontal: 17,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  sectionTitle: { fontSize: 13, color: colors.ink, fontWeight: "700" },
  counter: { fontSize: 11, color: colors.muted },
  card: {
    borderRadius: 24,
    backgroundColor: colors.paper,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  restaurantName: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
  },
  imageBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFFF2",
    padding: 9,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  openBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFFF2",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  actions: { justifyContent: "center", gap: 18, paddingTop: 20 },
  undo: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: {
    width: 60,
    height: 60,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    width: 68,
    height: 68,
    backgroundColor: colors.accent,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 13,
    lineHeight: 18,
  },
  demo: {
    color: colors.muted,
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 1.5,
    paddingTop: 12,
  },
  state: {
    minHeight: 330,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    borderRadius: 24,
    gap: 12,
  },
  stateIcon: { padding: 16, borderRadius: 50, backgroundColor: colors.soft },
  stateTitle: { fontSize: 22, fontWeight: "700", color: colors.ink },
});
