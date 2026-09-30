// Adapter keeps the app contract stable while using Places API (New).
const fields =
  "id,displayName,formattedAddress,location,rating,priceLevel,types,currentOpeningHours,photos,attributions";
const price = (value: string) =>
  ({
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  })[value];
export function normalizePlace(p: any) {
  return {
    place_id: p.id,
    provider_attributions: p.attributions || [],
    name: p.displayName?.text,
    vicinity: p.formattedAddress,
    formatted_address: p.formattedAddress,
    geometry: {
      location: { lat: p.location?.latitude, lng: p.location?.longitude },
    },
    rating: p.rating,
    price_level: price(p.priceLevel),
    types: p.types || [],
    opening_hours: p.currentOpeningHours
      ? {
          open_now: p.currentOpeningHours.openNow,
          weekday_text: p.currentOpeningHours.weekdayDescriptions,
        }
      : undefined,
    photos: p.photos?.map((photo: any) => ({
      photo_reference: photo.name,
      source_uri: photo.googleMapsUri,
      author_attributions: (photo.authorAttributions || []).map((a: any) => ({
        ...a,
        sourceUri: photo.googleMapsUri,
      })),
    })),
    formatted_phone_number: p.nationalPhoneNumber,
    website: p.websiteUri,
    user_ratings_total: p.userRatingCount,
    reviews: p.reviews?.map((r: any) => ({
      author_name: r.authorAttribution?.displayName,
      author_url: r.authorAttribution?.uri,
      author_photo: r.authorAttribution?.photoUri,
      source_uri: r.googleMapsUri,
      rating: r.rating,
      text: r.text?.text,
      relative_time_description: r.relativePublishTimeDescription,
      visit_date: r.visitDate,
    })),
  };
}
export function searchRequest(q: URLSearchParams) {
  const coords = (q.get("location") || "").split(",");
  const [latitude, longitude] = coords.map(Number);
  const radius = Number(q.get("radius"));
  if (
    coords.length !== 2 ||
    coords.some((c) => !c.trim()) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    !Number.isFinite(radius) ||
    radius < 1 ||
    radius > 50000
  )
    throw new Error("Invalid search location or radius");
  if (q.get("keyword") || q.get("opennow") === "true")
    return {
      endpoint: "places:searchText",
      mask: `places.${fields.split(",").join(",places.")},nextPageToken`,
      body: {
        textQuery: `${(q.get("keyword") || "").slice(0, 100)} restaurants`,
        includedType: "restaurant",
        strictTypeFiltering: true,
        openNow: q.get("opennow") === "true",
        pageSize: 20,
        locationBias: { circle: { center: { latitude, longitude }, radius } },
        ...(q.get("pagetoken")
          ? { pageToken: q.get("pagetoken")!.slice(0, 2048) }
          : {}),
      },
    };
  return {
    endpoint: "places:searchNearby",
    mask: `places.${fields.split(",").join(",places.")}`,
    body: {
      includedTypes: ["restaurant"],
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude, longitude }, radius },
      },
    },
  };
}
export function photoResource(q: URLSearchParams) {
  const ref = q.get("photoreference") || "";
  if (
    !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref) ||
    ref.length > 2048
  )
    throw new Error("Invalid photo");
  const width = Number(q.get("maxwidth") || 400);
  if (!Number.isInteger(width) || width < 1 || width > 1600)
    throw new Error("Invalid photo size");
  return `${ref}/media?maxWidthPx=${width}`;
}
export function detailMask(q: URLSearchParams) {
  const full = q.get("fields")?.includes("reviews");
  return full
    ? `${fields},nationalPhoneNumber,websiteUri,userRatingCount,reviews`
    : "id,displayName,formattedAddress,location,rating,priceLevel,types,photos,attributions";
}
