// src/hooks/use-idle.ts
import { useState, useEffect } from "react";

export function useIdle(timeout: number) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleActivity = () => {
      // Se houver movimento, não estamos "idle"
      setIsIdle(false);
      // Reinicia o temporizador
      clearTimeout(timer);
      // Define o novo temporizador para o tempo definido (ex: 5s)
      timer = setTimeout(() => setIsIdle(true), timeout);
    };

    // Ouve o movimento do rato e toques no ecrã
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("scroll", handleActivity);

    // Inicia o temporizador logo no arranque
    timer = setTimeout(() => setIsIdle(true), timeout);

    // Limpeza quando o componente desmonta
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [timeout]);

  return isIdle;
}