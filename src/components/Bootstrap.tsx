"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { api, authAPI, authStorage } from "@/lib/api";
import { investorProfileToUser } from "@/lib/investor-user";

// Loads real assets from the API on mount; silently keeps mock data if unavailable.
export function Bootstrap() {
  const pathname = usePathname();
  const loadProperties = useAppStore((s) => s.loadProperties);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthInitialized = useAppStore((s) => s.setAuthInitialized);
  useEffect(() => {
    if (pathname.startsWith("/auth")) {
      setAuthInitialized(true);
      return;
    }

    const token = authStorage.getToken();
    if (!token) {
      setUser(null);
      setAuthInitialized(true);
      return;
    }

    let cancelled = false;
    const cachedUser = authStorage.getUser();
    if (cachedUser) setUser(cachedUser);

    void (async () => {
      const response = await authAPI.investorProfile();
      if (cancelled) return;

      if (!response.success || !response.data) {
        if (!authStorage.getToken()) {
          authStorage.clear();
          api.clearAuthToken();
          setUser(null);
          setAuthInitialized(true);
          window.location.assign("/auth/login");
          return;
        }
        // Keep the cached identity during a transient network/backend outage.
        // It is never replaced with mock data and cannot authorize API requests.
        setAuthInitialized(true);
        return;
      }

      const authenticatedUser = investorProfileToUser(response.data, cachedUser);
      authStorage.setUser(authenticatedUser);
      setUser(authenticatedUser);
      setAuthInitialized(true);
      void loadProperties();
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProperties, pathname, setAuthInitialized, setUser]);
  return null;
}
