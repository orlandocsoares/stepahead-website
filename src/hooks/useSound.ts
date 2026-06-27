"use client";

// Cache de áudio para evitar recriar objectos Audio a cada play
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};

const soundUrls = {
  // Sons minimalistas de interface
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  hover: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  transition: "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
};

type SoundType = keyof typeof soundUrls;

function getAudio(type: SoundType): HTMLAudioElement {
  if (audioCache[type]) {
    return audioCache[type]!;
  }
  const audio = new Audio(soundUrls[type]);
  audio.volume = type === "hover" ? 0.05 : 0.1; // Volume muito baixo para ser elegante
  audioCache[type] = audio;
  return audio;
}

export function useSound() {
  const playSound = (type: SoundType) => {
    const audio = getAudio(type);
    // Garante que o som pode ser tocado novamente mesmo que já esteja a tocar
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignora erros comuns de autoplay do browser, ex: interacção do utilizador necessária
    });
  };

  return { playSound };
}