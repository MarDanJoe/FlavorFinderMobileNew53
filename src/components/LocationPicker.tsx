import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { findSearchLocation } from "../services/api";
import { layout, colors } from "../theme";
export function LocationPicker({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (
    location: { latitude: number; longitude: number; label: string } | null,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const search = async () => {
    if (busy || query.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      onSelect(await findSearchLocation(query));
      setEditing(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to find that location.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: editing }}
        onPress={() => setEditing(!editing)}
        style={{ paddingVertical: 12, minHeight: 48, justifyContent: "center" }}
      >
        <Text style={{ color: colors.green, fontWeight: "600" }}>
          {label} · Change location
        </Text>
      </TouchableOpacity>
      {editing && (
        <View>
          <TextInput
            accessibilityLabel="City, state or ZIP code"
            placeholder="City, state or ZIP code"
            value={query}
            onChangeText={setQuery}
            style={layout.input}
            returnKeyType="search"
            onSubmitEditing={() => void search()}
            editable={!busy}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Explore this city or ZIP code"
            accessibilityState={{
              disabled: busy || query.trim().length < 2,
              busy,
            }}
            disabled={busy || query.trim().length < 2}
            onPress={() => void search()}
            style={layout.primary}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={layout.primaryText}>Explore here</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => {
              onSelect(null);
              setEditing(false);
            }}
            style={{ padding: 14 }}
          >
            <Text style={{ color: colors.green }}>Use my current location</Text>
          </TouchableOpacity>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.accent }}>
              {error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
