import { useEffect, useState } from "react";
import { formatHeaders } from "@/lib/api";

interface AuthState {
  loading: boolean;
  authEnabled: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  role: string | null;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  "tools:use",
  "files:own",
  "files:all",
  "apikeys:own",
  "apikeys:all",
  "pipelines:own",
  "pipelines:all",
  "settings:read",
  "settings:write",
  "users:manage",
  "teams:manage",
  "branding:manage",
];

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authEnabled: false,
    isAuthenticated: false,
    mustChangePassword: false,
    role: null,
    permissions: [],
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if auth is enabled
        const configRes = await fetch("/api/v1/config/auth");
        const config = await configRes.json();

        if (!config.authEnabled) {
          setState({
            loading: false,
            authEnabled: false,
            isAuthenticated: true,
            mustChangePassword: false,
            role: "admin",
            permissions: ALL_PERMISSIONS,
          });
          return;
        }

        // Auth is enabled — check if we have a valid session
        const token = localStorage.getItem("ashim-token");
        if (!token) {
          setState({
            loading: false,
            authEnabled: true,
            isAuthenticated: false,
            mustChangePassword: false,
            role: null,
            permissions: [],
          });
          return;
        }

        const sessionRes = await fetch("/api/auth/session", {
          headers: formatHeaders(),
        });

        if (sessionRes.ok) {
          const session = await sessionRes.json();
          const mustChange = session.user?.mustChangePassword === true;
          setState({
            loading: false,
            authEnabled: true,
            isAuthenticated: true,
            mustChangePassword: mustChange,
            role: session.user?.role ?? null,
            permissions: session.user?.permissions ?? [],
          });
        } else {
          localStorage.removeItem("ashim-token");
          setState({
            loading: false,
            authEnabled: true,
            isAuthenticated: false,
            mustChangePassword: false,
            role: null,
            permissions: [],
          });
        }
      } catch {
        // Can't reach API — assume no auth needed (dev mode)
        setState({
          loading: false,
          authEnabled: false,
          isAuthenticated: true,
          mustChangePassword: false,
          role: "admin",
          permissions: ALL_PERMISSIONS,
        });
      }
    }

    checkAuth();
  }, []);

  const hasPermission = (permission: string) => state.permissions.includes(permission);

  return { ...state, hasPermission };
}
