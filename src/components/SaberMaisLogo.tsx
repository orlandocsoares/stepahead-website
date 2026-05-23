"use client";

import { motion } from "framer-motion";

export function SaberMaisLogo({ size = 120 }) {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="flex flex-col items-center gap-3 px-6 pointer-events-none"
    >
      <img
        src="/storage/v1/object/public/Logo%20Sabermais/Sabermais_Logo.png"
        alt="Logotipo Saber Mais"
        style={{ height: size, mixBlendMode: "screen" }}
        className="object-contain"
      />
    </motion.div>
  );
}