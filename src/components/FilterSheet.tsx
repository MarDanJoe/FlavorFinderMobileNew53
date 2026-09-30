import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, layout } from "../theme";
import { Preferences, defaultPreferences } from "../contexts/LibraryContext";
export function FilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: Preferences;
  onClose: () => void;
  onApply: (p: Preferences) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (visible) setDraft({ ...value, price: [...value.price] });
  }, [visible, value]);
  const chips = (
    items: { label: string; selected: boolean; action: () => void }[],
  ) => (
    <View style={styles.chips}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.label}
          accessibilityRole="button"
          accessibilityState={{ selected: item.selected }}
          onPress={item.action}
          style={[styles.chip, item.selected && styles.selected]}
        >
          <Text
            style={{
              color: item.selected ? "#fff" : colors.ink,
              fontWeight: "600",
            }}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close filters"
        />
        <View style={styles.sheet}>
          <View
            style={[
              layout.row,
              { justifyContent: "space-between", marginBottom: 18 },
            ]}
          >
            <Text
              style={[layout.title, { fontSize: 25, flex: 1, marginRight: 8 }]}
            >
              Make it your kind of place.
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close filters"
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>HOW FAR?</Text>
            {chips(
              [1, 5, 10, 15].map((miles) => ({
                label: `${miles} mi`,
                selected: Math.abs(draft.radius - miles * 1609.34) < 2,
                action: () =>
                  setDraft({ ...draft, radius: Math.round(miles * 1609.34) }),
              })),
            )}
            <Text style={styles.label}>PRICE RANGE</Text>
            {chips(
              ["$", "$$", "$$$", "$$$$"].map((price) => ({
                label: price,
                selected: draft.price.includes(price),
                action: () =>
                  setDraft({
                    ...draft,
                    price: draft.price.includes(price)
                      ? draft.price.filter((p) => p !== price)
                      : [...draft.price, price],
                  }),
              })),
            )}
            <Text style={layout.subtitle}>
              Leave all prices unselected to explore every budget.
            </Text>
            <Text style={styles.label}>MINIMUM RATING</Text>
            {chips(
              [0, 3.5, 4, 4.5].map((rating) => ({
                label: rating ? `${rating}+ ★` : "Any rating",
                selected: draft.rating === rating,
                action: () => setDraft({ ...draft, rating }),
              })),
            )}
            <View
              style={[
                layout.row,
                { justifyContent: "space-between", paddingVertical: 24 },
              ]}
            >
              <Text
                style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}
              >
                Open right now
              </Text>
              <Switch
                accessibilityLabel="Only restaurants open now"
                value={draft.openNow}
                onValueChange={(openNow) => setDraft({ ...draft, openNow })}
                trackColor={{ true: colors.green }}
              />
            </View>
          </ScrollView>
          <TouchableOpacity
            style={layout.primary}
            accessibilityRole="button"
            onPress={() => onApply(draft)}
          >
            <Text style={layout.primaryText}>Find my flavor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDraft(defaultPreferences)}
            style={{ padding: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.muted }}>Reset filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#20382E66",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: "90%",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 20,
    marginBottom: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
});
