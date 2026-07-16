"use client";

import { useEffect, useCallback, useRef } from "react";
import "driver.js/dist/driver.css";

const TOUR_SEEN_PREFIX = "sabermais_home_tour_";

type TourStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  };
};

const TOUR_STEPS: Record<number, TourStep[]> = {
  1: [
    {
      element: "#tour-content",
      popover: {
        title: "Saber Mais",
        description: "Programa de cooperação bilateral entre Portugal e Angola, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola (INFQE).",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#tour-indicadores",
      popover: {
        title: "Indicadores do Programa",
        description: "Estes cartões mostram números reais e actualizados: províncias abrangidas, ciclo do programa, formadores e (quando publicado) o total de formandos.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-areas-formacao",
      popover: {
        title: "Áreas de Formação",
        description: "As disciplinas e áreas pedagógicas cobertas pelo programa, extraídas directamente das acções de formação registadas.",
        side: "top",
        align: "start",
      },
    },
  ],

  2: [
    {
      element: "#tour-provincia-detalhe",
      popover: {
        title: "Bié e Luanda",
        description: "O programa actua nestas duas províncias, cada uma com um Centro de Recursos sediado numa Escola de Magistério, criado para apoiar a comunidade docente.",
        side: "left",
        align: "start",
      },
    },
  ],

  3: [
    {
      element: "#tour-formadores-grid",
      popover: {
        title: "Equipa de Formadores",
        description: "Lista de todos os formadores activos do programa. <strong>Clique num formador</strong> para expandir e ver a sua biografia e especialidade — só um cartão fica aberto de cada vez.",
        side: "top",
        align: "start",
      },
    },
  ],

  4: [
    {
      element: "#tour-recursos-areas",
      popover: {
        title: "Materiais por Área",
        description: "Número de materiais didácticos disponíveis, organizados por área disciplinar.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-recursos-publicos-link",
      popover: {
        title: "Recursos Públicos",
        description: "Clique aqui para aceder ao repositório completo de materiais públicos — sem necessidade de login.",
        side: "top",
        align: "start",
      },
    },
  ],

  5: [
    {
      element: "#tour-eventos-areas",
      popover: {
        title: "Galeria por Pasta",
        description: "Cada cartão é uma pasta — a pasta <strong>Geral</strong> reúne todas as fotografias, e as restantes organizam-nas por área de formação. Clique para ver as fotografias dessa pasta.",
        side: "top",
        align: "start",
      },
    },
  ],

  6: [
    {
      element: "#tour-agenda-toggle",
      popover: {
        title: "Lista ou Calendário",
        description: "Veja os próximos eventos numa <strong>lista cronológica agrupada por mês</strong> ou num <strong>calendário</strong> — clique num dia para ver o que está agendado.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-agenda-calendario",
      popover: {
        title: "Calendário de Eventos",
        description: "Os dias com eventos ficam assinalados. Clique num dia para ver os eventos dessa data e inscrever-se directamente.",
        side: "right",
        align: "start",
      },
    },
  ],
};

interface HomeTourProps {
  start: boolean;
  phaseIndex: number;
  onDone: () => void;
}

export function HomeTour({ start, phaseIndex, onDone }: HomeTourProps) {
  const driverRef = useRef<{ destroy: () => void } | null>(null);

  const runTour = useCallback(async () => {
    driverRef.current?.destroy();
    driverRef.current = null;

    const steps = TOUR_STEPS[phaseIndex];
    if (!steps || steps.length === 0) { onDone(); return; }

    const { driver } = await import("driver.js");

    const validSteps = steps.filter((s) => {
      if (typeof document === "undefined") return true;
      return document.querySelector(s.element) !== null;
    });

    if (validSteps.length === 0) { onDone(); return; }

    const d = driver({
      showProgress: true,
      progressText: "Passo {{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Concluir",
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.72)",
      stagePadding: 10,
      stageRadius: 16,
      popoverClass: "sabermais-tour-popover",
      onDestroyed: () => {
        driverRef.current = null;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`${TOUR_SEEN_PREFIX}${phaseIndex}`, "true");
        }
        onDone();
      },
      steps: validSteps,
    });

    driverRef.current = d;
    d.drive();
  }, [phaseIndex, onDone]);

  useEffect(() => {
    if (!start) return;
    runTour();
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [start, runTour]);

  return null;
}

export function shouldShowHomeTour(phaseIndex: number): boolean {
  if (typeof window === "undefined") return false;
  if (!TOUR_STEPS[phaseIndex]) return false;
  return window.localStorage.getItem(`${TOUR_SEEN_PREFIX}${phaseIndex}`) !== "true";
}
