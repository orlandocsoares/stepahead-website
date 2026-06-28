"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_MS = 30 * 60 * 1000;  // 30 minutos
const WARNING_MS   = 28 * 60 * 1000;   // aviso aos 28 minutos

const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

export function useInactivityLogout() {
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // segundos até logout
  const logoutTimer  = useRef<ReturnType<typeof setTimeout>>();
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const countInterval = useRef<ReturnType<typeof setInterval>>();

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countInterval.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearTimers();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/?sessao=expirada";
  }, [clearTimers]);

  const resetTimers = useCallback(() => {
    clearTimers();
    setWarning(false);
    setCountdown(120);

    warningTimer.current = setTimeout(() => {
      setWarning(true);
      setCountdown(120);
      countInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(countInterval.current); doLogout(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }, WARNING_MS);

    logoutTimer.current = setTimeout(doLogout, INACTIVITY_MS);
  }, [clearTimers, doLogout]);

  useEffect(() => {
    resetTimers();
    EVENTS.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      clearTimers();
      EVENTS.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [resetTimers, clearTimers]);

  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  return { warning, countdown, stayLoggedIn };
}
