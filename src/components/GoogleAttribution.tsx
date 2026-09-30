import React from "react";
import { View, Text, TouchableOpacity, Linking, Image } from "react-native";
import { colors } from "../theme";
export function GoogleAttribution({
  authors = [],
  providers = [],
  photoSource,
}: {
  photoSource?: string;
  providers?: Array<{ provider: string; providerUri?: string }>;
  authors?: Array<{
    displayName: string;
    uri?: string;
    photoUri?: string;
    sourceUri?: string;
  }>;
}) {
  return (
    <View style={{ paddingVertical: 10, gap: 5 }}>
      <Image
        source={require("../../assets/google/maps-logo.png")}
        accessibilityLabel="Google Maps"
        resizeMode="contain"
        style={{
          width: 98,
          height: 18,
          marginTop: 10,
          marginHorizontal: 10,
          marginBottom: 5,
        }}
      />
      {providers.map((provider, i) => (
        <TouchableOpacity
          key={`provider-${i}`}
          accessibilityRole="link"
          disabled={!provider.providerUri}
          onPress={() => {
            if (
              provider.providerUri &&
              /^https:\/\//.test(provider.providerUri)
            )
              void Linking.openURL(provider.providerUri).catch(() => {});
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {provider.provider}
          </Text>
        </TouchableOpacity>
      ))}
      {authors.map((author, i) => (
        <TouchableOpacity
          key={`${author.displayName}-${i}`}
          disabled={!author.uri}
          onPress={() => {
            if (author.uri && /^https:\/\//.test(author.uri))
              void Linking.openURL(author.uri).catch(() => {});
          }}
        >
          {author.photoUri && (
            <Image
              source={{ uri: author.photoUri }}
              style={{ width: 24, height: 24, borderRadius: 12 }}
            />
          )}
          <Text style={{ fontSize: 11, color: colors.muted }}>
            Photo: {author.displayName}
          </Text>
        </TouchableOpacity>
      ))}
      {[
        ...new Set(
          [photoSource, ...authors.map((author) => author.sourceUri)].filter(
            (uri): uri is string => !!uri && /^https:\/\//.test(uri),
          ),
        ),
      ].map((uri) => (
        <TouchableOpacity
          key={uri}
          accessibilityRole="link"
          onPress={() => void Linking.openURL(uri).catch(() => {})}
        >
          <Text style={{ fontSize: 12, color: colors.green }}>
            View photo on Google Maps
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
