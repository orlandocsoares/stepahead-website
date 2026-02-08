// src/lib/program-config.ts

// 1. Link base para a sequência de imagens
export const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Samer%20mais%20Intro/";

// 2. Link de destino do botão
export const DASHBOARD_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Samer%20mais%20Intro/frame_000_delay-0.041s.webp";

export const PROGRAM_INFO = {
  name: "Portal Saber Mais",
  description: "Plataforma de apoio ao ensino secundário em Angola",
  year: 2026
};

export const PROGRAM_PHASES = [
  { 
    id: "01", 
    index: "01", 
    name: "Introdução", 
    subtitle: "O Início", 
    description: "Explora os conceitos fundamentais e a visão do portal para o ensino secundário em Angola." 
  },
  { 
    id: "02", 
    index: "02", 
    name: "Desenvolvimento", 
    subtitle: "Crescimento", 
    description: "Acompanha a evolução ativa dos conteúdos pedagógicos e ferramentas de aprendizagem." 
  },
  { 
    id: "03", 
    index: "03", 
    name: "Conclusão", 
    subtitle: "Resultados", 
    description: "Análise final do progresso e o impacto positivo na nossa comunidade educativa." 
  }
];