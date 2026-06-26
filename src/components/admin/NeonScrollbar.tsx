"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function NeonScrollbar({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [key, setKey] = useState(0);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [active, setActive] = useState(false);
  const lastY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const cur = el.scrollTop;
      const newDir = cur >= lastY.current ? "down" : "up";
      lastY.current = cur;

      setDirection(newDir);
      setActive(true);
      setKey(k => k + 1); // reinicia a animação a cada scroll

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setActive(false), 900);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [scrollRef]);

  return (
    /* Posicionado em absolute para não ocupar espaço no layout */
    <div className="absolute right-0 top-0 bottom-0 w-[3px] hidden md:block pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key={key}
            initial={direction === "down" ? { top: "-15%" } : { top: "115%" }}
            animate={direction === "down" ? { top: "115%" } : { top: "-15%" }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className={`absolute left-0 w-full h-[12%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] ${
              direction === "down"
                ? "bg-gradient-to-b from-transparent via-blue-500/80 to-white/80"
                : "bg-gradient-to-t from-transparent via-blue-500/80 to-white/80"
            }`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
