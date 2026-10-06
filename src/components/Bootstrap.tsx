"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { authStorage } from "@/lib/api";

// Loads real assets from the API on mount; silently keeps mock data if unavailable.
export function Bootstrap() {
  const pathname = usePathname();
  const loadProperties = useAppStore((s) => s.loadProperties);
  useEffect(() => {
    if (pathname.startsWith("/auth") || !authStorage.getToken()) return;
    void loadProperties();
  }, [loadProperties, pathname]);
  return null;
}
