import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: "admin" | "member" | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep the auth state callback synchronous to avoid missing events.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      // If signed out, clear profile immediately and stop loading.
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the profiles row whenever the authenticated user changes.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data as Profile | null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT → setUser(null) → setProfile(null)
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data as Profile | null);
  }, [user]);

  // Derived states.
  const role = profile?.role ?? null;

  // Profile completion check: if user is authenticated but has no full_name
  // or phone_number, they need to complete their profile first.
  // This happens after email signup before the user fills in their details.
  const needsProfileCompletion =
    user !== null &&
    profile !== null &&
    (profile.full_name === "" || profile.full_name === "Anggota" || profile.phone_number === "");

  return (
    <AuthContext.Provider
      value={{ user, profile, role, loading, needsProfileCompletion, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Internal hook (consumed by useAuth) ─────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
