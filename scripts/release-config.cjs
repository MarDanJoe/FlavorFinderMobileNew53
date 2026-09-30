const required = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "EXPO_PUBLIC_PRIVACY_URL",
  "EXPO_PUBLIC_TERMS_URL",
  "EXPO_PUBLIC_SUPPORT_URL",
  "IOS_BUNDLE_IDENTIFIER",
  "EAS_PROJECT_ID",
];
function validateRelease(env) {
  const errors = required
    .filter((name) => !env[name])
    .map((name) => `Missing ${name}`);
  for (const name of [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_PLACES_API_URL",
    "EXPO_PUBLIC_PRIVACY_URL",
    "EXPO_PUBLIC_TERMS_URL",
    "EXPO_PUBLIC_SUPPORT_URL",
  ]) {
    if (!env[name]) continue;
    try {
      const u = new URL(env[name]);
      if (
        u.protocol !== "https:" ||
        /localhost|127\.0\.0\.1|example\.(com|org)|YOUR_/i.test(env[name])
      )
        errors.push(`${name} must use a real public HTTPS URL`);
    } catch {
      errors.push(`${name} is not a valid URL`);
    }
  }
  if (env.EXPO_PUBLIC_DEMO_MODE === "true")
    errors.push("Demo mode is forbidden in store builds");
  if (
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    /service_role|sb_secret_/i.test(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  )
    errors.push("A server secret cannot be a publishable key");
  // Older service-role keys are JWTs: examine the role rather than the encoded string.
  const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (key?.split(".").length === 3) {
    try {
      const claims = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      );
      if (claims.role !== "anon")
        errors.push("Only an anon/publishable Supabase key can be bundled");
    } catch {
      errors.push("Invalid Supabase publishable key");
    }
  }
  if (
    env.IOS_BUNDLE_IDENTIFIER &&
    !/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+){2,}$/.test(
      env.IOS_BUNDLE_IDENTIFIER,
    )
  )
    errors.push("Invalid iOS bundle identifier");
  if (
    env.EAS_PROJECT_ID &&
    !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(env.EAS_PROJECT_ID)
  )
    errors.push("EAS_PROJECT_ID must be the real project UUID");
  return errors;
}
module.exports = { validateRelease };
