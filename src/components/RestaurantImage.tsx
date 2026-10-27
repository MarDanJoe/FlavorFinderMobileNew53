import { restaurantSession, supabase } from "../services/supabase";
import { ENV } from "../config/env";
import { Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { Image, View, Text, StyleProp, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../theme";
export function RestaurantImage({
  uri,
  style,
  thumbnail = false,
}: {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  thumbnail?: boolean;
}) {
  const requestedUri =
    thumbnail && uri?.startsWith(`${ENV.API.BASE_URL}/photo?`)
      ? uri.replace(/maxwidth=\d+/, "maxwidth=200")
      : uri;
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState<{
    uri: string;
    headers?: Record<string, string>;
  } | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setFailed(false);
    setSource(null);
    if (!requestedUri) return;
    (async () => {
      try {
        if (supabase && requestedUri.startsWith(`${ENV.API.BASE_URL}/photo?`)) {
          const token = await restaurantSession();
          if (!active) return;
          const headers = {
            Authorization: `Bearer ${token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          };
          if (process.env.EXPO_PUBLIC_DIRECT_PHOTOS === "true") {
            const response = await fetch(`${requestedUri}&delivery=url`, {
              headers,
              signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) throw new Error("Photo unavailable");
            const data = await response.json();
            const direct = new URL(data.photoUri);
            if (
              direct.protocol !== "https:" ||
              direct.username ||
              direct.password ||
              !/^(?:[a-z0-9-]+\.)+(?:googleusercontent\.com|ggpht\.com|gstatic\.com)$/.test(
                direct.hostname,
              ) ||
              direct.searchParams.has("key")
            )
              throw new Error("Photo unavailable");
            // CDN source has no app authentication headers. No prefetch or persistent cache.
            if (active) setSource({ uri: direct.href });
          } else if (Platform.OS === "web") {
            const response = await fetch(requestedUri, {
              headers,
              signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) throw new Error("Photo unavailable");
            objectUrl = URL.createObjectURL(await response.blob());
            if (active) setSource({ uri: objectUrl });
            else URL.revokeObjectURL(objectUrl);
          } else if (active) setSource({ uri: requestedUri, headers });
        } else if (active) setSource({ uri: requestedUri });
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestedUri]);
  return (
    <View style={[{ overflow: "hidden", backgroundColor: colors.soft }, style]}>
      {source && !failed ? (
        <Image
          source={source}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailed(true)}
          accessibilityLabel="Restaurant image"
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Ionicons name="restaurant-outline" size={52} color={colors.accent} />
          <Text style={{ color: colors.muted }}>A new flavor awaits</Text>
        </View>
      )}
    </View>
  );
}
