import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabaseBrowser.js";
import {

  buildPermissionTemplate,
  normalizePermissions,
} from "../constants/views.js";
import { ALL_VIEW_IDS } from "../constants/views.js";

const AuthContext = createContext(null);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeRole, setActiveRole] = useState(null);
  const [allowedViews, setAllowedViews] = useState(ALL_VIEW_IDS);
  const [rolePermissions, setRolePermissions] = useState(() =>
    buildPermissionTemplate({
      view: true,
      add: true,
      edit: true,
      delete: true,
    })
  );

  const syncFromSession = useCallback((nextSession) => {
    setSession(nextSession);
    if (nextSession?.user) {
      const { user } = nextSession;
      setAdmin({
        email: user.email,
        name: user.user_metadata?.name ?? user.email,
        id: user.id,
      });
      setAuthError("");
    } else {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        syncFromSession(data.session);
      })
      .finally(() => {
        if (isMounted) {
          setAuthInitializing(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      syncFromSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncFromSession]);

  useEffect(() => {
    let isMounted = true;
    async function loadRole() {
      const roleId = session?.user?.user_metadata?.role_ids?.[0];
      if (!roleId) {
        if (isMounted) {
          setActiveRole(null);
          setAllowedViews(ALL_VIEW_IDS);
          setRolePermissions(
            buildPermissionTemplate({
              view: true,
              add: true,
              edit: true,
              delete: true,
            })
          );
        }
        return;
      }
      const { data, error } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("id", roleId)
        .maybeSingle();
      if (!isMounted) return;
      if (error || !data) {
        setActiveRole(null);
        setAllowedViews(ALL_VIEW_IDS);
        setRolePermissions(
          buildPermissionTemplate({
            view: true,
            add: true,
            edit: true,
            delete: true,
          })
        );
        return;
      }
      const normalizedPermissions = normalizePermissions(data.permissions);
      setActiveRole(data);
      setRolePermissions(normalizedPermissions);
      const allowed = Object.entries(normalizedPermissions)
        .filter(([, perms]) => perms.view)
        .map(([viewId]) => viewId);
      setAllowedViews(allowed.length ? allowed : ALL_VIEW_IDS);
    }
    loadRole();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.user_metadata?.role_ids]);

  const login = useCallback(async (email, password) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      syncFromSession(data.session);
      return data.session?.user ?? null;
    } catch (err) {
      const message =
        err?.message ?? "Unable to sign in. Please check your credentials.";
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, [syncFromSession]);

  const logout = useCallback(async () => {
    setAuthError("");
    await supabase.auth.signOut();
    syncFromSession(null);
  }, [syncFromSession]);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const hasPermission = useCallback(
    (viewId, action = "view") => {
      if (!viewId) return false;
      const perms = rolePermissions?.[viewId];
      if (!perms) return false;
      return Boolean(perms[action]);
    },
    [rolePermissions]
  );

  const value = useMemo(
    () => ({
      apiBaseUrl: API_BASE_URL,
      session,
      token: session?.access_token ?? null,
      admin,
      activeRole,
      allowedViews,
      rolePermissions,
      isAuthenticated: Boolean(session?.access_token),
      authInitializing,
      authLoading,
      authError,
      login,
      logout,
      getAccessToken,
      hasPermission,
      supabase,
    }),
    [
      API_BASE_URL,
      session,
      admin,
      activeRole,
      allowedViews,
      rolePermissions,
      authInitializing,
      authLoading,
      authError,
      login,
      logout,
      getAccessToken,
      hasPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
}
