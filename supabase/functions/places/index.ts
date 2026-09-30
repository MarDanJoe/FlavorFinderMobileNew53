import { authenticated, cors, json } from "../_shared/auth.ts";
import {
  normalizePlace,
  searchRequest,
  photoResource,
  detailMask,
} from "./provider.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const url = new URL(req.url);
  const route = url.pathname.split("/places/")[1];
  if (route === "health") return json({ ok: true });
  if (
    !["nearbysearch/json", "details/json", "photo", "location/json"].includes(
      route || "",
    )
  )
    return json({ error: "Unknown endpoint" }, 404);
  let identity;
  try {
    identity = await authenticated(req);
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
  let endpoint: string, body: unknown, mask: string | undefined;
  try {
    if (route === "nearbysearch/json")
      ({ endpoint, body, mask } = searchRequest(url.searchParams));
    else if (route === "details/json") {
      const id = url.searchParams.get("place_id") || "";
      if (!/^[A-Za-z0-9_-]{1,256}$/.test(id)) throw new Error("Invalid place");
      endpoint = `places/${id}`;
      mask = detailMask(url.searchParams);
    } else if (route === "location/json") {
      const query = url.searchParams.get("query")?.trim();
      if (!query || query.length > 120)
        throw new Error("Enter a city or ZIP code");
      endpoint = "places:searchText";
      mask = "places.displayName,places.location,places.formattedAddress";
      body = { textQuery: query, pageSize: 1 };
    } else endpoint = photoResource(url.searchParams);
  } catch (e) {
    return json({ error_message: (e as Error).message }, 400);
  }
  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!key)
    return json({ error_message: "Restaurant service is not configured" }, 503);
  const configuredLimit = Number(
    Deno.env.get("GOOGLE_DAILY_REQUEST_LIMIT") || 100,
  );
  const { data: permitted, error: quotaError } = await identity.admin.rpc(
    "take_restaurant_quota",
    {
      subject: identity.user.id,
      daily_limit:
        Number.isInteger(configuredLimit) && configuredLimit > 0
          ? configuredLimit
          : 100,
    },
  );
  if (quotaError)
    return json({ error_message: "Restaurant service is unavailable" }, 503);
  if (!permitted)
    return json(
      {
        error_message: "Daily discovery limit reached. Please try again later.",
      },
      429,
    );
  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/${endpoint}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          "X-Goog-Api-Key": key,
          ...(mask ? { "X-Goog-FieldMask": mask } : {}),
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!upstream.ok)
      return json({ error_message: "Restaurant provider is unavailable" }, 502);
    if (route === "photo") {
      const type = upstream.headers.get("content-type") || "";
      if (!type.startsWith("image/"))
        return json({ error_message: "Photo unavailable" }, 502);
      return new Response(upstream.body, {
        headers: { ...cors, "Content-Type": type, "Cache-Control": "no-store" },
      });
    }
    const data = await upstream.json();
    if (route === "location/json")
      return json({ result: data.places?.[0] || null });
    if (route === "details/json")
      return json({ status: "OK", result: normalizePlace(data) });
    return json({
      status: data.places?.length ? "OK" : "ZERO_RESULTS",
      results: (data.places || []).map(normalizePlace),
      next_page_token: data.nextPageToken,
    });
  } catch {
    return json({ error_message: "Restaurant service timed out" }, 502);
  }
});
