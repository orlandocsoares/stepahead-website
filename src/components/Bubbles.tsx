"use client";

import React, { useEffect, useState } from 'react';

// Define bubble properties
interface Bubble {
  id: number;
  style: React.CSSProperties;
}

const BUBBLE_COUNT = 25; // Number of bubbles
// CORES ATUALIZADAS: Ligeiramente mais opacas para melhor visibilidade
const COLORS = [
  'rgba(255, 255, 255, 0.1)',
  'rgba(113, 201, 206, 0.12)',
  'rgba(255, 182, 193, 0.12)',
  'rgba(216, 191, 216, 0.12)',
];

export function Bubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // This code only runs on the client.
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const size = Math.random() * 80 + 20; // 20px to 100px
        const left = Math.random() * 100; // 0% to 100vw
        const animationDuration = Math.random() * 20 + 15; // 15s to 35s
        const animationDelay = Math.random() * 15; // 0s to 15s
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        newBubbles.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
            backgroundColor: color,
          },
        });
      }
      setBubbles(newBubbles);
    };

    generateBubbles();
  }, []);

  return (
    <div className="bubbles-container" aria-hidden="true">
      {bubbles.map((bubble) => (
        <div key={bubble.id} className="bubble" style={bubble.style} />
      ))}
    </div>
  );
}
