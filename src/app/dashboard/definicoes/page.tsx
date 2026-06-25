"use client";

import { useAdminUser } from "@/hooks/useAdminUser";
import { Settings, Mail, MapPin, BookOpen, Award, MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DefinicoesPage() {
  const { user: profile, loading } = useAdminUser();
  const router = useRouter();

  const areasIntervencao = [
    "Língua Portuguesa", "Matemática", "Pré-Escolar",
    "Educação Inclusiva", "Expressão Plástica", "Expressão Físico-Motora",
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  );

  const roleLabel =
    profile?.role === "admin" ? "Agente Educativo Autorizado"
    : profile?.role === "formador" ? "Formador Credenciado"
    : "Formando Activo";

  const initial = (profile?.first_name?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6 w-full">

      {/* Cabeçalho */}
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              : <span className="text-2xl font-bold text-white/20">{initial}</span>
            }
          </div>
          <div className="text-center sm:text-left">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              {roleLabel}
            </span>
            <h2 className="text-2xl font-semibold text-white mt-2">
              {profile?.first_name || "Utilizador"} <span className="text-white/40">{profile?.last_name || ""}</span>
            </h2>
            <p className="text-[10px] text-white/20 tracking-widest uppercase mt-1">
              Programa Saber Mais Angola · III Ciclo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Configurações de identidade */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings size={15} className="text-blue-400" /> Configurações de identidade
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 flex items-center gap-1.5">
                  <Mail size={11} className="text-blue-400/50" /> E-mail de acesso
                </label>
                <div className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-white/30 font-mono cursor-not-allowed">
                  {profile?.email || "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 flex items-center gap-1.5">
                  <MapPin size={11} className="text-blue-400/50" /> Província de atuação
                </label>
                <div className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-white/50">
                  {profile?.province || "Não definida"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-white/40 flex items-center gap-1.5">
                <BookOpen size={11} className="text-blue-400/50" /> Áreas de intervenção pedagógica
              </label>
              <div className="flex flex-wrap gap-2">
                {areasIntervencao.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] bg-white/[0.02] text-white/40"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-white/20 pt-1">
              Para editar os teus dados vai a{" "}
              <button
                onClick={() => router.push("/dashboard/perfil")}
                className="text-blue-400 hover:underline"
              >
                Perfil
              </button>
              .
            </p>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">

          {/* Progresso */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award size={15} className="text-amber-400" /> Estado da capacitação
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-end text-xs">
                <span className="text-white/40">Progresso global</span>
                <span className="text-blue-400 font-semibold text-base">75%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] transition-all duration-1000"
                  style={{ width: "75%" }}
                />
              </div>
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed italic">
              "Capacitar e valorizar os recursos humanos do sistema educativo angolano."
            </p>
          </div>

          {/* Canal de apoio */}
          <div className="bg-[#13131f] border border-blue-500/20 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
              <MessageSquare size={15} /> Canal de apoio
            </h3>
            <p className="text-xs text-white/40">Necessita de assistência técnica ou pedagógica?</p>
            <button
              onClick={() => router.push("/dashboard/suporte")}
              className="w-full py-2.5 rounded-lg border border-white/[0.06] text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Contactar Suporte
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
