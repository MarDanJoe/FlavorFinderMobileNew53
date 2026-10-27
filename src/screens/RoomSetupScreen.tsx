import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { GoogleAttribution } from "../components/GoogleAttribution";
import { FilterSheet } from "../components/FilterSheet";
import { LocationPicker } from "../components/LocationPicker";
import {
  Preferences,
  defaultPreferences,
  restaurantSortOptions,
} from "../services/library";
import { useRestaurants } from "../hooks/useRestaurants";
import { colors, layout } from "../theme";

type Area = { latitude: number; longitude: number; label: string } | null;
type Search = { preferences: Preferences; area: Area };
export function roomSearchSummary({ preferences: p, area }: Search) {
  return `${area?.label ?? "Current location"} · ${(p.radius / 1609.344).toFixed(0)} miles · ${p.cuisine || "All flavors"} · ${p.rating ? `${p.rating}+ stars` : "Any rating"} · ${p.price.length ? p.price.join(", ") : "Any price"} · ${p.openNow ? "Open now" : "Any hours"} · ${restaurantSortOptions.find((option) => option.value === (p.sort ?? "recommended"))?.label ?? "Recommended"}`;
}
export default function RoomSetupScreen({
  navigation,
  route,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route?: { params?: { nickname?: string } };
}) {
  // A group search is independent from the host's personal Discover preferences.
  const [preferences, setPreferences] = useState<Preferences>({
    ...defaultPreferences,
    price: [],
  });
  const [area, setArea] = useState<Area>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState<Search | null>(null);
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[layout.content, { paddingVertical: 24 }]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={{ paddingVertical: 14 }}
        >
          <Text style={{ color: colors.green }}>Back</Text>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={layout.title}>
          Plan the group’s meal.
        </Text>
        <Text style={[layout.subtitle, { marginVertical: 16 }]}>
          Choose an area and filters for this room. Your personal Discover
          filters stay separate. Everyone will vote on the same restaurants.
        </Text>
        <LocationPicker
          label={area?.label ?? "Use my current location"}
          onSelect={(value) => {
            setArea(value);
            setSearch(null);
          }}
        />
        <Text style={[layout.subtitle, { marginBottom: 16 }]}>
          {roomSearchSummary({ preferences, area })}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setShowFilters(true)}
          style={[layout.primary, { marginBottom: 12 }]}
        >
          <Text style={layout.primaryText}>
            Choose cuisine, distance & filters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            setSearch({
              preferences: { ...preferences, price: [...preferences.price] },
              area,
            })
          }
          style={layout.primary}
        >
          <Text style={layout.primaryText}>Find restaurants for this room</Text>
        </TouchableOpacity>
        {search && (
          <RoomDeckPreview
            key={JSON.stringify(search)}
            search={search}
            nickname={route?.params?.nickname}
            navigation={navigation}
          />
        )}
      </ScrollView>
      <FilterSheet
        visible={showFilters}
        value={preferences}
        onClose={() => setShowFilters(false)}
        onApply={(value) => {
          setPreferences(value);
          setSearch(null);
          setShowFilters(false);
        }}
      />
    </SafeAreaView>
  );
}
export function RoomDeckPreview({
  nickname,
  search,
  navigation,
}: {
  nickname?: string;
  search: Search;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const discovery = useRestaurants({
    ...search.preferences,
    searchLocation: search.area ?? undefined,
  });
  const cards = discovery.restaurants.slice(0, 20);
  return (
    <View style={{ marginTop: 24 }}>
      {discovery.loading ? (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={layout.subtitle}>Finding your shared deck…</Text>
        </>
      ) : discovery.error ? (
        <Text accessibilityRole="alert" style={{ color: colors.accent }}>
          {discovery.error}
        </Text>
      ) : (
        <>
          <Text
            accessibilityRole="header"
            style={[layout.title, { fontSize: 24 }]}
          >
            Confirm your shared deck
          </Text>
          <Text style={[layout.subtitle, { marginVertical: 12 }]}>
            {cards.length} restaurants · {roomSearchSummary(search)}
          </Text>
          <GoogleAttribution
            providers={[
              ...new Map(
                cards
                  .flatMap((card) => card.provider_attributions ?? [])
                  .map((provider) => [JSON.stringify(provider), provider]),
              ).values(),
            ]}
          />
          {cards.map((card) => (
            <Text
              key={card.id}
              style={[layout.subtitle, { paddingVertical: 6 }]}
            >
              {card.name}
            </Text>
          ))}
          <Text style={[layout.subtitle, { marginVertical: 12 }]}>
            These restaurants are fixed once you create the room. To change the
            search, edit the area or filters above before continuing.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={cards.length < 2}
            style={[layout.primary, cards.length < 2 && { opacity: 0.5 }]}
            onPress={() =>
              navigation.replace("Room", {
                nickname,
                deck: cards.map((card) => card.id),
                cards,
                searchSummary: roomSearchSummary(search),
              })
            }
          >
            <Text style={layout.primaryText}>Use this deck & continue</Text>
          </TouchableOpacity>
          {cards.length < 2 && (
            <Text style={layout.subtitle}>
              Choose a wider area or different filters to find at least two
              restaurants.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
