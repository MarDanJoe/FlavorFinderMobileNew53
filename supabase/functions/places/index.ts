import { authenticated, cors, json } from "../_shared/auth.ts";
import {
  normalizePlace,
  searchRequest,
  photoResource,
  detailMask,
} from "./provider.ts";
type Usage = { route: string; forwarded: boolean; upstream_status?: number };
async function handle(req: Request, usage: Usage) {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const url = new URL(req.url);
  const route = url.pathname.split("/places/")[1];
  const directPhoto =
    route === "photo" && url.searchParams.get("delivery") === "url";
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
    } else {
      endpoint = photoResource(url.searchParams);
      if (directPhoto) endpoint += "&skipHttpRedirect=true";
    }
  } catch (e) {
    return json({ error_message: (e as Error).message }, 400);
  }
  usage.route =
    route === "details/json"
      ? mask?.includes("reviews")
        ? "details_full"
        : "details_basic"
      : route === "nearbysearch/json"
        ? "search"
        : route === "location/json"
          ? "city_lookup"
          : "photo";
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
    usage.forwarded = true;
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
    usage.upstream_status = upstream.status;
    if (!upstream.ok)
      return json({ error_message: "Restaurant provider is unavailable" }, 502);
    if (route === "photo") {
      if (directPhoto) {
        const data = await upstream.json();
        let photo;
        try {
          photo = new URL(data.photoUri);
        } catch {
          return json({ error_message: "Photo unavailable" }, 502);
        }
        if (
          photo.protocol !== "https:" ||
          photo.username ||
          photo.password ||
          !/^(?:[a-z0-9-]+\.)+(?:googleusercontent\.com|ggpht\.com|gstatic\.com)$/.test(
            photo.hostname,
          ) ||
          photo.searchParams.has("key") ||
          photo.href.includes(key)
        )
          return json({ error_message: "Photo unavailable" }, 502);
        return json({ photoUri: photo.href });
      }
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
}
Deno.serve(async (req) => {
  const started = Date.now();
  const usage: Usage = { route: "other", forwarded: false };
  const response = await handle(req, usage);
  if (usage.route !== "other") {
    console.info(
      JSON.stringify({
        event: "places_usage_v1",
        ...usage,
        status: response.status,
        duration_ms: Date.now() - started,
      }),
    );
  }
  return response;
});
