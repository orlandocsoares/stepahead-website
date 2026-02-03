export const PROGRAM_INFO = {
  name: "Programa Saber Mais",
  description: "Plataforma institucional de cooperação na área da Educação, tutelada pelo Camões, I.P. e pelo MED Angola – INFQE, com foco na formação contínua de professores e futuros docentes.",
  stats: "+20.000 Professores Formados",
};

export interface ProgramPhase {
  id: string;
  index: string;
  name: string;
  subtitle: string;
  description: string;
  sequenceUrl: string;
  frameCount: number;
}

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    id: "fase-1",
    index: "01",
    name: "Formação Inicial",
    subtitle: "Capacitação Docente",
    description: "Introdução ao programa, formação pedagógica de base, metodologias de ensino e integração dos formandos no ecossistema educativo do Programa Saber Mais.",
    sequenceUrl: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/sign/SaberMais/frame_000_delay-0.04s.webp",
    frameCount: 192,
  },
  {
    id: "fase-2",
    index: "02",
    name: "Formação Contínua",
    subtitle: "Desenvolvimento Profissional",
    description: "Aprofundamento de competências pedagógicas, actualização científica, inovação educativa e práticas avançadas de ensino.",
    sequenceUrl: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/sign/SaberMais/frame_000_delay-0.04s.webp",
    frameCount: 192,
  },
  {
    id: "fase-3",
    index: "03",
    name: "Avaliação e Portfólio",
    subtitle: "Evidência Pedagógica",
    description: "Submissão e gestão de portfólios dos formandos, avaliação de práticas pedagógicas, partilha de recursos e certificação.",
    sequenceUrl: "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/sign/SaberMais/frame_000_delay-0.04s.webp",
    frameCount: 192,
  }
];
