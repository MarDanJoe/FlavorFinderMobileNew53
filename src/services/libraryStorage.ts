import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { getRestaurantById } from "./api";
import { defaultPreferences, LibraryData } from "./library";
import type { Restaurant } from "../hooks/useRestaurants";

export function savedPlaceholder(id: string): Restaurant {
  return {
    id,
    name: "Saved restaurant · tap for details",
    image_url: "",
    rating: 0,
    categories: [],
    location: {
      address1: "Connect to refresh this place",
      city: "",
      state: "",
      zip_code: "",
    },
    coordinates: { latitude: 0, longitude: 0 },
    phone: "",
    distance: 0,
  };
}
async function hydrate(ids: string[]) {
  const restaurants: Restaurant[] = [];
  // Keep concurrent requests bounded; provider details are only held in memory.
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.all(
      ids.slice(i, i + 4).map(async (id) => {
        try {
          return await getRestaurantById(id, true);
        } catch {
          return savedPlaceholder(id);
        }
      }),
    );
    restaurants.push(...batch);
  }
  return restaurants;
}
export function libraryStorage(userId?: string) {
  let revision = 0;
  return {
    async getItem(key: string) {
      if (userId && supabase) {
        const { data, error } = await supabase
          .from("libraries")
          .select("place_ids,preferences,revision")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        revision = data?.revision ?? 0;
        return JSON.stringify({
          favorites: await hydrate(data?.place_ids ?? []),
          preferences: data?.preferences ?? defaultPreferences,
        });
      }
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Upgrade old local snapshots to IDs without uploading local accounts.
      const ids =
        data.place_ids ?? data.favorites?.map((r: Restaurant) => r.id);
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
        throw new Error("Unreadable saved places");
      const clean = { place_ids: ids, preferences: data.preferences };
      await AsyncStorage.setItem(key, JSON.stringify(clean));
      return JSON.stringify({
        favorites: await hydrate(ids),
        preferences: data.preferences,
      });
    },
    async setItem(key: string, raw: string) {
      const data: LibraryData = JSON.parse(raw);
      const ids = data.favorites.map((r) => r.id);
      if (ids.length > 100)
        throw new Error(
          "You can save up to 100 places. Remove one to add another.",
        );
      if (userId && supabase) {
        const { data: nextRevision, error } = await supabase.rpc(
          "save_library",
          { ids, prefs: data.preferences, expected_revision: revision },
        );
        if (error) throw new Error(error.message);
        revision = nextRevision;
      } else
        await AsyncStorage.setItem(
          key,
          JSON.stringify({ place_ids: ids, preferences: data.preferences }),
        );
    },
  };
}
