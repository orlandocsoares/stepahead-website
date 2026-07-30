"use client";

import { useEffect } from "react";

const INTERVAL_MS = 60 * 1000;

export function useHeartbeat() {
  useEffect(() => {
    const send = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
      }
    };
    send();
    const interval = setInterval(send, INTERVAL_MS);
    document.addEventListener("visibilitychange", send);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", send);
    };
  }, []);
}
