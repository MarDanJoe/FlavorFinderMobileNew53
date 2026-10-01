import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { libraryStorage } from "../services/libraryStorage";
import { DEMO_MODE } from "../config/demo";
import { useAuth } from "./AuthContext";
import type { Restaurant } from "../hooks/useRestaurants";
import {
  PersistentLibrary,
  LibraryData,
  Preferences,
  defaultPreferences,
} from "../services/library";
export { Preferences, defaultPreferences } from "../services/library";
interface Library {
  favorites: Restaurant[];
  preferences: Preferences;
  ready: boolean;
  error: string | null;
  save: (r: Restaurant) => Promise<void>;
  remove: (id: string) => Promise<void>;
  updatePreferences: (p: Preferences) => Promise<void>;
  reload: () => void;
}
const Context = createContext<Library | null>(null);
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const key = `flavorfinder:library:${user?.id ?? "guest"}`;
  const [data, setData] = useState<LibraryData>({
    favorites: [],
    preferences: defaultPreferences,
  });
  const [dataKey, setDataKey] = useState(key);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const store = useRef<PersistentLibrary | null>(null);
  const storeKey = useRef<string | null>(null);
  const renderedKey = useRef(key);
  renderedKey.current = key;
  useEffect(() => {
    let active = true;
    const current = new PersistentLibrary(
      DEMO_MODE ? AsyncStorage : libraryStorage(user?.id),
      key,
    );
    store.current = current;
    storeKey.current = key;
    setDataKey(key);
    setReady(false);
    setData({ favorites: [], preferences: defaultPreferences });
    setError(null);
    current
      .load()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active)
          setError(
            "Your library could not be loaded. Tap retry to load it again.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [key, version]);
  const mutate = async (update: (value: LibraryData) => LibraryData) => {
    const current = store.current;
    if (
      !ready ||
      !current ||
      storeKey.current !== key ||
      renderedKey.current !== key
    )
      throw new Error("Your library is still loading. Please try again.");
    try {
      const next = await current.mutate(update);
      if (store.current === current && renderedKey.current === key) {
        setData(next);
        setError(null);
      }
    } catch {
      if (store.current === current && renderedKey.current === key)
        setError("Changes could not be saved. Your previous library is safe.");
      throw new Error(
        "Could not save changes. Reload your saved places and try again.",
      );
    }
  };
  return (
    <Context.Provider
      value={{
        ...(dataKey === key
          ? data
          : { favorites: [], preferences: defaultPreferences }),
        ready: ready && dataKey === key && storeKey.current === key,
        error: dataKey === key ? error : null,
        reload: () => setVersion((value) => value + 1),
        save: (r) =>
          mutate((value) => ({
            ...value,
            favorites: value.favorites.some((item) => item.id === r.id)
              ? value.favorites
              : [r, ...value.favorites],
          })),
        remove: (id) =>
          mutate((value) => ({
            ...value,
            favorites: value.favorites.filter((r) => r.id !== id),
          })),
        updatePreferences: (preferences) =>
          mutate((value) => ({ ...value, preferences })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useLibrary = () => {
  const value = useContext(Context);
  if (!value) throw new Error("LibraryProvider is missing");
  return value;
};
