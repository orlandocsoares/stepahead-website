"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

const TOUR_SEEN_PREFIX = "sabermais_dash_tour_";

type TourStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  };
};

const TOUR_STEPS: Record<string, TourStep[]> = {
  "/dashboard": [
    {
      element: "#tour-dash-welcome",
      popover: {
        title: "Bem-vindo ao Backoffice",
        description: "Esta é a sua área pessoal do Portal Saber Mais. Aqui tem uma visão geral do estado da plataforma em tempo real.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-kpi-cards",
      popover: {
        title: "Indicadores Principais",
        description: "Estes 4 cartões mostram os totais de <strong>Utilizadores</strong>, <strong>Ficheiros</strong>, <strong>Eventos</strong> e <strong>Publicações</strong>. Clique em qualquer um para ir directamente à secção correspondente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rankings",
      popover: {
        title: "Rankings e Actividade",
        description: "Aqui vê quem mais contribui para o repositório, quais as áreas mais activas e os utilizadores mais presentes na plataforma.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-dash-stats",
      popover: {
        title: "Eventos, Suporte e Armazenamento",
        description: "Próximos eventos agendados, pedidos de suporte (visível a administradores) e uso do armazenamento do sistema.",
        side: "top",
        align: "start",
      },
    },
  ],

  "/dashboard/turmas": [
    {
      element: "#tour-turmas-header",
      popover: {
        title: "Gestão de Turmas",
        description: "Aqui gere todas as turmas do programa. O contador mostra o total de turmas criadas. Clique em <strong>Nova Turma</strong> para criar uma nova.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-pendentes",
      popover: {
        title: "Formandos a Aguardar Aprovação",
        description: "Formandos que se registaram mas ainda não foram aprovados aparecem aqui. Pode <strong>Aprovar</strong> ou <strong>Rejeitar</strong> cada um individualmente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-sem-turma",
      popover: {
        title: "Formandos Sem Turma",
        description: "Lista de formandos aprovados que ainda não pertencem a nenhuma turma. Seleccione uma turma no menu pendente e clique <strong>Adicionar</strong> para os integrar.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-turmas-list",
      popover: {
        title: "Lista de Turmas",
        description: "Cada cartão representa uma turma. Clique na seta para <strong>expandir</strong> e ver os membros, adicionar formandos ou gerir a turma.",
        side: "top",
        align: "start",
      },
    },
  ],

  "/dashboard/repositorio": [
    {
      element: "#tour-repo-header",
      popover: {
        title: "Repositório Digital",
        description: "Arquivo central de materiais pedagógicos. Use a <strong>barra de pesquisa</strong> para encontrar qualquer documento por título ou área.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-category-tabs",
      popover: {
        title: "Categorias",
        description: "Filtre os materiais por área disciplinar: Matemática, Língua Portuguesa, Física, Química, Pedagogia, etc. Clique numa categoria para ver apenas os seus documentos.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-share-filters",
      popover: {
        title: "Filtros de Partilha",
        description: "<strong>Todos os Recursos</strong> mostra tudo o que está disponível. <strong>Os Meus Recursos</strong> mostra só o que carregou. <strong>Partilhados Comigo</strong> mostra documentos que outros utilizadores lhe enviaram directamente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-materials-grid",
      popover: {
        title: "Materiais Disponíveis",
        description: "Cada cartão é um documento. Pode <strong>descarregar</strong>, ver detalhes do autor e, se for o proprietário, <strong>eliminar</strong> ou <strong>publicar</strong> rascunhos.",
        side: "top",
        align: "start",
      },
    },
  ],

  "/dashboard/agenda": [
    {
      element: "#tour-agenda-header",
      popover: {
        title: "Agenda de Actividades",
        description: "Calendário de todos os eventos do programa: formações, sessões presenciais e online. As cores indicam a urgência — <strong>verde</strong> é hoje, <strong>vermelho</strong> é urgente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-agenda-filters",
      popover: {
        title: "Pesquisa e Filtros",
        description: "Pesquise por título ou filtre por <strong>formato</strong> (Presencial/Online) e <strong>âmbito</strong> (Global/Restrito). Formadores e administradores podem criar novos eventos com o botão <strong>Novo evento</strong>.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-events-grid",
      popover: {
        title: "Cartões de Evento",
        description: "Cada evento mostra a data, local, formato e o número de inscrições. Clique em <strong>Inscrever</strong> para participar. Administradores podem ver a lista completa de inscritos.",
        side: "top",
        align: "start",
      },
    },
  ],

  "/dashboard/mensagens": [
    {
      element: "#tour-conversations-sidebar",
      popover: {
        title: "Conversas",
        description: "Lista de todas as suas conversas privadas. As conversas com mensagens não lidas têm um <strong>indicador vermelho</strong>. Use a pesquisa para encontrar uma conversa específica.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#tour-compose-btn",
      popover: {
        title: "Enviar Mensagem em Massa",
        description: "Clique em <strong>Enviar</strong> para enviar uma mensagem a um grupo: todos os formandos, todos os formadores, ou utilizadores específicos por nome.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-chat-area",
      popover: {
        title: "Área de Conversa",
        description: "Seleccione uma conversa na lista para ver as mensagens aqui. Pode <strong>responder</strong> a uma mensagem específica passando o cursor sobre ela, ou usar emojis com o botão 😊.",
        side: "left",
        align: "start",
      },
    },
  ],

  "/dashboard/perfil": [
    {
      element: "#tour-profile-header",
      popover: {
        title: "O Seu Perfil",
        description: "Aqui vê o seu nome, email, função e estado de conta. Clique na <strong>fotografia</strong> para a alterar directamente — a nova imagem é actualizada em todo o portal.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-security-section",
      popover: {
        title: "Segurança",
        description: "Altere a sua password aqui. Por segurança, a password não é mostrada — introduza a nova e confirme para guardar.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#tour-identity-section",
      popover: {
        title: "Dados de Identidade",
        description: "Actualize o seu <strong>nome</strong>, <strong>província</strong>, <strong>áreas de especialidade</strong> e <strong>síntese biográfica</strong>. Estes dados são visíveis a outros utilizadores do programa.",
        side: "left",
        align: "start",
      },
    },
  ],
};

interface DashboardTourProps {
  start: boolean;
  onDone: () => void;
}

export function DashboardTour({ start, onDone }: DashboardTourProps) {
  const pathname = usePathname();

  const runTour = useCallback(async () => {
    const steps = TOUR_STEPS[pathname];
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
      overlayColor: "rgba(0,0,0,0.65)",
      stagePadding: 10,
      stageRadius: 14,
      popoverClass: "sabermais-tour-popover",
      onDestroyed: () => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`${TOUR_SEEN_PREFIX}${pathname}`, "true");
        }
        onDone();
      },
      steps: validSteps,
    });

    d.drive();
  }, [pathname, onDone]);

  useEffect(() => {
    if (!start) return;
    runTour();
  }, [start, runTour]);

  return null;
}

export function shouldShowDashboardTour(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (!TOUR_STEPS[pathname]) return false;
  return window.localStorage.getItem(`${TOUR_SEEN_PREFIX}${pathname}`) !== "true";
}
