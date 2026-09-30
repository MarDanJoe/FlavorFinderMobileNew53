import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEMO_MODE } from "../config/demo";
import { supabase } from "../services/supabase";
import { confirmEmailCode, resendConfirmation } from "../services/emailAuth";
interface User {
  id: string;
  email: string;
  username: string;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    username: string,
    password: string,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (username: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    password: string,
  ) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const toUser = (u: any): User | null =>
  !u || u.is_anonymous
    ? null
    : {
        id: u.id,
        email: u.email ?? "",
        username:
          typeof u.user_metadata?.username === "string"
            ? u.user_metadata.username.slice(0, 40)
            : "Food explorer",
      };
function client() {
  if (!supabase)
    throw new Error(
      "Accounts are not connected yet. You can continue exploring as a guest.",
    );
  return supabase;
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (DEMO_MODE) {
      AsyncStorage.getItem("flavorfinder:demo-profile")
        .then((name) => {
          if (active)
            setUser({
              id: "demo",
              email: "demo@example.com",
              username: name || "Food explorer",
            });
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
    // Retire obsolete local credentials; never upload or reuse local passwords as cloud credentials.
    void AsyncStorage.multiRemove(["users", "user_data", "user_token"]).catch(
      () => {},
    );
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setUser(toUser(session?.user));
          setError(null);
        }
      },
    );
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && error)
          setError("Your session could not be restored. Please sign in again.");
      })
      .catch(() => {
        if (active)
          setError("Your session could not be restored. Please sign in again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  const signIn = async (email: string, password: string) => {
    const { error } = await client().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message);
  };
  const signUp = async (email: string, username: string, password: string) => {
    if (username.trim().length < 3 || username.trim().length > 40)
      throw new Error("Use a name between 3 and 40 characters.");
    if (password.length < 8 || password.length > 128)
      throw new Error("Use a password between 8 and 128 characters.");
    const { data, error } = await client().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: username.trim() } },
    });
    if (error) throw new Error(error.message);
    return !!data.session;
  };
  const signOut = async () => {
    const { error } = await client().auth.signOut();
    if (error) throw error;
    setUser(null);
  };
  const updateProfile = async (username: string) => {
    username = username.trim();
    if (!user || username.length < 3 || username.length > 40)
      throw new Error("Use a name between 3 and 40 characters.");
    if (DEMO_MODE)
      await AsyncStorage.setItem("flavorfinder:demo-profile", username);
    else {
      const { error } = await client().auth.updateUser({ data: { username } });
      if (error) throw error;
    }
    setUser({ ...user, username });
  };
  const requestReset = async (email: string) => {
    const { error } = await client().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );
    if (error) throw error;
  };
  const resetPassword = async (
    email: string,
    code: string,
    password: string,
  ) => {
    if (password.length < 8 || password.length > 128)
      throw new Error("Use a password between 8 and 128 characters.");
    const c = client();
    const { error } = await c.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "recovery",
    });
    if (error) throw error;
    const result = await c.auth.updateUser({ password });
    if (result.error) throw result.error;
    await c.auth.signOut();
  };
  const deleteAccount = async (password: string) => {
    if (!user || DEMO_MODE)
      throw new Error("This account cannot be deleted here.");
    // Reauthentication is required before destructive deletion.
    await signIn(user.email, password);
    const { data, error } = await client().functions.invoke("delete-account", {
      body: { confirm: true },
    });
    if (error || !data?.deleted)
      throw new Error("Account deletion failed. Please try again.");
    await AsyncStorage.removeItem(`flavorfinder:library:${user.id}`).catch(
      () => {},
    );
    await client()
      .auth.signOut({ scope: "local" })
      .catch(() => {});
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        error,
        signIn,
        signUp,
        signOut,
        updateProfile,
        confirmEmail: (email, code) => confirmEmailCode(client(), email, code),
        resendConfirmation: (email) => resendConfirmation(client(), email),
        requestReset,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
};
