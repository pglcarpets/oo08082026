"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA/offline support.
 * Mount once near the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const getRegistrations = navigator.serviceWorker.getRegistrations;
      if (typeof getRegistrations === "function") {
        void getRegistrations
          .call(navigator.serviceWorker)
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .catch((error: unknown) => {
            console.warn("[sw] development cleanup failed:", error);
          });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.warn("[sw] registration failed:", error);
        });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
