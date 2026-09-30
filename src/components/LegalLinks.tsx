import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";
export function LegalLinks() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
        marginTop: 20,
      }}
    >
      {(
        [
          ["privacy", "Privacy"],
          ["terms", "Terms"],
          ["support", "Support"],
        ] as const
      ).map(([document, label]) => (
        <TouchableOpacity
          key={document}
          accessibilityRole="link"
          accessibilityLabel={label}
          onPress={() => navigation.navigate("Legal", { document })}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 13, color: colors.green }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
