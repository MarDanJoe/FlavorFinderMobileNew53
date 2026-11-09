// Search terms, not guarantees about ingredients or dietary suitability.
export const cuisineOptions = [
  { label: "All flavors", value: "" },
  { label: "Pizza", value: "pizza" },
  { label: "Tacos", value: "tacos" },
  { label: "Japanese", value: "japanese" },
  { label: "Burgers", value: "burgers" },
  { label: "Brunch", value: "brunch" },
  { label: "African", value: "african" },
  { label: "American", value: "american" },
  { label: "Barbecue", value: "barbecue" },
  { label: "Brazilian", value: "brazilian" },
  { label: "Caribbean", value: "caribbean" },
  { label: "Chinese", value: "chinese" },
  { label: "Cuban", value: "cuban" },
  { label: "Ethiopian", value: "ethiopian" },
  { label: "Filipino", value: "filipino" },
  { label: "French", value: "french" },
  { label: "Greek", value: "greek" },
  { label: "Healthy", value: "healthy" },
  { label: "Indian", value: "indian" },
  { label: "Italian", value: "italian" },
  { label: "Jamaican", value: "jamaican" },
  { label: "Korean", value: "korean" },
  { label: "Lebanese", value: "lebanese" },
  { label: "Mediterranean", value: "mediterranean" },
  { label: "Mexican", value: "mexican" },
  { label: "Middle Eastern", value: "middle eastern" },
  { label: "Nigerian", value: "nigerian" },
  { label: "Pakistani", value: "pakistani" },
  { label: "Peruvian", value: "peruvian" },
  { label: "Seafood", value: "seafood" },
  { label: "Soul food", value: "soul food" },
  { label: "Spanish", value: "spanish" },
  { label: "Thai", value: "thai" },
  { label: "Turkish", value: "turkish" },
  { label: "Vietnamese", value: "vietnamese" },
];

export function cuisineLabel(value: string) {
  return (
    cuisineOptions.find((option) => option.value === value)?.label ||
    value ||
    "All flavors"
  );
}
