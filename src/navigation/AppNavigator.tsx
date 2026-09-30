import React from "react";
import LegalScreen from "../screens/LegalScreen";
import RoomsScreen from "../screens/RoomsScreen";
import {
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../contexts/AuthContext";
import { HomeScreen } from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { ActivityIndicator, View } from "react-native";
import { RestaurantDetailScreen } from "../screens/RestaurantDetailScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme";
import Ionicons from "@expo/vector-icons/Ionicons";

// Define the types for our navigation
export type RootStackParamList = {
  Legal: { document: "privacy" | "terms" | "support" };
  Room: { code?: string; deck?: string[] } | undefined;
  Login: undefined;
  Register: undefined;
  MainApp: NavigatorScreenParams<TabParamList> | undefined;
  RestaurantDetail: { id: string };
  Favorites: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Groups: undefined;
  Home: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "Groups") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Favorites") {
            iconName = focused ? "heart" : "heart-outline";
          } else {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 76,
          paddingBottom: 16,
          paddingTop: 9,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 4 },
        tabBarInactiveTintColor: colors.muted,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, title: "Discover" }}
      />
      <Tab.Screen
        name="Groups"
        component={RoomsScreen}
        options={{ headerShown: false, title: "Eat together" }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: false, title: "Saved" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading && !isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#FF6B6B" />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={{
        prefixes: ["flavorfinder://"],
        config: { screens: { Room: "room/:code", Legal: "legal/:document" } },
      }}
    >
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="Room" component={RoomsScreen} />
        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
