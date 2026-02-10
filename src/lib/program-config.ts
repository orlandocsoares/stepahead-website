// src/lib/program-config.ts

// 1. Link da pasta que SABEMOS que funciona (SaberMais)
// Se usares a "Samer", certifica-te que os ficheiros lá existem. 
// Por segurança, mantive a SaberMais para garantir o efeito.
export const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/SaberMais/";

// 2. IMPORTANTE: Número exato de frames para o motor calcular o tempo
export const TOTAL_FRAMES = 100; 

// 3. Link de destino
export const DASHBOARD_URL = "https://sabermais.ao/dashboard";

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