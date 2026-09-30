import { LegalLinks } from "./LegalLinks";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { colors, layout } from "../theme";
export function AuthScreen({ register = false }: { register?: boolean }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resendWait, setResendWait] = useState(0);
  useEffect(() => {
    if (!resendWait) return;
    const timer = setTimeout(
      () => setResendWait((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendWait]);
  const [code, setCode] = useState("");
  const submit = async () => {
    if (busy) return;
    if (
      !email.trim() ||
      (!confirming && (!password || (register && !name.trim())))
    ) {
      setError("Fill in all fields to keep going.");
      return;
    }
    if (!confirming && (register || recovering) && password !== confirm) {
      setError("Your passwords don’t match yet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (confirming) {
        await auth.confirmEmail(email, code);
        setCode("");
        navigation.navigate("MainApp");
      } else if (recovering) {
        await auth.resetPassword(email, code, password);
        setRecovering(false);
        setPassword("");
        setConfirm("");
        setCode("");
        setNotice("Password updated. Sign in with your new password.");
      } else if (register) {
        const signedIn = await auth.signUp(email, name, password);
        if (signedIn) navigation.navigate("MainApp");
        else {
          setConfirming(true);
          setResendWait(60);
          setPassword("");
          setConfirm("");
          setNotice(
            "Check your email. Enter its confirmation code here, or follow its confirmation link and then sign in.",
          );
        }
      } else {
        await auth.signIn(email, password);
        navigation.navigate("MainApp");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={layout.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            layout.content,
            {
              flexGrow: 1,
              paddingTop: 35,
              paddingBottom: 30,
              justifyContent: "center",
            },
          ]}
        >
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={30} color="#fff" />
          </View>
          <Text style={styles.brand}>flavorfinder.</Text>
          <Text style={[layout.title, { marginTop: 30, marginBottom: 10 }]}>
            {confirming
              ? "Check your inbox."
              : recovering
                ? "A fresh start."
                : register
                  ? "Your next favorite\nstarts here."
                  : "A world of flavor.\nWelcome back."}
          </Text>
          <Text style={[layout.subtitle, { marginBottom: 28 }]}>
            {confirming
              ? "Confirm your email to start saving your favorites."
              : recovering
                ? "Enter your recovery code and a new password."
                : register
                  ? "Make room for a little delicious discovery."
                  : "Good food and new favorites are waiting for you."}
          </Text>
          {register && !confirming && (
            <TextInput
              accessibilityLabel="Your name"
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={layout.input}
              maxLength={40}
              autoComplete="name"
              editable={!busy}
            />
          )}
          <TextInput
            accessibilityLabel="Email address"
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            style={layout.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!busy}
          />
          {!confirming && (
            <View style={[layout.input, layout.row, { paddingVertical: 0 }]}>
              <TextInput
                accessibilityLabel="Password"
                placeholder={
                  register || recovering
                    ? "New password · at least 8 characters"
                    : "Password"
                }
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  color: colors.ink,
                  fontSize: 15,
                }}
                secureTextEntry={!visible}
                autoComplete={
                  register || recovering ? "new-password" : "current-password"
                }
                editable={!busy}
                onSubmitEditing={() => !register && void submit()}
              />
              <TouchableOpacity
                accessibilityLabel={visible ? "Hide password" : "Show password"}
                onPress={() => setVisible(!visible)}
                style={{ padding: 8 }}
              >
                <Ionicons
                  name={visible ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          )}
          {(recovering || confirming) && (
            <TextInput
              accessibilityLabel={
                confirming ? "Email confirmation code" : "Recovery code"
              }
              placeholder="Code from your email"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
              maxLength={10}
              autoComplete="one-time-code"
              editable={!busy}
              keyboardType="number-pad"
              style={layout.input}
            />
          )}
          {!!notice && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: colors.green, marginVertical: 10 }}
            >
              {notice}
            </Text>
          )}
          {(register || recovering) && !confirming && (
            <TextInput
              accessibilityLabel="Confirm password"
              placeholder="Confirm password"
              placeholderTextColor={colors.muted}
              value={confirm}
              onChangeText={setConfirm}
              style={layout.input}
              secureTextEntry={!visible}
              editable={!busy}
              onSubmitEditing={() => void submit()}
            />
          )}
          {!!(error || auth.error) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error || auth.error}
            </Text>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void submit()}
            style={[
              layout.primary,
              { marginTop: 8, backgroundColor: colors.accent },
              busy && { opacity: 0.6 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={layout.primaryText}>
                {confirming
                  ? "Confirm email"
                  : recovering
                    ? "Set new password"
                    : register
                      ? "Create account"
                      : "Sign in"}{" "}
                →
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busy}
            onPress={() => navigation.navigate(register ? "Login" : "Register")}
            style={{ paddingVertical: 24, alignItems: "center" }}
          >
            <Text
              style={{ color: colors.green, fontSize: 13, fontWeight: "600" }}
            >
              {register
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </Text>
          </TouchableOpacity>
          {confirming && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy || resendWait > 0}
              onPress={async () => {
                if (busy || resendWait) return;
                setBusy(true);
                setError("");
                try {
                  await auth.resendConfirmation(email);
                  setResendWait(60);
                  setNotice(
                    "If your account is awaiting confirmation, a new email is on its way.",
                  );
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Unable to resend confirmation.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
              style={{
                padding: 16,
                alignItems: "center",
                opacity: busy || resendWait ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.green }}>
                {resendWait
                  ? `Resend available in ${resendWait}s`
                  : "Resend confirmation email"}
              </Text>
            </TouchableOpacity>
          )}
          {!register && !recovering && !confirming && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setConfirming(true);
                setError("");
                setNotice(
                  "Enter the confirmation code from your signup email. You can resend it below.",
                );
              }}
              style={{ padding: 16, alignItems: "center" }}
            >
              <Text style={{ color: colors.green }}>
                Already signed up? Confirm your email
              </Text>
            </TouchableOpacity>
          )}
          {!register && !confirming && (
            <TouchableOpacity
              disabled={busy}
              onPress={async () => {
                if (busy) return;
                if (!email.trim()) {
                  setError("Enter your email address first.");
                  return;
                }
                setBusy(true);
                setError("");
                try {
                  await auth.requestReset(email);
                  setRecovering(true);
                  setPassword("");
                  setConfirm("");
                  setCode("");
                  setNotice(
                    "If this email has an account, a recovery code is on its way. Enter it above with your new password.",
                  );
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Unable to send recovery email.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
              style={{ padding: 16, alignItems: "center" }}
            >
              <Text style={{ color: colors.green }}>
                Forgot password? Send a recovery code
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate("MainApp")}
            style={{ padding: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.green }}>Continue exploring</Text>
          </TouchableOpacity>
          <Text
            style={{ color: colors.muted, textAlign: "center", fontSize: 12 }}
          >
            An account syncs your saved places across devices.
          </Text>
          <LegalLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  logo: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 15,
    letterSpacing: -0.8,
  },
  error: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 10,
  },
});
