import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
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
    enabled: library.searchReady,
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
  const [swiping, setSwiping] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [cardHeight, setCardHeight] = useState(Math.max(180, height - 370));
  const [lastAction, setLastAction] = useState<"save" | "skip" | null>(null);
  // Each discovery owns its native transform; an outgoing card cannot leave
  // the following card translated off screen during a native animation reset.
  const position = useMemo(() => new Animated.Value(0), [restaurant?.id]);
  const busyRef = useRef(false);
  const latest = useRef({
    restaurant,
    discovery,
    library,
    cardWidth,
    position,
  });
  latest.current = { restaurant, discovery, library, cardWidth, position };
  const actRef = useRef<(save: boolean) => void>(() => {});
  actRef.current = async (save) => {
    const {
      restaurant: current,
      discovery: deck,
      library: store,
      cardWidth: distance,
      position: cardPosition,
    } = latest.current;
    if (!current || deck.loading || busyRef.current || !store.ready) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (save) await store.save(current);
      Animated.timing(cardPosition, {
        toValue: save ? distance + 100 : -distance - 100,
        duration: 230,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || latest.current.restaurant?.id !== current.id) {
          cardPosition.setValue(0);
          busyRef.current = false;
          setBusy(false);
          return;
        }
        deck.nextRestaurant();
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
      cardPosition.setValue(0);
      busyRef.current = false;
      setBusy(false);
      setMessage(
        err instanceof Error ? err.message : "Could not save this place.",
      );
    }
  };
  const pan = useRef(
    PanResponder.create({
      onPanResponderGrant: () => setSwiping(true),
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !busyRef.current &&
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !busyRef.current &&
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      // Keep a horizontal swipe on the card instead of letting its parent
      // ScrollView or details button interrupt it near the screen edge.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        if (!busyRef.current) latest.current.position.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        setSwiping(false);
        if (busyRef.current) return;
        if (Math.abs(gesture.dx) > latest.current.cardWidth * 0.25)
          actRef.current(gesture.dx > 0);
        else
          Animated.spring(latest.current.position, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      },
      onPanResponderTerminate: () => {
        setSwiping(false);
        if (!busyRef.current)
          Animated.spring(latest.current.position, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
      },
    }),
  ).current;
  const selectedCuisine =
    cuisines.find((c) => c.value === library.preferences.cuisine)?.label ??
    "All flavors";
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        <View style={[layout.content, styles.brandRow]}>
          <View style={layout.row}>
            <View style={styles.mark}>
              <Ionicons name="restaurant" size={19} color="#fff" />
            </View>
            <Text accessibilityRole="header" style={styles.brand}>
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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change discovery location"
            onPress={() => setShowLocation(true)}
            disabled={DEMO_MODE}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={styles.eyebrow} numberOfLines={1}>
              {DEMO_MODE
                ? "DEMO NEIGHBORHOOD"
                : (searchLocation?.label ?? "NEAR YOU")}{" "}
              · {Math.round(library.preferences.radius / 1609.34)} MI · Change
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          style={{ flexGrow: 0, flexShrink: 0 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Math.max(24, (width - 472) / 2),
            gap: 9,
            paddingBottom: 10,
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
            { justifyContent: "space-between", marginBottom: 8 },
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
        <View
          testID="discovery-card-frame"
          onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
          style={{
            width: cardWidth,
            alignSelf: "center",
            flex: 1,
            minHeight: 0,
          }}
        >
          {loading || !library.searchReady ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.state}
            >
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.stateTitle}>Finding your flavor…</Text>
              <Text style={layout.subtitle}>
                A little discovery is on its way.
              </Text>
            </ScrollView>
          ) : error || !restaurant ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.state}
            >
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
            </ScrollView>
          ) : (
            <Animated.View
              key={restaurant.id}
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
              <ScrollView
                accessibilityLabel="Restaurant card content"
                directionalLockEnabled
                scrollEnabled={!swiping && !busy}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`View ${restaurant.name} details`}
                  activeOpacity={0.95}
                  onPress={() =>
                    navigation.navigate("RestaurantDetail", {
                      id: restaurant.id,
                    })
                  }
                >
                  <RestaurantImage
                    uri={restaurant.image_url}
                    style={{
                      height: Math.max(80, Math.min(190, cardHeight * 0.38)),
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
              </ScrollView>
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
        <Text
          numberOfLines={2}
          accessibilityLiveRegion="polite"
          style={styles.hint}
        >
          {message ||
            library.error ||
            "Pass on the left. Fall in love on the right."}
        </Text>
        {DEMO_MODE && (
          <Text style={styles.demo}>PREVIEW MODE · SAMPLE RESTAURANTS</Text>
        )}
      </View>
      <Modal
        visible={showLocation}
        animationType="slide"
        onRequestClose={() => setShowLocation(false)}
      >
        <SafeAreaView style={layout.screen}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[layout.content, { paddingVertical: 24 }]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowLocation(false)}
              style={{ minHeight: 48, justifyContent: "center" }}
            >
              <Text style={{ color: colors.green }}>Back to Discover</Text>
            </TouchableOpacity>
            <Text accessibilityRole="header" style={layout.title}>
              Where are we eating?
            </Text>
            <LocationPicker
              label={searchLocation?.label ?? "Near you"}
              onSelect={(value) => {
                setSearchLocation(value);
                if (!value) discovery.useDeviceLocation();
                setShowLocation(false);
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingTop: 6,
    paddingBottom: 2,
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
    width: 48,
    height: 48,
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
    height: "100%",
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
  actions: { justifyContent: "center", gap: 18, paddingTop: 10 },
  undo: {
    width: 48,
    height: 48,
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
    paddingTop: 6,
    paddingBottom: 6,
    minHeight: 42,
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
    flexGrow: 1,
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
