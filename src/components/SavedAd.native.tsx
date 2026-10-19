import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { adsMode, savedBannerUnitId } from "../config/ads";
import { adsController } from "../services/ads/runtime.native";
import { colors } from "../theme";
const options = { requestNonPersonalizedAdsOnly: true };
function useAds() {
  const focused = useIsFocused();
  const enabled = Platform.OS === "ios" && adsMode !== "off";
  const state = useSyncExternalStore(
    adsController.subscribe,
    adsController.getSnapshot,
  );
  useEffect(() => {
    if (enabled && focused) void adsController.start();
  }, [enabled, focused]);
  return { ...state, visible: enabled && focused };
}
export function SavedAd() {
  const state = useAds();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [state.revision]);
  if (!state.visible || !state.ready || failed) return null;
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 8 }}>
        {adsMode === "test" ? "Advertisement · Test ad" : "Advertisement"}
      </Text>
      <BannerAd
        key={state.revision}
        unitId={adsMode === "test" ? TestIds.BANNER : savedBannerUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={options}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
export function AdPrivacyOptions() {
  const state = useAds();
  if (!state.visible) return null;
  return (
    <View style={{ paddingVertical: 18 }}>
      {state.privacyRequired && (
        <TouchableOpacity
          accessibilityRole="button"
          disabled={state.busy}
          accessibilityState={{ disabled: state.busy, busy: state.busy }}
          onPress={() => {
            void adsController.privacy();
          }}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text style={{ color: colors.green }}>Ad privacy choices</Text>
        </TouchableOpacity>
      )}
      {!!state.message && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>
          {state.message}
        </Text>
      )}
    </View>
  );
}
