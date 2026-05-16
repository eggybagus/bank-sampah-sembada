import { useAuthContext } from "../context/AuthContext";

/**
 * Primary auth hook for all components.
 * Returns everything from AuthContext plus three boolean shorthands
 * that prevent repeated ternary logic across the app.
 */
export function useAuth() {
  const auth = useAuthContext();

  return {
    ...auth,
    isAuthenticated: auth.user !== null && !auth.needsProfileCompletion,
    isAdmin: auth.role === "admin" && !auth.needsProfileCompletion,
    isMember: auth.role === "member" && !auth.needsProfileCompletion,
  };
}
