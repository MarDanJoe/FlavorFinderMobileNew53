import type { Restaurant } from "../hooks/useRestaurants";
export interface Preferences {
  radius: number;
  rating: number;
  price: string[];
  cuisine: string;
  openNow: boolean;
}
export interface LibraryData {
  favorites: Restaurant[];
  preferences: Preferences;
}
export const defaultPreferences: Preferences = {
  radius: 8047,
  rating: 0,
  price: [],
  cuisine: "",
  openNow: false,
};
interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}
const emptyLibrary = (): LibraryData => ({
  favorites: [],
  preferences: { ...defaultPreferences, price: [] },
});
export function parseLibrary(raw: string | null): LibraryData {
  if (!raw) return emptyLibrary();
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.favorites))
    throw new Error("Your saved library could not be read.");
  const p = data.preferences || {};
  return {
    favorites: data.favorites.filter(
      (r: any) =>
        typeof r?.id === "string" &&
        typeof r?.name === "string" &&
        r.location &&
        Number.isFinite(r.rating) &&
        Number.isFinite(r.distance) &&
        Array.isArray(r.categories),
    ),
    preferences: {
      radius:
        Number.isFinite(p.radius) && p.radius >= 1 && p.radius <= 50000
          ? p.radius
          : defaultPreferences.radius,
      rating:
        Number.isFinite(p.rating) && p.rating >= 0 && p.rating <= 5
          ? p.rating
          : 0,
      price: Array.isArray(p.price)
        ? p.price.filter((price: string) =>
            ["$", "$$", "$$$", "$$$$"].includes(price),
          )
        : [],
      cuisine: typeof p.cuisine === "string" ? p.cuisine.slice(0, 100) : "",
      openNow: p.openNow === true,
    },
  };
}
export class PersistentLibrary {
  data = emptyLibrary();
  private loaded = false;
  private pending: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: Storage,
    private key: string,
  ) {}
  async load() {
    this.data = parseLibrary(await this.storage.getItem(this.key));
    this.loaded = true;
    return this.data;
  }
  mutate(update: (data: LibraryData) => LibraryData): Promise<LibraryData> {
    const task = this.pending
      .catch(() => {})
      .then(async () => {
        if (!this.loaded)
          throw new Error(
            "Your library could not be loaded. Retry loading before saving changes.",
          );
        const next = update(this.data);
        await this.storage.setItem(this.key, JSON.stringify(next));
        // Publish only after successful persistence. Failed writes never claim success.
        this.data = next;
        return next;
      });
    this.pending = task;
    return task;
  }
}
