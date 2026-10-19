import mobileAds, {
  AdsConsent,
  MaxAdContentRating,
} from "react-native-google-mobile-ads";
import { createAdsController } from "./controller";
export const adsController = createAdsController({
  gatherConsent: () => AdsConsent.gatherConsent(),
  showPrivacyOptionsForm: () => AdsConsent.showPrivacyOptionsForm(),
  configure: () =>
    mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
    }),
  initialize: () => mobileAds().initialize(),
});
