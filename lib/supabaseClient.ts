// lib/supabaseClient.ts - Supabase auth + database wrapper (ported from portal_db_client.py)
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Resume } from "./types";

let _client: SupabaseClient | null = null;
let _initialized = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (_initialized) return _client;
  _initialized = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    _client = null;
    return null;
  }
  try {
    _client = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  } catch (e) {
    console.error("Error initializing Supabase client:", e);
    _client = null;
  }
  return _client;
}

export function isConfigured(): boolean {
  return getSupabaseClient() !== null;
}

function getAuthRedirectUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL;
  if (fromEnv) return fromEnv.trim();
  if (typeof window !== "undefined") return window.location.origin;
  return "https://consoleflare.streamlit.app";
}

interface AuthResult {
  user?: unknown;
  session?: unknown;
  error: string | null;
  email_verified?: boolean;
  confirmation_required?: boolean;
}

export async function signUpStudent(
  email: string,
  password: string,
  name: string,
  batch: string,
  course: string
): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: "Supabase client is not configured." };

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: { name, batch, course },
      },
    });
    if (error) throw error;

    const user = data.user;
    const session = data.session;
    const emailVerified = Boolean(
      user && (user.email_confirmed_at || (user as { confirmed_at?: string }).confirmed_at)
    );
    return {
      user,
      session,
      email_verified: emailVerified,
      confirmation_required: !session && !emailVerified,
      error: null,
    };
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("already registered")) {
      msg = "This email is already registered. Please sign in.";
    } else if (msg.toLowerCase().includes("password should be")) {
      msg = "Password is too weak. Must be at least 6 characters.";
    }
    return { error: msg };
  }
}

export async function signInStudent(email: string, password: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { session: null, error: "Supabase client is not configured." };

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { session: data.session, user: data.user, error: null };
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
      msg = "Invalid email or password. Please try again.";
    } else if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
      msg =
        "Please verify your email before signing in. Check your inbox for the confirmation link.";
    }
    return { session: null, user: null, error: msg };
  }
}

export async function resetPasswordStudent(email: string): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client is not configured." };

  email = (email || "").trim();
  if (!email) return { ok: false, error: "Please enter your email to reset password." };

  try {
    const redirectTo = `${getAuthRedirectUrl()}?reset=1`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return { ok: true, error: null };
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("rate limit")) {
      msg = "Too many password reset attempts. Please wait a few minutes and try again.";
    } else if (lower.includes("invalid email")) {
      msg = "Please enter a valid email address.";
    }
    return { ok: false, error: msg };
  }
}

/**
 * Update password after a Supabase recovery link.
 * supabase-js (detectSessionInUrl) automatically establishes the recovery
 * session from the URL, so we only need to call updateUser, then immediately
 * sign out so the user is forced to log in fresh with the new password.
 */
export async function updatePasswordAfterRecovery(
  newPassword: string
): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client is not configured." };

  newPassword = (newPassword || "").trim();
  if (newPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  try {
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    // Sign out the recovery session so the user must log in with the new password.
    await client.auth.signOut();
    return { ok: true, error: null };
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("expired") || lower.includes("invalid")) {
      msg = "This password reset link is invalid or expired. Please request a new reset email.";
    }
    return { ok: false, error: msg };
  }
}

export async function signOutStudent(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch {
    /* ignore */
  }
}

/** Return the current session's access token (JWT), or null if not signed in. */
export async function getAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function saveResume(
  userId: string,
  resumeData: Resume
): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client is not configured." };
  if (!userId) {
    return {
      ok: false,
      error: "No authenticated user ID was found. Please sign out and sign in again.",
    };
  }
  try {
    const { error } = await client
      .from("resumes")
      .upsert({ id: userId, resume_data: resumeData });
    if (error) throw error;
    return { ok: true, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Error saving resume:", msg);
    return { ok: false, error: msg };
  }
}

export async function loadResume(userId: string): Promise<Resume | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("resumes")
      .select("resume_data")
      .eq("id", userId);
    if (error) throw error;
    if (data && data.length) {
      return (data[0] as { resume_data: Resume }).resume_data;
    }
    return null;
  } catch (e) {
    console.error("Error loading resume:", e);
    return null;
  }
}

export async function getUserRole(userId: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) return "student";
  try {
    const { data, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", userId);
    if (error) throw error;
    if (data && data.length) {
      return (data[0] as { role?: string }).role || "student";
    }
    return "student";
  } catch {
    return "student";
  }
}

export interface ProfileRow {
  id: string;
  name?: string;
  batch?: string;
  course?: string;
  role?: string;
}

export async function fetchAllStudents(): Promise<{ students: ProfileRow[]; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { students: [], error: "Supabase client is not configured." };
  try {
    const { data, error } = await client.from("profiles").select("*");
    if (error) throw error;
    const students = (data || []).filter((p: ProfileRow) => p.role === "student");
    return { students, error: null };
  } catch (e) {
    return { students: [], error: e instanceof Error ? e.message : String(e) };
  }
}
