import { secureSessionStorage } from "./secureSessionStorage";
import { randomUUID } from "expo-crypto";
import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = !!url && !!key;
// Native credentials go in the OS keychain. Browser preview uses local storage.
const storage =
  Platform.OS === "web"
    ? AsyncStorage
    : secureSessionStorage(SecureStore, randomUUID);
export const supabase = cloudConfigured
  ? createClient(url!, key!, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
if (supabase && Platform.OS !== "web") {
  if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
let guestRequest: Promise<void> | null = null;
export async function restaurantSession() {
  if (!supabase) throw new Error("Restaurant service is not connected yet.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    guestRequest ??= supabase.auth
      .signInAnonymously()
      .then(({ error }) => {
        if (error) throw error;
      })
      .finally(() => {
        guestRequest = null;
      });
    await guestRequest;
  }
  const { data: current } = await supabase.auth.getSession();
  if (!current.session) throw new Error("Unable to connect. Please try again.");
  return current.session.access_token;
}
export async function placesFetch(path: string) {
  const base =
    process.env.EXPO_PUBLIC_PLACES_API_URL ||
    (url ? `${url}/functions/v1/places` : "http://localhost:8082/places");
  const token = supabase ? await restaurantSession() : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base}/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}`, apikey: key! } : {},
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Discovery is busy. Please try again later."
          : "Restaurant service is unavailable. Please try again.",
      );
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
