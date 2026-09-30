import { authenticated, cors, json } from "../_shared/auth.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let identity;
  try {
    identity = await authenticated(req);
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
  if (identity.user.is_anonymous)
    return json({ error: "Registered account required" }, 403);
  // Validate a recent password-authenticated session on the server, not only in the UI.
  const token = req.headers.get("authorization")!.slice(7);
  let claims: { iat?: number; amr?: { method: string; timestamp: number }[] };
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    claims = JSON.parse(
      atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")),
    );
  } catch {
    return json({ error: "Invalid session" }, 401);
  }
  const now = Date.now() / 1000;
  if (
    !claims.amr?.some(
      (entry) =>
        entry.method === "password" &&
        now - entry.timestamp < 300 &&
        entry.timestamp <= now + 30,
    )
  )
    return json({ error: "Sign in again before deleting your account" }, 403);
  try {
    const body = await req.json();
    if (body.confirm !== true)
      return json({ error: "Confirmation required" }, 400);
    const { error } = await identity.admin.auth.admin.deleteUser(
      identity.user.id,
    );
    if (error) return json({ error: "Unable to delete account" }, 500);
    return json({ deleted: true });
  } catch {
    return json({ error: "Unable to delete account" }, 500);
  }
});
