"use client";

import { useMemo, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  BookOpen, GraduationCap, UserPlus, FolderOpen, ClipboardList, Calendar,
  MessageSquare, Mail, LifeBuoy, UserCircle, Users, Shield, AlertTriangle,
  Info, ChevronRight, Search, Image as ImageIcon, FileText, Star,
  LayoutDashboard, Bell, Folder,
} from "lucide-react";

type Role = "formando" | "formador" | "admin" | "todos";

const ROLE_LABEL: Record<Role, string> = {
  formando: "Formando", formador: "Formador", admin: "Administrador", todos: "Todos",
};
const ROLE_CLASS: Record<Role, string> = {
  formando: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  formador: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  admin:    "text-purple-400 bg-purple-500/10 border-purple-500/20",
  todos:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

function RoleTag({ role }: { role: Role }) {
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ROLE_CLASS[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function Callout({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 my-3 ${warn ? "bg-amber-500/10 border-amber-500/20" : "c-s1 border c-br"}`}>
      {warn ? <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" /> : <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />}
      <div className={`text-xs leading-relaxed ${warn ? "text-amber-400" : "c-tx3"}`}>{children}</div>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2 my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="shrink-0 w-5 h-5 rounded-full c-s1 border c-br text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-xs c-tx3 leading-relaxed pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Esquema ilustrativo (maqueta, não é uma captura de ecrã real) */
function Schema({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-xl border c-br overflow-hidden">
      <div className="c-s2 p-4">{children}</div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-t c-br bg-black/10">
        <ImageIcon size={10} className="c-tx5 shrink-0" />
        <span className="text-[9px] c-tx5 uppercase tracking-wider">Esquema ilustrativo — {label}</span>
      </div>
    </div>
  );
}

function SchemaAcoesFormacao() {
  return (
    <Schema label="painel de uma acção de formação">
      <div className="c-bg2 border c-br rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2.5 border-b c-br">
          <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
            <GraduationCap size={13} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-2 w-40 rounded c-s1" />
            <div className="h-1.5 w-24 rounded c-s1 mt-1.5 opacity-60" />
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full border border-blue-500/20 text-blue-400 bg-blue-500/10 shrink-0">Agendada</span>
        </div>
        <div className="flex items-center gap-1 p-2">
          <span className="text-[10px] px-2.5 py-1 rounded bg-blue-600 text-white font-medium">Materiais</span>
          <span className="text-[10px] px-2.5 py-1 rounded c-tx4">Utilizadores</span>
          <span className="text-[10px] px-2.5 py-1 rounded c-tx4">Fotos</span>
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          <div className="flex items-center gap-2 c-s1 border c-br rounded px-2 py-1.5">
            <FileText size={11} className="text-blue-400 shrink-0" />
            <div className="h-1.5 w-32 rounded c-s2" />
          </div>
          <div className="flex items-center gap-2 c-s1 border c-br rounded px-2 py-1.5">
            <FileText size={11} className="text-blue-400 shrink-0" />
            <div className="h-1.5 w-24 rounded c-s2" />
          </div>
        </div>
      </div>
    </Schema>
  );
}

function SchemaFormandosPorValidar() {
  return (
    <Schema label="fila de aprovação">
      <div className="space-y-1.5">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/15 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-2 w-28 rounded c-s1" />
              <div className="h-1.5 w-36 rounded c-s1 mt-1 opacity-50" />
            </div>
            <span className="text-[9px] px-2 py-1 rounded bg-emerald-600 text-white shrink-0">Aprovar</span>
            <span className="text-[9px] px-2 py-1 rounded border c-br c-tx4 shrink-0">Recusar</span>
          </div>
        ))}
      </div>
    </Schema>
  );
}

function SchemaRepositorio() {
  return (
    <Schema label="grelha do repositório">
      <div className="grid grid-cols-3 gap-2">
        {[FileText, ImageIcon, FileText].map((Icon, i) => (
          <div key={i} className="c-bg2 border c-br rounded-lg p-2.5 space-y-1.5">
            <div className="w-full aspect-[4/3] rounded c-s1 flex items-center justify-center">
              <Icon size={16} className="text-blue-400" />
            </div>
            <div className="h-1.5 w-full rounded c-s1 opacity-70" />
          </div>
        ))}
      </div>
    </Schema>
  );
}

function SchemaTarefas() {
  const cols = [
    { label: "A fazer", color: "bg-amber-500" },
    { label: "Entregue", color: "bg-emerald-500" },
    { label: "Avaliado", color: "bg-blue-500" },
  ];
  return (
    <Schema label="quadro de tarefas do formando">
      <div className="grid grid-cols-3 gap-2">
        {cols.map(c => (
          <div key={c.label} className="c-bg2 border c-br rounded-lg overflow-hidden">
            <div className={`h-1 ${c.color}`} />
            <div className="px-2 py-1.5 border-b c-br">
              <span className="text-[9px] font-bold uppercase tracking-wider c-tx4">{c.label}</span>
            </div>
            <div className="p-1.5">
              <div className="c-s1 border c-br rounded p-1.5 space-y-1">
                <div className="h-1.5 w-full rounded c-s2" />
                <div className="h-1.5 w-2/3 rounded c-s2 opacity-60" />
                {c.label === "Avaliado" && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] text-blue-400 mt-0.5">
                    <Star size={8} /> 18 val.
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Schema>
  );
}

type Section = {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  keywords: string;
  roles: Role[];
};

// Cada secção só é visível para quem está nos "roles" listados (ou "todos").
// Um formando nunca vê secções marcadas só para formador/admin — evita a
// duplicação/confusão de conteúdo que não lhe diz respeito.
const SECTIONS: Section[] = [
  { id: "registo",               icon: UserPlus,      label: "Registo e primeiro acesso", roles: ["todos"], keywords: "registo conta criar email confirmar reenviar aprovar formando formador password bilhete identidade escola provincia foto qr spam" },
  { id: "dashboard",             icon: LayoutDashboard, label: "Dashboard",                 roles: ["todos"], keywords: "dashboard inicio painel modo neutro claro escuro fundo tema perfil" },
  { id: "pesquisa-global",       icon: Search,         label: "Pesquisa Global",             roles: ["todos"], keywords: "pesquisa global procurar ctrl k atalho acções documentos tarefas utilizadores" },
  { id: "minhas-formacoes",      icon: BookOpen,       label: "As Minhas Formações",          roles: ["formando", "formador"], keywords: "minhas formações acção inscrito lecciona tarefas materiais atalho" },
  { id: "acoes-formacao",        icon: GraduationCap,  label: "Acções de Formação",         roles: ["formador", "admin"], keywords: "acções formação curso designação materiais utilizadores fotos galeria inscrição vagas horario local data" },
  { id: "formandos-por-validar", icon: UserPlus,       label: "Formandos por Validar",       roles: ["formador", "admin"], keywords: "formandos validar aprovar recusar fila caixa entrada pendente activar conta" },
  { id: "repositorio",           icon: FolderOpen,     label: "Repositório",                 roles: ["todos"], keywords: "repositório ficheiros upload disciplina visibilidade capa pdf miniatura download pastas pasta anexar clonar multiplo varios" },
  { id: "tarefas",               icon: ClipboardList,  label: "Tarefas",                      roles: ["todos"], keywords: "tarefas entregar avaliar nota observações feedback prazo anexo kanban acção formação filtro etiqueta pasta disciplina" },
  { id: "agenda",                icon: Calendar,       label: "Agenda",                       roles: ["todos"], keywords: "agenda eventos evento inscrição presencial online arquivo calendario cancelar confirmação inscrito" },
  { id: "comunidade",            icon: MessageSquare,  label: "Comunidade",                   roles: ["todos"], keywords: "comunidade publicação post comentário gosto fixar categoria mural" },
  { id: "mensagens",             icon: Mail,           label: "Mensagens",                    roles: ["todos"], keywords: "mensagens privadas conversa contactar formador" },
  { id: "notificacoes",          icon: Bell,           label: "Notificações",                 roles: ["todos"], keywords: "notificações centro sino aviso tarefa documento mensagem anúncio lidas" },
  { id: "suporte",               icon: LifeBuoy,       label: "Suporte",                      roles: ["todos"], keywords: "suporte ticket pendente resolvido categoria ajuda problema" },
  { id: "perfil",                icon: UserCircle,     label: "Perfil",                       roles: ["todos"], keywords: "perfil dados pessoais identificação residência habilitações profissional password avatar foto" },
  { id: "utilizadores",          icon: Users,          label: "Utilizadores",                 roles: ["formador", "admin"], keywords: "utilizadores admin cargo estado password csv estatísticas anúncios configurações" },
  { id: "audit-log",             icon: Shield,         label: "Audit Log",                    roles: ["admin"], keywords: "audit log auditoria registo acções segurança historico" },
  { id: "turmas",                icon: Info,           label: "Nota — Turmas",                roles: ["formador", "admin"], keywords: "turmas legado antigo" },
];

const ACCENT_MAP: Record<string, string> = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c",
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .split("")
    .map(ch => ACCENT_MAP[ch] ?? ch)
    .join("");
}

export default function ManualPage() {
  const { user } = useAdminUser();
  const [active, setActive] = useState("registo");
  const [query, setQuery] = useState("");

  // Secções visíveis para o perfil de quem está a ler — um formando nunca vê
  // conteúdo marcado só para formador/admin. Admin vê sempre tudo.
  const visibleSections = useMemo(() => {
    const role = user?.role;
    if (role === "admin" || role === "super-admin") return SECTIONS;
    return SECTIONS.filter(s => s.roles.includes("todos") || (role && s.roles.includes(role as Role)));
  }, [user?.role]);

  const filteredIds = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return new Set(
      visibleSections.filter(s => normalize(s.label + " " + s.keywords).includes(q)).map(s => s.id)
    );
  }, [query, visibleSections]);

  const isSectionVisible = (id: string) =>
    visibleSections.some(s => s.id === id) && (!filteredIds || filteredIds.has(id));

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex gap-6 items-start w-full">
      {/* Navegação lateral do manual */}
      <nav className="hidden lg:block w-56 shrink-0 sticky top-4 space-y-3 c-bg2 border c-br rounded-xl p-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 c-tx5" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar tópico..."
            className="w-full c-s1 border c-br rounded-lg pl-8 pr-2.5 py-1.5 text-xs c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="space-y-0.5">
          {visibleSections.filter(s => !filteredIds || filteredIds.has(s.id)).map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                active === s.id ? "bg-blue-500/10 text-blue-400" : "c-tx4 hc-tx hc-s2"
              }`}
            >
              <s.icon size={13} className="shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
          {filteredIds && filteredIds.size === 0 && (
            <p className="text-[11px] c-tx5 px-2.5 py-2">Sem resultados para "{query}".</p>
          )}
        </div>
      </nav>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 max-w-5xl space-y-8 pb-16 c-bg2 border c-br rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold c-tx">Manual do Backoffice</h1>
            <p className="text-xs c-tx4">Como usar cada área da plataforma — organizado por função.</p>
          </div>
        </div>

        {/* pesquisa em ecrãs pequenos, onde a nav lateral fica escondida */}
        <div className="lg:hidden relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 c-tx5" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar tópico..."
            className="w-full c-s1 border c-br rounded-lg pl-8 pr-2.5 py-2 text-xs c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Registo */}
        <section id="registo" hidden={!isSectionVisible("registo")} className="scroll-mt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Registo e primeiro acesso</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">O registo faz-se num modal na própria página principal do site (botão "Registe-se"), começando por escolher entre "Formando" ou "Formador" — os formulários pedem dados diferentes.</p>

          <h3 className="text-xs font-semibold c-tx2 uppercase tracking-wide mt-4">Formando</h3>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li>Nome, apelido, email e palavra-passe</li>
            <li>Província e município</li>
            <li>Instituição / escola</li>
          </ul>

          <h3 className="text-xs font-semibold c-tx2 uppercase tracking-wide mt-4">Formador</h3>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li>Nome, apelido, email e palavra-passe</li>
            <li>Fotografia de perfil (obrigatória) — via webcam/ficheiro ou por QR code com o telemóvel</li>
            <li>Especialidade e síntese biográfica (obrigatórias)</li>
          </ul>

          <Callout>
            Depois de submeter, chega um email de confirmação (válido 48h). A conta só fica activa depois de <strong className="c-tx2">confirmar o email</strong> e depois <strong className="c-tx2">ser aprovada</strong>.
          </Callout>
          <Callout>
            Se o link expirar, ou o email não chegar, a página de confirmação tem um campo para <strong className="c-tx2">reenviar</strong> um novo link — não é preciso registar-se de novo. Se não encontrar o email, vale a pena verificar a pasta de <strong className="c-tx2">Spam / Lixo</strong> ou "Promoções".
          </Callout>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="font-semibold c-tx2 mb-1">Formando</p>
              <p className="c-tx4">Aprovado por qualquer formador ou admin, em "Formandos por Validar".</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="font-semibold c-tx2 mb-1">Formador</p>
              <p className="c-tx4">Aprovado por um administrador, em "Utilizadores".</p>
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard" hidden={!isSectionVisible("dashboard")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Dashboard</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Página inicial ao entrar na plataforma — mostra só o que é relevante para o perfil de quem a vê.</p>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li><strong className="c-tx2">Formando</strong> vê ficheiros, eventos e publicações — sem rankings nem estatísticas de gestão.</li>
            <li><strong className="c-tx2">Formador / Admin</strong> vê também os rankings de contribuição e o armazenamento usado.</li>
          </ul>
          <p className="text-xs c-tx3">O selector de modo (canto superior direito) tem várias opções de fundo — o modo por defeito é <strong className="c-tx2">Neutro</strong> (fundo sólido, sem imagem), mas pode trocar-se a qualquer momento; a escolha fica guardada no dispositivo.</p>
        </section>

        {/* Pesquisa Global */}
        <section id="pesquisa-global" hidden={!isSectionVisible("pesquisa-global")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Pesquisa Global</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Ícone de lupa na barra superior (ou atalho <strong className="c-tx2">Ctrl/Cmd+K</strong>) — pesquisa ao mesmo tempo em acções de formação, documentos e tarefas; formador/admin também pesquisam utilizadores.</p>
          <Callout>
            Os resultados respeitam sempre a mesma visibilidade de cada página — um formando não encontra na pesquisa nada que já não pudesse ver na Agenda, no Repositório ou nas Tarefas.
          </Callout>
        </section>

        {/* As Minhas Formações */}
        <section id="minhas-formacoes" hidden={!isSectionVisible("minhas-formacoes")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">As Minhas Formações</h2>
            <RoleTag role="formando" /><RoleTag role="formador" />
          </div>
          <p className="text-sm c-tx3">Um único sítio com todas as acções de formação em que está inscrito (formando) ou que lecciona (formador), sem ter de andar de página em página.</p>
          <p className="text-xs c-tx3">Cada acção mostra quantas tarefas há por entregar/receber (com atalho já filtrado para essa acção em Tarefas) e um botão "Materiais" que expande a lista de documentos publicados nessa acção.</p>
        </section>

        {/* Acções de Formação */}
        <section id="acoes-formacao" hidden={!isSectionVisible("acoes-formacao")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Acções de Formação</h2>
            <RoleTag role="formador" /><RoleTag role="admin" />
          </div>
          <p className="text-sm c-tx3">O coração da plataforma: cada edição concreta de um curso, com datas, formandos inscritos, materiais e galeria de fotos.</p>

          <SchemaAcoesFormacao />

          <h3 className="text-xs font-semibold c-tx2 uppercase tracking-wide mt-4">Criar uma acção</h3>
          <Steps items={[
            <>Botão <strong className="c-tx2">"Nova acção de formação"</strong>.</>,
            <>Preencher designação, área, datas, horário, província, local e vagas.</>,
            <>Imagem/cartaz opcional — aparece também no evento de Agenda gerado automaticamente.</>,
            <>Se for um formador a criar, fica logo como responsável; um admin associa depois um formador.</>,
          ]} />

          <h3 className="text-xs font-semibold c-tx2 uppercase tracking-wide mt-4">Três separadores</h3>
          <div className="space-y-2">
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">Materiais</p>
              <p className="text-xs c-tx4">Publica ficheiros já existentes no Repositório nesta acção, com janela de disponibilidade opcional.</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">Utilizadores</p>
              <p className="text-xs c-tx4">Gerir formador(es) responsável(eis), aprovar/rejeitar inscrições pendentes, adicionar formandos directamente.</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">Fotos</p>
              <p className="text-xs c-tx4">Galeria pública da acção — envia várias fotos de uma vez, a qualquer momento, e elimina com confirmação.</p>
            </div>
          </div>

          <Callout>
            É a <strong className="c-tx2">primeira inscrição aprovada</strong> numa acção que activa o acesso completo do formando à plataforma — não é preciso mais nenhum passo.
          </Callout>
        </section>

        {/* Formandos por Validar */}
        <section id="formandos-por-validar" hidden={!isSectionVisible("formandos-por-validar")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Formandos por Validar</h2>
            <RoleTag role="formador" /><RoleTag role="admin" />
          </div>
          <p className="text-sm c-tx3">Uma caixa de entrada única e partilhada — todos os formadores e administradores vêem a mesma fila de formandos à espera de acesso.</p>

          <SchemaFormandosPorValidar />

          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li><strong className="c-tx2">Aprovar</strong> — qualquer formador ou admin. Activa a conta; não associa a esse formador específico.</li>
            <li><strong className="c-tx2">Recusar</strong> — qualquer formador ou admin. Bloqueia a conta em definitivo (pede confirmação).</li>
          </ul>
          <Callout>
            Aprovar aqui não escolhe um formador para o formando — isso acontece depois, naturalmente, quando o formando se inscreve numa acção de formação.
          </Callout>
        </section>

        {/* Repositório */}
        <section id="repositorio" hidden={!isSectionVisible("repositorio")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Repositório</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Biblioteca de ficheiros organizada por disciplina, com upload por arrastar-e-largar.</p>

          <SchemaRepositorio />

          <Steps items={[
            <>Botão <strong className="c-tx2">"Upload"</strong> ou arrastar o(s) ficheiro(s) para a janela — pode seleccionar vários de uma vez; com mais de um, cada ficheiro usa o próprio nome como título.</>,
            <>Dar título (só obrigatório com um único ficheiro) e escolher a disciplina.</>,
            <>Escolher capa, ou deixar em branco (PDFs geram miniatura automática — só com um único ficheiro).</>,
            <>Escolher visibilidade e, se aplicável, "Partilhar no site público".</>,
          ]} />

          <h3 className="text-xs font-semibold c-tx2 uppercase tracking-wide mt-4 flex items-center gap-1.5"><Folder size={12} className="text-blue-400" /> Pastas</h3>
          <p className="text-xs c-tx3">Dentro de cada disciplina, formador/admin podem criar <strong className="c-tx2">pastas</strong> para organizar por sessão, tema ou acção de formação — botão "Nova Pasta". Um ficheiro em upload fica automaticamente dentro da pasta que estiver aberta no momento.</p>
          <Steps items={[
            <>Seleccionar a pasta (fica destacada) para ver só os ficheiros lá dentro.</>,
            <><strong className="c-tx2">Anexar tudo a uma Acção</strong> — publica todos os documentos da pasta numa acção de formação, de uma só vez.</>,
            <><strong className="c-tx2">Clonar para nova Acção</strong> — cria uma cópia da pasta e dos seus documentos já publicada noutra acção, sem duplicar o espaço de armazenamento.</>,
          ]} />
          <Callout>
            Eliminar uma pasta não apaga os ficheiros lá dentro — ficam soltos na disciplina.
          </Callout>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="c-s1 border c-br rounded-lg p-2.5">
              <p className="font-semibold c-tx2">Só eu</p>
              <p className="c-tx4 text-[11px] mt-0.5">Só quem enviou e admins</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-2.5">
              <p className="font-semibold c-tx2">Formadores</p>
              <p className="c-tx4 text-[11px] mt-0.5">Nunca formandos</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-2.5">
              <p className="font-semibold c-tx2">Todos</p>
              <p className="c-tx4 text-[11px] mt-0.5">Toda a plataforma</p>
            </div>
          </div>

          <p className="text-xs c-tx3">Um formando só vê ficheiros de uma disciplina se estiver inscrito numa acção dessa área, e só dentro da janela de disponibilidade definida.</p>

          <Callout>
            Para publicar um ficheiro numa acção de formação específica, envie-o primeiro aqui e associe-o depois em Acções de Formação → Materiais.
          </Callout>
        </section>

        {/* Tarefas */}
        <section id="tarefas" hidden={!isSectionVisible("tarefas")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Tarefas</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Um quadro em três colunas, com sentido diferente conforme o papel de quem o vê.</p>

          <SchemaTarefas />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="font-semibold c-tx2 mb-1">Formador / Admin</p>
              <p className="c-tx4">Por entregar · Em progresso · Concluídas. Cria tarefas e atribui a formandos.</p>
            </div>
            <div className="c-s1 border c-br rounded-lg p-3">
              <p className="font-semibold c-tx2 mb-1">Formando</p>
              <p className="c-tx4">A fazer · Entregue · Avaliado. Entrega com anexo opcional.</p>
            </div>
          </div>
          <p className="text-xs c-tx3">O formador atribui nota e observações a cada entrega — o formando vê ambas assim que passa a "Avaliado", e recebe uma notificação a avisar.</p>
          <p className="text-xs c-tx3">Uma tarefa criada para uma acção de formação específica mostra uma etiqueta com o nome dessa acção em cada cartão, e aparece um filtro "Acção de formação" por cima do quadro para consultar só as tarefas dessa acção.</p>
          <p className="text-xs c-tx3">Ao criar uma tarefa, pode também escolher-se uma <strong className="c-tx2">disciplina</strong> (a mesma lista de áreas usada no Repositório) — aparece como etiqueta separada no cartão, para identificar rapidamente a que disciplina pertence.</p>
        </section>

        {/* Agenda */}
        <section id="agenda" hidden={!isSectionVisible("agenda")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Agenda</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Grelha de eventos, com pesquisa e filtros por formato e âmbito. Eventos passados ficam arquivados.</p>
          <p className="text-xs c-tx3">Um evento pode ser associado a uma acção de formação — inscrever-se no evento inscreve automaticamente na acção (e vice-versa ao cancelar).</p>
          <p className="text-xs c-tx3">Um evento em que já está inscrito fica destacado com um selo "Inscrito" e um contorno colorido no cartão. Cancelar uma inscrição pede sempre confirmação antes de remover.</p>
        </section>

        {/* Comunidade */}
        <section id="comunidade" hidden={!isSectionVisible("comunidade")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Comunidade</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Mural de publicações por categoria (Metodologia, Dúvidas, Casos de Sucesso, Avisos), aberto a qualquer utilizador.</p>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li>Qualquer pessoa publica, comenta e "gosta"</li>
            <li>Só o autor ou um admin elimina uma publicação (sem edição)</li>
            <li>Só um admin pode fixar uma publicação no topo</li>
          </ul>
        </section>

        {/* Mensagens */}
        <section id="mensagens" hidden={!isSectionVisible("mensagens")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Mensagens</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Mensagens privadas, uma conversa de cada vez.</p>
          <Callout warn>
            Um <strong>formando</strong> só pode escrever a formadores das acções em que está inscrito, ou a administradores.
          </Callout>
        </section>

        {/* Notificações */}
        <section id="notificacoes" hidden={!isSectionVisible("notificacoes")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Notificações</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Espaço único com todas as notificações — tarefas novas, documentos novos, mensagens por ler e anúncios/avisos — acessível pela sidebar ("Notificações") ou pelo sino no topo → "Ver todas".</p>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li>Agrupadas por data (Hoje, Ontem, Esta semana, Anteriores)</li>
            <li>Filtro "Todas" / "Não lidas", marcar todas como lidas, limpar tudo</li>
            <li>Documentos: só notifica quem já tem acesso ao ficheiro (mesma visibilidade do Repositório)</li>
            <li>Mensagens: um único aviso "Tens mensagens por ler" em vez de um por mensagem — o contador exacto continua no ícone de Mensagens</li>
          </ul>
        </section>

        {/* Suporte */}
        <section id="suporte" hidden={!isSectionVisible("suporte")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Suporte</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Sistema de tickets em formato de caixa de entrada.</p>
          <Steps items={[
            <>Botão <strong className="c-tx2">"Novo"</strong> — categoria, assunto e descrição.</>,
            <>O ticket começa Pendente; um admin passa a Em Processo e depois Resolvido.</>,
            <>As duas partes conversam dentro do ticket; resolvido, só um admin o reabre.</>,
          ]} />
          <p className="text-xs c-tx3">Um formando ou formador só vê os seus tickets; um admin vê todos.</p>
        </section>

        {/* Perfil */}
        <section id="perfil" hidden={!isSectionVisible("perfil")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Perfil</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Dados da conta em cinco separadores, mais fotografia e palavra-passe: Conta, Identificação, Residência, Habilitações Académicas e Situação Profissional.</p>
          <p className="text-xs c-tx3">Para um formando, as "Áreas" já não se escolhem à mão — reflectem as acções de formação em que está inscrito. A lista "Os meus formadores" é apenas de consulta.</p>
        </section>

        {/* Utilizadores */}
        <section id="utilizadores" hidden={!isSectionVisible("utilizadores")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Utilizadores</h2>
            <RoleTag role="formador" /><RoleTag role="admin" />
          </div>
          <p className="text-sm c-tx3">Um formador vê aqui apenas a lista de utilizadores; o essencial da página é para administradores.</p>
          <ul className="list-disc list-inside text-xs c-tx3 space-y-1">
            <li>Aprovar/rejeitar formadores pendentes</li>
            <li>Criar utilizador (com email) ou formando sem email (com nome de utilizador)</li>
            <li>Mudar cargo e estado, repor password, editar ficha, eliminar conta</li>
            <li>Ver última sessão e quem está online agora; exportar para CSV</li>
          </ul>
          <p className="text-xs c-tx3">Só admin: separadores <strong className="c-tx2">Estatísticas</strong>, <strong className="c-tx2">Anúncios</strong> e <strong className="c-tx2">Configurações</strong>.</p>
        </section>

        {/* Audit Log */}
        <section id="audit-log" hidden={!isSectionVisible("audit-log")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Audit Log</h2>
            <RoleTag role="admin" />
          </div>
          <p className="text-sm c-tx3">Registo cronológico de tudo o que acontece na plataforma — logins, uploads, aprovações, eliminações, mudanças de cargo — com autor, alvo, IP e data.</p>
          <p className="text-xs c-tx3">Vista em cartões (por utilizador) ou lista (tabela paginada, com filtros). Serve para rastreabilidade e auditoria de segurança.</p>
        </section>

        {/* Turmas */}
        <section id="turmas" hidden={!isSectionVisible("turmas")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Nota — Turmas</h2>
            <RoleTag role="formador" /><RoleTag role="admin" />
          </div>
          <Callout warn>
            Ainda encontra uma funcionalidade mais antiga chamada <strong>Turmas</strong> no menu — é anterior às Acções de Formação e já não está ligada ao Repositório nem à Agenda. A gestão de grupos de formandos deve ser feita através de Acções de Formação.
          </Callout>
        </section>

        <div className="flex items-center gap-1.5 text-[11px] c-tx5 pt-4">
          <ChevronRight size={11} />
          Este manual reflecte o estado actual da plataforma; algumas opções podem variar com futuras actualizações.
        </div>
      </div>
    </div>
  );
}
