import admob from "./admob.json";
import { DEMO_MODE } from "./demo";
// Signed internal builds default to Google test inventory. Live ads require an explicit release setting.
export const adsMode =
  DEMO_MODE || process.env.EXPO_PUBLIC_ADS_MODE === "off"
    ? "off"
    : process.env.EXPO_PUBLIC_ADS_MODE === "live" && !__DEV__
      ? "live"
      : "test";
export const savedBannerUnitId = admob.savedBannerUnitId;
