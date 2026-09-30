const samples = [
  ["demo-pizza", "Ember & Crust", "Wood-fired pizza", 4.7, 2, "#d86b36", "🍕"],
  [
    "demo-tacos",
    "Lime Street Tacos",
    "Fresh tacos and bowls",
    4.4,
    1,
    "#449b75",
    "🌮",
  ],
  ["demo-sushi", "Sakura Kitchen", "Japanese kitchen", 4.8, 3, "#b65a80", "🍣"],
  [
    "demo-burger",
    "The Burger Garden",
    "Burgers and fries",
    4.2,
    2,
    "#c68b37",
    "🍔",
  ],
  ["demo-cafe", "Morning Bloom", "Coffee and brunch", 4.6, 1, "#7084a8", "☕"],
] as const;

export const demoPlaces = samples.map(
  ([id, name, cuisine, rating, price, color, emoji], index) => ({
    place_id: id,
    name,
    rating,
    price_level: price,
    vicinity: `${120 + index * 24} Sample Street`,
    types: ["restaurant", cuisine],
    geometry: {
      location: { lat: 40.7128 + index * 0.005, lng: -74.006 + index * 0.003 },
    },
    opening_hours: {
      open_now: true,
      weekday_text: ["Sample hours: daily 11 AM – 9 PM"],
    },
    image_url: "",
  }),
);

export const demoRestaurant = (id: string) => {
  const place = demoPlaces.find((item) => item.place_id === id);
  if (!place) throw new Error("Sample restaurant not found");
  return {
    id,
    name: place.name,
    image_url: place.image_url,
    rating: place.rating,
    price: "$".repeat(place.price_level),
    categories: place.types.map((title) => ({ alias: title, title })),
    location: {
      address1: place.vicinity,
      city: "Demo City",
      state: "",
      zip_code: "",
    },
    coordinates: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    },
    distance: 0,
    phone: "",
    opening_hours: place.opening_hours,
    reviews: [],
  };
};
