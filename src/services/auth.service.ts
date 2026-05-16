import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

// ─── Email / Password Auth ───────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  metadata: { full_name?: string; role?: "admin" | "member" }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Look up the user's email by phone number from the profiles table,
 * then sign in with email + password.
 */
export async function signInWithPhone(phone: string, password: string) {
  let normalizedPhone = phone;
  if (phone.startsWith("0")) normalizedPhone = "+62" + phone.slice(1);
  else if (phone.startsWith("628")) normalizedPhone = "+" + phone;

  // Use RPC so the lookup bypasses RLS (profiles is not readable by anon).
  const { data: email, error: lookupError } = await supabase
    .rpc("get_email_by_phone", { p_phone: normalizedPhone });

  if (lookupError) throw lookupError;
  if (!email) throw new Error("Nomor HP tidak terdaftar");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    email,
    type: "signup",
  });
  if (error) throw error;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  payload: Partial<Pick<Profile, "full_name" | "phone_number">>
) {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);
  if (error) throw error;
}

// ─── Dev bypass ──────────────────────────────────────────────────────────────

export async function devLogin(email: string, password: string): Promise<Profile> {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const userId = signInData.user?.id;
  if (!userId) {
    await supabase.auth.signOut();
    throw new Error("User ID tidak ditemukan setelah login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error(profileError?.message ?? "Profil tidak ditemukan");
  }

  return profile as Profile;
}
