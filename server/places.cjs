// Development Places proxy. Keep the Google credential on the server.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const configFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(configFile)) {
  for (const line of fs.readFileSync(configFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
    if (match && !process.env[match[1]])
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:8081,http://127.0.0.1:8081,http://localhost:8083"
).split(",");
const limits = new Map();
const send = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(value));
};
const routes = new Set(["nearbysearch/json", "details/json", "photo"]);
const allowedFields = new Set(
  "name,formatted_phone_number,formatted_address,opening_hours,photos,reviews,price_level,rating,website,geometry,types,user_ratings_total".split(
    ",",
  ),
);
function validate(input) {
  const route = input.pathname.replace(/^\/places\//, "");
  if (!routes.has(route)) throw new Error("Unknown restaurant endpoint");
  const out = new URL(`https://maps.googleapis.com/maps/api/place/${route}`);
  const q = input.searchParams;
  if (route === "nearbysearch/json") {
    const parts = (q.get("location") || "").split(",");
    if (parts.some((part) => !part.trim())) throw new Error("Invalid location");
    const coords = parts.map(Number);
    if (
      coords.length !== 2 ||
      !coords.every(Number.isFinite) ||
      Math.abs(coords[0]) > 90 ||
      Math.abs(coords[1]) > 180
    )
      throw new Error("Invalid location");
    const radius = Number(q.get("radius"));
    if (!Number.isFinite(radius) || radius < 1 || radius > 50000)
      throw new Error("Invalid search distance");
    out.searchParams.set("location", coords.join(","));
    out.searchParams.set("radius", String(radius));
    out.searchParams.set("type", "restaurant");
    if (q.get("keyword"))
      out.searchParams.set("keyword", q.get("keyword").slice(0, 100));
    if (q.get("opennow") === "true") out.searchParams.set("opennow", "true");
    if (q.get("pagetoken"))
      out.searchParams.set("pagetoken", q.get("pagetoken").slice(0, 1024));
  } else if (route === "details/json") {
    const id = q.get("place_id");
    if (!id || id.length > 256) throw new Error("Invalid place");
    out.searchParams.set("place_id", id);
    const fields = (q.get("fields") || "name,rating,geometry").split(",");
    if (fields.some((field) => !allowedFields.has(field)))
      throw new Error("Unsupported details field");
    out.searchParams.set("fields", fields.join(","));
  } else {
    const photo = q.get("photoreference");
    if (!photo || photo.length > 2048) throw new Error("Invalid photo");
    out.searchParams.set("photoreference", photo);
    const width = Number(q.get("maxwidth") || 800);
    if (!Number.isFinite(width) || width < 1 || width > 1600)
      throw new Error("Invalid photo size");
    out.searchParams.set("maxwidth", String(Math.round(width)));
  }
  return out;
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");
  if (origin && !allowedOrigins.includes(origin))
    return send(res, 403, { error_message: "Origin is not allowed" });
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== "GET")
    return send(res, 405, { error_message: "Only GET is supported" });
  const key = req.socket.remoteAddress;
  const now = Date.now();
  const limit = limits.get(key);
  if (!limit || now - limit.start > 60000)
    limits.set(key, { start: now, count: 1 });
  else if (++limit.count > 90)
    return send(res, 429, {
      error_message: "Too many requests. Please wait a moment.",
    });
  let target;
  try {
    target = validate(new URL(req.url, "http://localhost"));
  } catch (err) {
    return send(res, 400, { error_message: err.message });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY)
    return send(res, 503, {
      error_message: "Restaurant service is not configured.",
    });
  target.searchParams.set("key", process.env.GOOGLE_PLACES_API_KEY);
  try {
    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(12000),
    });
    if (target.pathname.endsWith("/photo")) {
      if (!upstream.ok)
        return send(res, 502, {
          error_message: "Restaurant photo is unavailable",
        });
      const type = upstream.headers.get("content-type") || "";
      if (!type.startsWith("image/"))
        return send(res, 502, {
          error_message: "Restaurant photo is unavailable",
        });
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "private, max-age=300",
      });
      return res.end(Buffer.from(await upstream.arrayBuffer()));
    }
    const data = await upstream.json();
    // Avoid exposing upstream key-bearing messages or URLs to clients.
    if (!["OK", "ZERO_RESULTS", "INVALID_REQUEST"].includes(data.status))
      return send(res, 502, {
        status: data.status,
        error_message: "Restaurant provider could not complete the request.",
      });
    send(res, upstream.ok ? 200 : 502, data);
  } catch {
    send(res, 502, {
      error_message: "Restaurant service timed out. Please try again.",
    });
  }
});
if (require.main === module)
  server.listen(Number(process.env.PLACES_PORT) || 8082, "127.0.0.1", () =>
    console.log("Places development proxy: http://localhost:8082/places"),
  );
module.exports = { validate, server };
