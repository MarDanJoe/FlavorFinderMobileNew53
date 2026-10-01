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
  await restaurantSession();
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
async function storageKey() {
  await restaurantSession();
  const { data } = await supabase!.auth.getSession();
  return `flavorfinder_room_${data.session!.user.id}`;
}
export async function rememberRoom(code: string | null) {
  const key = await storageKey();
  if (code) await AsyncStorage.setItem(key, code);
  else await AsyncStorage.removeItem(key);
}
export async function previousRoom() {
  return AsyncStorage.getItem(await storageKey());
}

// Keep the captured identity's room code on network failures so reconnect can retry.
export async function restorePreviousRoom(): Promise<VotingRoom | null> {
  const key = await storageKey();
  const code = await AsyncStorage.getItem(key);
  if (!code) return null;
  try {
    return await roomAction("get", code);
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
