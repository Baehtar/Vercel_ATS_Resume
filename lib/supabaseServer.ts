// lib/supabaseServer.ts - Server-side Supabase token verification for API routes.
// Runs only inside route handlers (Node runtime). Uses the public anon key to
// validate a user's JWT against Supabase Auth. The OpenAI/Groq key is never
// touched here and is never sent to the client.
import { createClient, type User } from "@supabase/supabase-js";

/**
 * Validate the `Authorization: Bearer <jwt>` header on an incoming request.
 * Returns the authenticated Supabase user, or null if the token is missing/invalid.
 */
export async function getUserFromAuthHeader(request: Request): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
