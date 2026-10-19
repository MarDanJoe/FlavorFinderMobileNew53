import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { restaurantSession, supabase } from "./supabase";
export interface VotingRoom {
  code: string;
  deck: string[];
  status: "waiting" | "voting" | "finished" | "cancelled";
  isHost: boolean;
  winner: string | null;
  tied: boolean;
  expiresAt: string;
  members: { name: string; isHost: boolean; voted: number }[];
  myVotes: Record<string, boolean>;
  scores?: Record<string, number>;
}
export async function roomAction(
  action: string,
  code: string,
  extra: Record<string, unknown> = {},
): Promise<VotingRoom> {
  const { token } = await roomSession();
  return executeRoomAction(action, code, extra, token);
}
async function executeRoomAction(
  action: string,
  code: string,
  extra: Record<string, unknown>,
  token: string,
): Promise<VotingRoom> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await supabase!
      .rpc("room_action", {
        action,
        room_code: code.trim().toUpperCase(),
        ...extra,
      })
      .setHeader("Authorization", `Bearer ${token}`)
      .abortSignal(controller.signal);
  } finally {
    clearTimeout(timer);
  }
  const { data, error } = response;
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "Voting rooms are being connected. Please try again shortly."
        : error.message,
    );
  if (data?.error) throw new Error(data.error);
  return data as VotingRoom;
}
export const newRoomCode = () =>
  randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
async function roomSession() {
  const token = await restaurantSession();
  const { data, error } = await supabase!.auth.getSession();
  if (error || !data.session || data.session.access_token !== token)
    throw new Error("Your session changed. Please reconnect to your room.");
  return { token, key: `flavorfinder_room_${data.session.user.id}` };
}
export async function rememberRoom(code: string | null) {
  const { key } = await roomSession();
  if (code) await AsyncStorage.setItem(key, code);
  else await AsyncStorage.removeItem(key);
}
export async function previousRoom() {
  const { key } = await roomSession();
  return AsyncStorage.getItem(key);
}

// Keep the captured identity's room code on network failures so reconnect can retry.
export async function restorePreviousRoom(): Promise<VotingRoom | null> {
  const { key, token } = await roomSession();
  const code = await AsyncStorage.getItem(key);
  if (!code) return null;
  try {
    return await executeRoomAction("get", code, {}, token);
  } catch (error) {
    if (
      error instanceof Error &&
      /expired|not found|Join this room/i.test(error.message)
    ) {
      await AsyncStorage.removeItem(key);
    }
    throw error;
  }
}
