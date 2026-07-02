"use client";

import { useEffect, useCallback } from "react";
import "driver.js/dist/driver.css";

const TOUR_STORAGE_KEY = "sabermais_tour_seen";

const TOUR_STEPS = [
  {
    element: "#tour-bandeiras",
    popover: {
      title: "Cooperação Bilateral",
      description:
        "O Saber Mais é um programa de cooperação entre <strong>Portugal e Angola</strong>, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola (INFQE). As bandeiras identificam esta parceria.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#tour-logo",
    popover: {
      title: "Portal Saber Mais",
      description:
        "Este é o portal central do programa. <strong>Passe o cursor sobre o logótipo</strong> para ver elementos educativos e aceder rapidamente à sua sessão. Clique para voltar ao início do programa.",
      side: "top" as const,
      align: "center" as const,
    },
  },
  {
    element: "#tour-content",
    popover: {
      title: "Conteúdo das Fases",
      description:
        "Aqui aparece a descrição detalhada de cada fase do programa — com estatísticas reais, formadores, agenda de eventos e indicadores de impacto. O conteúdo muda à medida que navega pelas fases.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "#tour-phases-sidebar",
    popover: {
      title: "Fases do Programa",
      description:
        "Navegue pelas <strong>7 fases do Saber Mais</strong>: Login, Capacitação, Par Pedagógico, Luanda &amp; Bié, Recursos e Monitorização. Clique em qualquer fase para ver os seus detalhes.",
      side: "left" as const,
      align: "center" as const,
    },
  },
  {
    element: "#tour-navigator",
    popover: {
      title: "Navegação por Setas",
      description:
        "Use as setas <strong>◀ ▶</strong> para avançar ou recuar entre fases. O anel circular mostra o seu progresso ao longo das 7 fases do programa. Também pode usar a <strong>roda do rato</strong> ou deslizar no telemóvel.",
      side: "left" as const,
      align: "center" as const,
    },
  },
  {
    element: "#tour-entrar-btn",
    popover: {
      title: "Acesso Restrito",
      description:
        "Clique em <strong>Entrar</strong> para aceder à área reservada com as suas credenciais. Se ainda não tem conta, pode registar-se como <em>Formando</em> ou <em>Formador</em> diretamente neste formulário.",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
  {
    element: "#tour-help-btn",
    popover: {
      title: "Ajuda Sempre Disponível",
      description:
        "Pode repetir este guia de orientação a qualquer momento clicando no botão <strong>?</strong>. O guia não interfere com a sua navegação e pode ser fechado a qualquer instante.",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
];

interface TourGuideProps {
  start: boolean;
  onDone: () => void;
}

export function TourGuide({ start, onDone }: TourGuideProps) {
  const runTour = useCallback(async () => {
    const { driver } = await import("driver.js");

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
        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
        }
        onDone();
      },
      steps: TOUR_STEPS.filter((s) => {
        if (typeof document === "undefined") return true;
        return document.querySelector(s.element) !== null;
      }),
    });

    d.drive();
  }, [onDone]);

  useEffect(() => {
    if (!start) return;
    runTour();
  }, [start, runTour]);

  return null;
}

export function shouldShowTour(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TOUR_STORAGE_KEY) !== "true";
}
