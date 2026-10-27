import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Animated,
  AppState,
  PanResponder,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors, layout } from "../theme";
import {
  roomAction,
  newRoomCode,
  restorePreviousRoom,
  rememberRoom,
  VotingRoom,
} from "../services/rooms";
import { supabase } from "../services/supabase";
import { getRestaurantById } from "../services/api";
import { Restaurant } from "../hooks/useRestaurants";
import { RestaurantImage } from "../components/RestaurantImage";
import { GoogleAttribution } from "../components/GoogleAttribution";
import { roomInviteMessage } from "../services/invites";
import { DEMO_MODE } from "../config/demo";

export default function RoomsScreen({
  navigation,
  route,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route?: {
    params?: {
      nickname?: string;
      code?: string;
      deck?: string[];
      cards?: Restaurant[];
      searchSummary?: string;
    };
  };
}) {
  const focused = useIsFocused();
  const [room, setRoom] = useState<VotingRoom | null>(null);
  const [name, setName] = useState(route?.params?.nickname ?? "");
  const [code, setCode] = useState(route?.params?.code ?? "");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("");
  const [card, setCard] = useState<Restaurant | null>(null);
  const [cardError, setCardError] = useState("");
  const [retry, setRetry] = useState(0);
  const [restoreRetry, setRestoreRetry] = useState(0);
  const [confirmation, setConfirmation] = useState<"leave" | "finish" | null>(
    null,
  );
  const requestBusy = useRef(false);
  const revision = useRef(0);
  const roomRef = useRef(room);
  roomRef.current = room;
  const mounted = useRef(true);
  const sessionIdentity = useRef<string | null>(null);
  const position = useRef(new Animated.Value(0)).current;
  const canSwipe = useRef(false);
  const voteRef = useRef<(liked: boolean) => void>(() => {});
  const nextId =
    room?.status === "finished"
      ? room.winner
      : room?.deck.find((id) => !(id in room.myVotes));
  // Reuse only the discovery cards already loaded for this active room flow.
  // The shared room and invites still contain place IDs only.
  const cache = useRef(
    new Map<string, Restaurant>(
      (route?.params?.cards ?? []).map((restaurant) => [
        restaurant.id,
        restaurant,
      ]),
    ),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!supabase || DEMO_MODE) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const identity = session?.user.id ?? null;
      if (sessionIdentity.current && sessionIdentity.current !== identity) {
        revision.current++;
        setRoom(null);
        cache.current.clear();
        setConnection("");
        setError(
          "Your session changed. Join a room again with your current account.",
        );
      }
      sessionIdentity.current = identity;
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (route?.params?.code) setCode(route.params.code);
  }, [route?.params?.code]);
  // Restore membership rather than auto-joining a link with an invented name.
  useEffect(() => {
    if (!focused || DEMO_MODE || route?.params?.code || route?.params?.deck)
      return;
    let active = true;
    const restoreRevision = revision.current;
    void restorePreviousRoom()
      .then((restored) => {
        if (active && restoreRevision === revision.current && restored) {
          setRoom(restored);
          setConnection("");
        }
      })
      .catch((error) => {
        if (active && restoreRevision === revision.current)
          setConnection(
            error instanceof Error
              ? error.message
              : "Unable to restore your room. Try again when connected.",
          );
      });
    return () => {
      active = false;
    };
  }, [route?.params?.code, route?.params?.deck, focused, restoreRetry]);
  useEffect(() => {
    let active = true;
    setCard(null);
    setCardError("");
    position.setValue(0);
    if (!nextId) return;
    const cached = cache.current.get(nextId);
    if (cached) {
      setCard(cached);
      return;
    }
    void getRestaurantById(nextId, true)
      .then((value) => {
        if (active) {
          cache.current.set(nextId, value);
          setCard(value);
        }
      })
      .catch((e) => {
        if (active) setCardError(e.message);
      });
    return () => {
      active = false;
    };
  }, [nextId, retry, position]);
  useEffect(() => {
    if (!room || !focused || room.status === "cancelled") return;
    let active = true,
      fetching = false;
    const poll = async () => {
      if (
        !active ||
        fetching ||
        requestBusy.current ||
        AppState.currentState !== "active"
      )
        return;
      fetching = true;
      const started = revision.current;
      try {
        const fresh = await roomAction("get", room.code);
        if (active && started === revision.current && !requestBusy.current) {
          setRoom(fresh);
          setConnection("");
        }
      } catch (e) {
        if (active && started === revision.current && !requestBusy.current)
          setConnection(
            e instanceof Error && /expired|Join this room/.test(e.message)
              ? e.message
              : "Connection interrupted. Your saved votes are safe; reconnecting…",
          );
      } finally {
        fetching = false;
      }
    };
    const timer = setInterval(() => void poll(), 4000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void poll();
    });
    return () => {
      active = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [room?.code, room?.status, focused]);
  const perform = useCallback(
    async (
      action: string,
      extra: Record<string, unknown> = {},
      target?: string,
    ) => {
      if (requestBusy.current) return;
      requestBusy.current = true;
      const actionRevision = ++revision.current;
      setBusy(true);
      setError("");
      try {
        const fresh = await roomAction(
          action,
          target ?? roomRef.current!.code,
          {
            ...extra,
            ...(roomRef.current?.round
              ? { expected_round: roomRef.current.round }
              : {}),
          },
        );
        if (!mounted.current || actionRevision !== revision.current) return;
        if (action === "leave") {
          setRoom(null);
          setCode("");
          cache.current.clear();
          void rememberRoom(null).catch(() => {});
        } else {
          setRoom(fresh);
          setConnection("");
          void rememberRoom(fresh.code).catch(() => {});
        }
      } catch (e) {
        if (mounted.current && actionRevision === revision.current)
          setError(
            e instanceof Error
              ? e.message
              : "Unable to update the room. Try again.",
          );
      } finally {
        requestBusy.current = false;
        if (mounted.current) setBusy(false);
        position.setValue(0);
      }
    },
    [position],
  );
  voteRef.current = (liked) => {
    if (
      !room ||
      room.status !== "voting" ||
      !nextId ||
      !card ||
      card.id !== nextId ||
      requestBusy.current
    )
      return;
    void perform("vote", { place: nextId, liked });
  };
  canSwipe.current =
    room?.status === "voting" && !!nextId && card?.id === nextId && !busy;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        canSwipe.current &&
        Math.abs(g.dx) > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        canSwipe.current &&
        Math.abs(g.dx) > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => setDragging(true),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (!requestBusy.current) position.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        setDragging(false);
        if (Math.abs(g.dx) > 80 && Math.abs(g.dx) > Math.abs(g.dy))
          voteRef.current(g.dx > 0);
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;
  const button = (
    label: string,
    onPress: () => void,
    secondary = false,
    disabled = false,
  ) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: busy || disabled, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={[
        secondary ? styles.secondary : layout.primary,
        { marginTop: 12 },
        (busy || disabled) && { opacity: 0.5 },
      ]}
    >
      <Text style={secondary ? styles.secondaryText : layout.primaryText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  const leave = () => setConfirmation("leave");
  const finish = () => setConfirmation("finish");
  return (
    <SafeAreaView style={layout.screen} edges={["top", "left", "right"]}>
      <ScrollView
        scrollEnabled={!dragging}
        directionalLockEnabled
        contentContainerStyle={[
          layout.content,
          { paddingTop: 24, paddingBottom: 32 },
        ]}
      >
        {!room && !!route?.params?.deck && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cancel room setup and go back"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={() => navigation.goBack()}
            style={{
              minHeight: 48,
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.green }}>
              Back · Cancel room setup
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.eyebrow}>FLAVOR FINDER · EAT TOGETHER</Text>
        <Text style={[layout.title, { marginTop: 10 }]}>
          {room?.status === "finished"
            ? "Dinner, decided."
            : "Less debating.\nMore eating."}
        </Text>
        <Text style={[layout.subtitle, { marginTop: 10, marginBottom: 20 }]}>
          Same restaurants. Private swipes. One group pick. The host can also
          start a runoff between tied restaurants.
        </Text>
        {!room ? (
          <>
            {route?.params?.deck && route.params.nickname ? (
              <Text style={styles.heading}>Hosting as {name}</Text>
            ) : (
              <>
                <Text accessibilityRole="header" style={styles.heading}>
                  What should your friends call you?
                </Text>
                <TextInput
                  style={layout.input}
                  accessibilityLabel="Your name in the room"
                  placeholder="Your first name or nickname"
                  value={name}
                  maxLength={24}
                  onChangeText={setName}
                  editable={!busy}
                />
              </>
            )}
            {route?.params?.deck ? (
              <>
                <Text style={layout.subtitle}>
                  {route.params.deck.length} restaurants in your confirmed group
                  deck. Rooms hold up to 10 friends and expire after 24 hours.
                </Text>
                {!!route.params.searchSummary && (
                  <Text style={layout.subtitle}>
                    {route.params.searchSummary}
                  </Text>
                )}
                {button(
                  "Change area or filters",
                  () =>
                    navigation.replace("RoomSetup", { nickname: name.trim() }),
                  true,
                )}
                {button(
                  "Create room",
                  () =>
                    void perform(
                      "create",
                      { nickname: name.trim(), ids: route.params!.deck },
                      newRoomCode(),
                    ),
                  false,
                  !name.trim() || DEMO_MODE,
                )}
              </>
            ) : (
              <>
                {button(
                  "Choose restaurants & create a room",
                  () =>
                    navigation.navigate("RoomSetup", { nickname: name.trim() }),
                  false,
                  DEMO_MODE,
                )}
                <Text style={[styles.heading, { marginTop: 28 }]}>
                  Already invited?
                </Text>
                <TextInput
                  style={layout.input}
                  accessibilityLabel="6-digit room code or existing invite code"
                  placeholder="6-digit room code"
                  value={code}
                  maxLength={12}
                  onChangeText={(v) =>
                    setCode(v.toUpperCase().replace(/[^A-F0-9]/g, ""))
                  }
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!busy}
                />
                {button(
                  "Join room",
                  () => void perform("join", { nickname: name.trim() }, code),
                  false,
                  !name.trim() ||
                    !/^(?:[0-9]{6}|[A-F0-9]{12})$/.test(code) ||
                    DEMO_MODE,
                )}
              </>
            )}
            {DEMO_MODE && (
              <Text style={[layout.subtitle, { marginTop: 16 }]}>
                Voting rooms use the live app. Turn off preview mode to connect
                with friends.
              </Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.eyebrow}>ROOM CODE</Text>
              <Text selectable style={styles.code}>
                {room.code}
              </Text>
              <Text style={layout.subtitle}>
                {room.members.length}/10 friends · {room.deck.length}{" "}
                restaurants ·{" "}
                {room.isHost ? "You are hosting" : "You are invited"}
              </Text>
              {room.status === "waiting" &&
                button(
                  "Invite friends",
                  () => {
                    void Share.share({
                      message: roomInviteMessage(room.code),
                    }).catch((e) => setError(e.message));
                  },
                  true,
                )}
            </View>
            {room.status === "waiting" && (
              <>
                <Text style={[styles.heading, { marginTop: 20 }]}>
                  Gather your dinner crew
                </Text>
                <Text style={layout.subtitle}>
                  Everyone gets this exact deck in the same order. Join before
                  voting starts. Most likes wins; a tie gets one random group
                  pick.
                </Text>
                {room.members.map((m, i) => (
                  <Text key={i} style={styles.member}>
                    {m.name}
                    {m.isHost ? " · Host" : ""}
                  </Text>
                ))}
                {room.isHost ? (
                  button(
                    "Everyone’s here · Start voting",
                    () => void perform("start"),
                    false,
                    room.members.length < 2,
                  )
                ) : (
                  <Text style={styles.notice}>
                    Waiting for your host to start…
                  </Text>
                )}
              </>
            )}
            {(room.status === "voting" || room.status === "finished") && (
              <>
                <Text style={[styles.heading, { marginTop: 20 }]}>
                  {room.status === "finished"
                    ? room.winner
                      ? "Your group’s pick"
                      : "No restaurant got a like"
                    : `${(room.round ?? 1) > 1 ? `Runoff ${room.round! - 1} · ` : ""}Your votes · ${Object.keys(room.myVotes).length}/${room.deck.length}`}
                </Text>
                {room.status === "finished" && (
                  <Text style={layout.subtitle}>
                    {room.winner
                      ? room.tied
                        ? "The top restaurants tied. Flavor Finder randomly picked this winner for everyone."
                        : "This restaurant earned the most likes from your group."
                      : "Try a different cuisine or wider search, then create a fresh room."}
                  </Text>
                )}
                {nextId && (
                  <View style={styles.cardFrame}>
                    {card?.id === nextId ? (
                      <Animated.View
                        key={nextId}
                        {...(room.status === "voting" ? pan.panHandlers : {})}
                        style={[
                          styles.card,
                          { transform: [{ translateX: position }] },
                        ]}
                      >
                        <RestaurantImage
                          uri={card.image_url}
                          style={{ height: 190 }}
                        />
                        <ScrollView
                          style={{ flex: 1 }}
                          contentContainerStyle={{ padding: 18 }}
                          nestedScrollEnabled
                          scrollEnabled={!dragging}
                        >
                          <Text style={styles.heading}>{card.name}</Text>
                          <Text style={layout.subtitle}>
                            ★ {card.rating.toFixed(1)}{" "}
                            {card.price ? ` · ${card.price}` : ""}
                          </Text>
                          <Text style={[layout.subtitle, { marginTop: 8 }]}>
                            {card.location.address1}
                          </Text>
                          {room.status === "finished" && (
                            <Text style={styles.notice}>
                              {room.scores?.[card.id] ?? 0} likes
                            </Text>
                          )}
                          {button(
                            "Restaurant details & directions",
                            () =>
                              navigation.navigate("RestaurantDetail", {
                                id: card.id,
                              }),
                            true,
                          )}
                        </ScrollView>
                        <View
                          style={{ paddingHorizontal: 18, paddingBottom: 12 }}
                        >
                          <GoogleAttribution
                            authors={card.photo_attributions}
                            providers={card.provider_attributions}
                            photoSource={card.photo_source_uri}
                          />
                        </View>
                      </Animated.View>
                    ) : (
                      <View style={[styles.card, styles.cardPlaceholder]}>
                        {cardError ? (
                          <>
                            <Text style={layout.subtitle}>{cardError}</Text>
                            {button(
                              "Retry restaurant",
                              () => setRetry((v) => v + 1),
                              true,
                            )}
                          </>
                        ) : (
                          <>
                            <ActivityIndicator color={colors.accent} />
                            <Text style={styles.notice}>
                              Loading restaurant…
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
                {room.status === "voting" && nextId && (
                  <View style={[layout.row, { gap: 12, marginTop: 16 }]}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Pass on this restaurant"
                      disabled={busy || !card || card.id !== nextId}
                      onPress={() => voteRef.current(false)}
                      style={[styles.vote, { backgroundColor: colors.paper }]}
                    >
                      <Text style={styles.secondaryText}>← Pass</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Like this restaurant"
                      disabled={busy || !card || card.id !== nextId}
                      onPress={() => voteRef.current(true)}
                      style={[styles.vote, { backgroundColor: colors.accent }]}
                    >
                      <Text style={layout.primaryText}>Like →</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {room.status === "voting" && !nextId && (
                  <Text style={styles.notice}>
                    Your votes are in! Waiting for your friends. The result
                    appears when everyone finishes.
                  </Text>
                )}
                {room.status === "voting" && (
                  <>
                    <Text style={[styles.heading, { marginTop: 22 }]}>
                      Group progress
                    </Text>
                    {room.members.map((m, i) => (
                      <Text key={i} style={styles.member}>
                        {m.name}
                        {m.isHost ? " · Host" : ""} · {m.voted}/
                        {room.deck.length}
                      </Text>
                    ))}
                    {room.isHost &&
                      button("Finish early & pick a restaurant", finish, true)}
                  </>
                )}
                {room.status === "finished" && room.tied && !!room.round && (
                  <>
                    <Text style={styles.notice}>
                      Keep the random winner above, or vote again on only the
                      tied restaurants.
                    </Text>
                    {room.isHost ? (
                      button(
                        "Vote again on tied restaurants",
                        () => void perform("runoff"),
                        true,
                      )
                    ) : (
                      <Text style={styles.notice}>
                        Your host can start a tie-breaking round. Stay here to
                        join it.
                      </Text>
                    )}
                  </>
                )}
                {room.status === "finished" &&
                  button("Find a fresh deck", () =>
                    navigation.navigate("RoomSetup"),
                  )}
              </>
            )}
            {room.status === "cancelled" && (
              <Text style={styles.notice}>
                The host closed this room. Create or join another room to keep
                exploring.
              </Text>
            )}
            {button(
              room.status === "finished" || room.status === "cancelled"
                ? "Back to rooms"
                : "Leave room",
              room.status === "finished" || room.status === "cancelled"
                ? () => void perform("leave")
                : leave,
              true,
            )}
          </>
        )}
        {busy && (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.accent} />
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        {!!connection &&
          !room &&
          !/expired|not found|Join this room/i.test(connection) &&
          button(
            "Retry saved room",
            () => setRestoreRetry((value) => value + 1),
            true,
          )}
        {/expired|not found|Join this room/i.test(connection) &&
          button(
            "Return to rooms",
            () => {
              setRoom(null);
              setConnection("");
              void rememberRoom(null).catch(() => {});
            },
            true,
          )}
        {!!connection && (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {connection}
          </Text>
        )}
      </ScrollView>
      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmation(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#20382E88",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              styles.panel,
              { width: "100%", maxWidth: 472, alignSelf: "center" },
            ]}
          >
            <Text style={styles.heading}>
              {confirmation === "finish"
                ? "Pick a restaurant now?"
                : room?.isHost
                  ? "Leave and close this room?"
                  : "Leave this room?"}
            </Text>
            <Text style={layout.subtitle}>
              {confirmation === "finish"
                ? "Only votes already submitted by people still in the room will count."
                : room?.isHost
                  ? "Your friends will see that this room has closed."
                  : "Your votes will not count in an unfinished room."}
            </Text>
            {button(
              confirmation === "finish" ? "Pick now" : "Leave room",
              () => {
                const action = confirmation!;
                setConfirmation(null);
                void perform(action);
              },
            )}
            {button(
              confirmation === "finish" ? "Keep voting" : "Stay",
              () => setConfirmation(null),
              true,
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.green,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 12,
  },
  panel: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.paper,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.ink,
    marginVertical: 10,
  },
  member: {
    paddingVertical: 12,
    color: colors.ink,
    borderBottomWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  notice: { color: colors.green, fontSize: 14, lineHeight: 21, marginTop: 18 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    minHeight: 52,
    backgroundColor: colors.paper,
  },
  secondaryText: { fontSize: 14, fontWeight: "700", color: colors.ink },
  card: {
    height: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFrame: { height: 500, marginTop: 18 },
  cardPlaceholder: { justifyContent: "center", padding: 20 },
  vote: {
    flex: 1,
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { color: colors.accent, fontSize: 14, lineHeight: 21, marginTop: 18 },
});
