"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const HELP_STORAGE_KEY = "sabermais_help_shown";

const steps = [
  {
    title: "O que fazer primeiro",
    label: "Primeiro contacto",
    description:
      "Clique no botão Entrar para abrir o acesso restrito do portal. Este passo prepara o seu login e autenticação.",
  },
  {
    title: "Explore as fases",
    label: "Navegação",
    description:
      "Use as fases do programa na lateral para ver os temas e objetivos de cada etapa do Saber Mais.",
  },
  {
    title: "Aceda aos recursos",
    label: "Conteúdos",
    description:
      "Os materiais e ferramentas ficam disponíveis depois do login. Procure os módulos e os guias práticos na barra do portal.",
  },
  {
    title: "Pode ignorar sem problema",
    label: "Sem interrupção",
    description:
      "Se já souber usar a plataforma, feche este guia. Ele não voltará a aparecer automaticamente.",
  },
];

export function HelpGuide({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(HELP_STORAGE_KEY) === "true";
    if (!hasSeen) {
      setOpen(true);
    }
  }, [setOpen]);

  const closeGuide = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HELP_STORAGE_KEY, "true");
    }
    setOpen(false);
    setStepIndex(0);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      closeGuide();
    } else {
      setOpen(true);
    }
  };

  const step = steps[stepIndex];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(59,130,246,0.18)] backdrop-blur-xl">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-semibold text-white">Guia de início rápido</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-white/70 leading-relaxed max-w-2xl">
                Passos curtos para o primeiro contacto com o portal. Pode fechar e retomar a ajuda a qualquer momento.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={closeGuide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-sky-400/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.35em] text-sky-400/80 font-semibold mb-3">
            Passo {stepIndex + 1} de {steps.length}
          </p>
          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
          <p className="text-[14px] leading-7 text-white/95 tracking-normal">{step.description}</p>
        </div>

        <DialogFooter className="mt-6 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeGuide}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-sky-400/40 hover:text-white"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(HELP_STORAGE_KEY, "true");
                setOpen(false);
              }}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              Não mostrar novamente
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-sky-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(56,189,248,0.35)] transition hover:brightness-105"
            >
              {stepIndex === steps.length - 1 ? "Terminar" : "Próximo"}
              <ArrowRight size={16} />
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
