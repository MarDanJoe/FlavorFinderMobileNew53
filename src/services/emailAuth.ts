import type { SupabaseClient } from "@supabase/supabase-js";
function emailAddress(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
    throw new Error("Enter your email address first.");
  return normalized;
}
export async function confirmEmailCode(
  client: SupabaseClient,
  email: string,
  code: string,
) {
  const address = emailAddress(email);
  const token = code.trim();
  if (!/^\d{6,10}$/.test(token))
    throw new Error("Enter the numeric confirmation code from your email.");
  const { data, error } = await client.auth.verifyOtp({
    email: address,
    token,
    type: "email",
  });
  if (error) throw new Error(error.message);
  if (!data.session)
    throw new Error("Confirmation did not complete. Please try again.");
}
export async function resendConfirmation(
  client: SupabaseClient,
  email: string,
) {
  const { error } = await client.auth.resend({
    type: "signup",
    email: emailAddress(email),
  });
  if (error) throw new Error(error.message);
}
