import { Asset } from "expo-asset";
import {
  demoPlaces as samples,
  demoRestaurant as basicRestaurant,
} from "./demoSamples";
const photos = [
  require("../../assets/pizza.png"),
  require("../../assets/tacos.png"),
  require("../../assets/sushi.png"),
  require("../../assets/burger.png"),
  require("../../assets/brunch.png"),
];
export const demoPlaces = samples.map((place, index) => ({
  ...place,
  image_url: Asset.fromModule(photos[index]).uri,
}));
export const demoRestaurant = (id: string) => ({
  ...basicRestaurant(id),
  image_url: demoPlaces.find((place) => place.place_id === id)?.image_url ?? "",
});
