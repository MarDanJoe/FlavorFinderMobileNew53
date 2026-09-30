import { LegalLinks } from "../components/LegalLinks";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { useLibrary } from "../contexts/LibraryContext";
import { FilterSheet } from "../components/FilterSheet";
import { DEMO_MODE } from "../config/demo";
import { colors, layout } from "../theme";
export default function ProfileScreen() {
  const { user, signOut, updateProfile, deleteAccount } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { favorites, preferences, updatePreferences } = useLibrary();
  const [filters, setFilters] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.username ?? "");
  const [message, setMessage] = useState("");
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          layout.content,
          { paddingTop: 28, paddingBottom: 30 },
        ]}
      >
        <Text style={styles.eyebrow}>A TASTE OF YOU</Text>
        <Text style={[layout.title, { marginTop: 10 }]}>
          Made for your appetite.
        </Text>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text
              style={{ color: colors.accent, fontSize: 32, fontWeight: "800" }}
            >
              {user?.username?.slice(0, 1).toUpperCase() || "F"}
            </Text>
          </View>
          <Text style={styles.name}>{user?.username ?? "Food explorer"}</Text>
          <Text style={layout.subtitle}>
            {DEMO_MODE
              ? "A little taste of what’s possible"
              : user?.email || "Exploring as a guest"}
          </Text>
          {user && (
            <TouchableOpacity
              onPress={() => {
                setName(user?.username ?? "");
                setEditing(!editing);
              }}
              style={{ padding: 12 }}
            >
              <Text
                style={{ color: colors.green, fontWeight: "700", fontSize: 13 }}
              >
                Edit your name
              </Text>
            </TouchableOpacity>
          )}
          {!user && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={layout.primary}
            >
              <Text style={layout.primaryText}>Sign in to sync favorites</Text>
            </TouchableOpacity>
          )}
          {editing && (
            <View style={{ width: "100%" }}>
              <TextInput
                accessibilityLabel="Your display name"
                value={name}
                onChangeText={setName}
                style={layout.input}
                placeholder="Your name"
              />
              <TouchableOpacity
                style={layout.primary}
                onPress={() => {
                  void updateProfile(name)
                    .then(() => {
                      setEditing(false);
                      setMessage("Your profile has been updated.");
                    })
                    .catch((e) => setMessage(e.message));
                }}
              >
                <Text style={layout.primaryText}>Save name</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.number}>{favorites.length}</Text>
            <Text style={styles.statLabel}>SAVED PLACES</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={styles.stat}>
            <Text style={styles.number}>
              {Math.round(preferences.radius / 1609.34)} mi
            </Text>
            <Text style={styles.statLabel}>DISCOVERY RADIUS</Text>
          </View>
        </View>
        <Text style={styles.section}>YOUR DISCOVERY SETTINGS</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setFilters(true)}
          style={styles.menu}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="options-outline" size={21} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Your kind of place</Text>
            <Text style={styles.menuSub}>
              {preferences.rating
                ? `${preferences.rating}+ stars`
                : "All ratings"}{" "}
              ·{" "}
              {preferences.price.length
                ? preferences.price.join(", ")
                : "Every budget"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>
        <View style={styles.note}>
          <Ionicons name="leaf-outline" size={22} color={colors.green} />
          <Text
            style={{
              flex: 1,
              color: colors.green,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            Follow your curiosity. The best meals often start somewhere new.
          </Text>
        </View>
        {!!message && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.accent, marginBottom: 15 }}
          >
            {message}
          </Text>
        )}
        {!DEMO_MODE && user && (
          <TouchableOpacity
            onPress={() => {
              void signOut().catch(() =>
                setMessage("Unable to sign out. Please try again."),
              );
            }}
            style={{ padding: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.accent, fontWeight: "700" }}>
              Sign out
            </Text>
          </TouchableOpacity>
        )}
        {!DEMO_MODE && user && (
          <TouchableOpacity
            onPress={() => setDeleting(!deleting)}
            style={{ padding: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.accent }}>Delete account</Text>
          </TouchableOpacity>
        )}
        {deleting && (
          <View>
            <Text style={layout.subtitle}>
              Permanently delete your account and synced favorites. Enter your
              password to confirm.
            </Text>
            <TextInput
              accessibilityLabel="Password to delete account"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              style={layout.input}
              editable={!busy}
            />
            <TouchableOpacity
              disabled={busy || !deletePassword}
              style={layout.primary}
              onPress={() =>
                Alert.alert(
                  "Delete your account?",
                  "This permanently removes your account and synced favorites.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete permanently",
                      style: "destructive",
                      onPress: async () => {
                        setBusy(true);
                        try {
                          await deleteAccount(deletePassword);
                          setDeleting(false);
                          setDeletePassword("");
                          setMessage("Your account has been deleted.");
                        } catch (e) {
                          setMessage(
                            e instanceof Error
                              ? e.message
                              : "Unable to delete account.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      },
                    },
                  ],
                )
              }
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={layout.primaryText}>Delete permanently</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {[
          ["Privacy policy", process.env.EXPO_PUBLIC_PRIVACY_URL],
          ["Terms of use", process.env.EXPO_PUBLIC_TERMS_URL],
          ["Support", process.env.EXPO_PUBLIC_SUPPORT_URL],
        ].map(([label, url]) =>
          url ? (
            <TouchableOpacity
              key={label}
              style={{ padding: 14 }}
              onPress={() => {
                void Linking.openURL(url).catch(() =>
                  setMessage("Unable to open this page."),
                );
              }}
            >
              <Text style={{ color: colors.green }}>{label}</Text>
            </TouchableOpacity>
          ) : null,
        )}
        <Text style={styles.footer}>
          flavorfinder. · FIND SOMETHING YOU LOVE
        </Text>
        {DEMO_MODE && (
          <Text style={[styles.footer, { marginTop: 12 }]}>
            Sample data · Changes stay on this device
          </Text>
        )}
        <LegalLinks />
      </ScrollView>
      <FilterSheet
        visible={filters}
        value={preferences}
        onClose={() => setFilters(false)}
        onApply={(p) => {
          void updatePreferences(p)
            .then(() => setFilters(false))
            .catch((e) => setMessage(e.message));
        }}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  identity: {
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.paper,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 25,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  name: { fontSize: 23, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  stats: { flexDirection: "row", paddingVertical: 22, marginVertical: 20 },
  stat: { flex: 1, alignItems: "center" },
  number: { color: colors.ink, fontSize: 29, fontWeight: "800" },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.1,
    marginTop: 5,
  },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.paper,
  },
  menuIcon: { padding: 11, backgroundColor: "#EDF3EB", borderRadius: 14 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  menuSub: { fontSize: 12, color: colors.muted, marginTop: 5 },
  note: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#EDF3EB",
    borderRadius: 20,
    marginVertical: 24,
  },
  footer: {
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1,
    textAlign: "center",
  },
});
