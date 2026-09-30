import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  Linking,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import policies from "../legal/policies.json";
import { colors, layout } from "../theme";
export default function LegalScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Legal">) {
  const key = ["privacy", "terms", "support"].includes(route.params.document)
    ? route.params.document
    : "privacy";
  const document = policies[key];
  const link = (url: string) => void Linking.openURL(url).catch(() => {});
  return (
    <SafeAreaView style={layout.screen}>
      <ScrollView
        contentContainerStyle={[layout.content, { paddingBottom: 40 }]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("MainApp")
          }
          style={{ paddingVertical: 16 }}
        >
          <Text style={{ color: colors.green }}>← Back</Text>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={layout.title}>
          {document.title}
        </Text>
        <Text style={[layout.subtitle, { marginVertical: 12 }]}>
          Last updated {policies.updated} · {policies.operator}
        </Text>
        <Text style={layout.subtitle}>{document.intro}</Text>
        {document.sections.map((section) => (
          <View key={section.title} style={{ marginTop: 24 }}>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 8,
              }}
            >
              {section.title}
            </Text>
            <Text style={layout.subtitle}>{section.text}</Text>
          </View>
        ))}
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => link(`mailto:${policies.supportEmail}`)}
          style={{ paddingVertical: 20 }}
        >
          <Text style={{ color: colors.green }}>{policies.supportEmail}</Text>
        </TouchableOpacity>
        {document.links.map((item) => (
          <TouchableOpacity
            key={item.url}
            accessibilityRole="link"
            onPress={() => link(item.url)}
            style={{ paddingVertical: 12 }}
          >
            <Text style={{ color: colors.green }}>{item.label} ↗</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
