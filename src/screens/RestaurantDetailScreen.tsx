import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getRestaurantById } from "../services/api";
import type { Restaurant } from "../hooks/useRestaurants";
import { useLibrary } from "../contexts/LibraryContext";
import { GoogleAttribution } from "../components/GoogleAttribution";
import { RestaurantImage } from "../components/RestaurantImage";
import { DEMO_MODE } from "../config/demo";
import { colors, layout } from "../theme";
type Props = {
  route: RouteProp<RootStackParamList, "RestaurantDetail">;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};
export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const library = useLibrary();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getRestaurantById(id)
      .then((r) => {
        if (active) {
          setRestaurant(r);
          setDetails(r);
        }
      })
      .catch((err) => {
        if (active) {
          const cached = library.favorites.find((r) => r.id === id);
          if (cached) {
            setRestaurant(cached);
            setDetails(null);
            setMessage(
              "Connect to refresh this saved place. Hours and reviews are unavailable.",
            );
          } else
            setError(
              err instanceof Error ? err.message : "Unable to load this place.",
            );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  const saved = library.favorites.some((r) => r.id === id);
  const openLink = async (url: string) => {
    try {
      if (!/^(https?:\/\/|tel:)/i.test(url)) throw new Error();
      await Linking.openURL(url);
    } catch {
      setMessage("This link could not be opened on your device.");
    }
  };
  const toggleSaved = async () => {
    if (!restaurant || saving) return;
    setSaving(true);
    try {
      if (saved) await library.remove(id);
      else await library.save(restaurant);
      setMessage(
        saved
          ? "Removed from your saved places."
          : "A good find, saved for later.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <View
        style={[
          layout.content,
          layout.row,
          { justifyContent: "space-between", paddingVertical: 16 },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to discoveries"
          onPress={() => navigation.goBack()}
          style={styles.round}
        >
          <Ionicons name="arrow-back" color={colors.ink} size={22} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>A closer look</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Share restaurant"
          disabled={!restaurant || DEMO_MODE}
          style={[styles.round, DEMO_MODE && { opacity: 0.3 }]}
          onPress={() =>
            restaurant &&
            Share.share({
              message: `${restaurant.name} — ${restaurant.location.address1}\nhttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${encodeURIComponent(id)}`,
            }).catch(() => setMessage("Sharing is unavailable on this device."))
          }
        >
          <Ionicons name="share-outline" size={21} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[layout.subtitle, { marginTop: 14 }]}>
            Getting to know this place…
          </Text>
        </View>
      ) : error || !restaurant ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={colors.accent}
          />
          <Text style={[layout.title, { fontSize: 24, marginTop: 16 }]}>
            Let’s try that again.
          </Text>
          <Text style={[layout.subtitle, { textAlign: "center", margin: 18 }]}>
            {error || "This restaurant is unavailable."}
          </Text>
          <TouchableOpacity
            style={layout.primary}
            onPress={() => setAttempt((a) => a + 1)}
          >
            <Text style={layout.primaryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[layout.content, { paddingBottom: 36 }]}
        >
          <RestaurantImage
            uri={restaurant.image_url}
            style={{ height: 260, borderRadius: 26 }}
          />
          {!DEMO_MODE && (
            <GoogleAttribution
              authors={restaurant?.photo_attributions}
              providers={restaurant?.provider_attributions}
              photoSource={restaurant?.photo_source_uri}
            />
          )}
          <View
            style={[layout.row, { marginTop: 22, marginBottom: 10, gap: 8 }]}
          >
            <Text style={styles.rating}>★ {restaurant.rating.toFixed(1)}</Text>
            <Text style={layout.subtitle}>
              {restaurant.price || "Price unavailable"}
            </Text>
            {details?.opening_hours?.open_now !== undefined && (
              <Text style={[styles.status, { marginLeft: "auto" }]}>
                {details.opening_hours.open_now ? "● Open now" : "Closed now"}
              </Text>
            )}
          </View>
          <Text style={layout.title}>{restaurant.name}</Text>
          <Text style={[layout.subtitle, { marginTop: 10 }]}>
            {restaurant.location.address1}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              saved ? "Remove from saved places" : "Save this restaurant"
            }
            disabled={saving || !library.ready}
            style={[
              layout.primary,
              {
                backgroundColor: saved ? colors.green : colors.accent,
                marginTop: 24,
                flexDirection: "row",
                gap: 9,
              },
            ]}
            onPress={toggleSaved}
          >
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={20}
              color="#fff"
            />
            <Text style={layout.primaryText}>
              {saving
                ? "Saving…"
                : saved
                  ? "Saved to your places"
                  : "Save for a delicious day"}
            </Text>
          </TouchableOpacity>
          {!!message && (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                fontSize: 12,
                color: colors.green,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {message}
            </Text>
          )}
          <View style={styles.links}>
            {[
              {
                name: "navigate-outline" as const,
                title: "Directions",
                enabled: !DEMO_MODE,
                action: () =>
                  openLink(
                    `https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates.latitude},${restaurant.coordinates.longitude}&destination_place_id=${encodeURIComponent(id)}`,
                  ),
              },
              {
                name: "call-outline" as const,
                title: "Call",
                enabled: !!details?.formatted_phone_number && !DEMO_MODE,
                action: () => openLink(`tel:${details.formatted_phone_number}`),
              },
              {
                name: "globe-outline" as const,
                title: "Website",
                enabled: !!details?.website && !DEMO_MODE,
                action: () => openLink(details.website),
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.title}
                accessibilityRole="button"
                accessibilityLabel={action.title}
                disabled={!action.enabled}
                onPress={action.action}
                style={[styles.link, !action.enabled && { opacity: 0.35 }]}
              >
                <Ionicons name={action.name} size={22} color={colors.green} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.ink,
                    marginTop: 9,
                    fontWeight: "600",
                  }}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {DEMO_MODE && (
            <Text style={[layout.subtitle, { fontSize: 11, marginBottom: 18 }]}>
              This is a sample place. Contact and directions are available for
              real restaurants.
            </Text>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Good to know</Text>
            <Text style={[layout.subtitle, { marginTop: 12 }]}>
              {" "}
              {restaurant.categories
                .filter(
                  (c: any) =>
                    ![
                      "point_of_interest",
                      "establishment",
                      "food",
                      "restaurant",
                    ].includes(c.alias),
                )
                .map((c: any) => c.title)
                .join(" · ") || "Restaurant"}
            </Text>
          </View>
          {!!details?.opening_hours?.weekday_text?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>When to drop by</Text>
              {details.opening_hours.weekday_text.map((day: string) => (
                <Text key={day} style={[layout.subtitle, { marginTop: 10 }]}>
                  {day}
                </Text>
              ))}
            </View>
          )}
          {!!details?.reviews?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What people are saying</Text>
              <Text
                style={{ color: colors.muted, fontSize: 12, marginBottom: 12 }}
              >
                Reviews selected by Google Maps, ordered by relevance.
              </Text>
              {details.reviews.map((review: any, index: number) => (
                <View key={index} style={styles.review}>
                  <View
                    style={[layout.row, { justifyContent: "space-between" }]}
                  >
                    <TouchableOpacity
                      disabled={!review.author_url}
                      onPress={() =>
                        review.author_url && void openLink(review.author_url)
                      }
                    >
                      {!!review.author_photo && (
                        <Image
                          source={{ uri: review.author_photo }}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                      )}
                      <Text style={{ color: colors.ink, fontWeight: "700" }}>
                        {review.author_name}
                      </Text>
                    </TouchableOpacity>
                    {!!review.source_uri && (
                      <TouchableOpacity
                        onPress={() => void openLink(review.source_uri)}
                      >
                        <Text style={{ color: colors.green, fontSize: 12 }}>
                          View review on Google Maps
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.rating}>★ {review.rating}</Text>
                  </View>
                  <Text
                    style={[layout.subtitle, { fontSize: 11, marginTop: 5 }]}
                  >
                    {review.relative_time_description}
                    {review.visit_date?.month && review.visit_date?.year
                      ? ` · Visited ${new Date(review.visit_date.year, review.visit_date.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                      : ""}
                  </Text>
                  <Text
                    style={[
                      layout.subtitle,
                      { marginTop: 12, color: colors.ink },
                    ]}
                  >
                    {review.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  round: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderWidth: 1,
  },
  topTitle: { fontSize: 13, color: colors.ink, fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  rating: { fontSize: 14, color: colors.accent, fontWeight: "700" },
  status: { fontSize: 11, color: colors.green, fontWeight: "600" },
  links: { flexDirection: "row", gap: 12, marginVertical: 22 },
  link: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    alignItems: "center",
  },
  section: {
    paddingVertical: 22,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  review: {
    backgroundColor: colors.paper,
    padding: 18,
    borderRadius: 18,
    marginTop: 16,
  },
});
