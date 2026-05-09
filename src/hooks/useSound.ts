"use client";

export function useSound() {
  const playSound = (type: "click" | "hover" | "transition") => {
    const sounds = {
      // Sons minimalistas de interface (podes trocar pelas tuas URLs do Supabase mais tarde)
      click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      hover: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
      transition: "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
    };

    const audio = new Audio(sounds[type]);
    audio.volume = type === "hover" ? 0.05 : 0.1; // Volume muito baixo para ser elegante
    audio.play().catch(() => {}); // Ignora erros de autoplay do browser
  };

  return { playSound };
}