"use client";

import React, { useEffect, useRef } from "react";
import { useToast } from "@/context/ToastContext";

interface VersionManifest {
  version: string;
  buildTime: number;
}

export function useVersionCheck(intervalMs = 30000) { // default 30 seconds interval
  const { showToast } = useToast();
  const initialBuildTimeRef = useRef<number | null>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const checkVersion = async (isFirstCheck = false) => {
      try {
        const response = await fetch("/version.json", {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) return;

        const data: VersionManifest = await response.json();
        if (!data || !data.buildTime) return;

        if (isFirstCheck) {
          initialBuildTimeRef.current = data.buildTime;
          return;
        }

        // If the deployment build timestamp has updated, trigger update notification
        if (
          initialBuildTimeRef.current !== null &&
          data.buildTime !== initialBuildTimeRef.current &&
          !toastShownRef.current
        ) {
          toastShownRef.current = true;

          showToast(
            <div className="flex flex-col gap-2 text-left" id="update-toast-content">
              <span className="font-semibold text-zinc-100">
                New Platform Update Available!
              </span>
              <p className="text-xs text-zinc-400">
                A fresh version of the JMC platform has been deployed. Please refresh to load the updates.
              </p>
              <button
                id="update-toast-refresh-btn"
                onClick={() => {
                  window.location.reload();
                }}
                className="mt-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold rounded-lg self-start transition-all cursor-pointer shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                Refresh to Update
              </button>
            </div>,
            "info",
            Infinity // Keep persistent until manual interaction
          );
        }
      } catch (error) {
        console.debug("Failed to fetch version manifest:", error);
      }
    };

    // Immediate initial fetch to record current runtime version
    checkVersion(true).then(() => {
      if (!isMounted) return;
      // Start polling interval
      timerId = setInterval(() => checkVersion(false), intervalMs);
    });

    return () => {
      isMounted = false;
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [showToast, intervalMs]);
}
