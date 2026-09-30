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
}: {
  uri?: string;
  style?: StyleProp<ViewStyle>;
}) {
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
    if (!uri) return;
    (async () => {
      try {
        if (supabase && uri.startsWith(`${ENV.API.BASE_URL}/photo?`)) {
          const token = await restaurantSession();
          const headers = {
            Authorization: `Bearer ${token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          };
          if (Platform.OS === "web") {
            const response = await fetch(uri, {
              headers,
              signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) throw new Error("Photo unavailable");
            objectUrl = URL.createObjectURL(await response.blob());
            if (active) setSource({ uri: objectUrl });
            else URL.revokeObjectURL(objectUrl);
          } else if (active) setSource({ uri, headers });
        } else if (active) setSource({ uri });
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uri]);
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
