import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LibraryProvider } from "./src/contexts/LibraryContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <LibraryProvider>
          <AppNavigator />
        </LibraryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
