"use client";

import { useMemo, useState } from "react";
import {
  BookOpen, GraduationCap, UserPlus, FolderOpen, ClipboardList, Calendar,
  MessageSquare, Mail, LifeBuoy, UserCircle, Users, Shield, AlertTriangle,
  Info, ChevronRight, Search, Image as ImageIcon, FileText, Star,
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
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 my-3 ${warn ? "bg-amber-500/5 border-amber-500/20" : "c-s1 border c-br"}`}>
      {warn ? <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" /> : <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />}
      <div className={`text-xs leading-relaxed ${warn ? "text-amber-200/90" : "c-tx3"}`}>{children}</div>
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
};

const SECTIONS: Section[] = [
  { id: "registo",               icon: UserPlus,      label: "Registo e primeiro acesso", keywords: "registo conta criar email confirmar aprovar formando formador password bilhete identidade escola provincia foto qr" },
  { id: "acoes-formacao",        icon: GraduationCap,  label: "Acções de Formação",         keywords: "acções formação curso designação materiais utilizadores fotos galeria inscrição vagas horario local data" },
  { id: "formandos-por-validar", icon: UserPlus,       label: "Formandos por Validar",       keywords: "formandos validar aprovar recusar fila caixa entrada pendente activar conta" },
  { id: "repositorio",           icon: FolderOpen,     label: "Repositório",                 keywords: "repositório ficheiros upload disciplina visibilidade capa pdf miniatura download" },
  { id: "tarefas",               icon: ClipboardList,  label: "Tarefas",                      keywords: "tarefas entregar avaliar nota observações feedback prazo anexo kanban" },
  { id: "agenda",                icon: Calendar,       label: "Agenda",                       keywords: "agenda eventos evento inscrição presencial online arquivo calendario" },
  { id: "comunidade",            icon: MessageSquare,  label: "Comunidade",                   keywords: "comunidade publicação post comentário gosto fixar categoria mural" },
  { id: "mensagens",             icon: Mail,           label: "Mensagens",                    keywords: "mensagens privadas conversa contactar formador" },
  { id: "suporte",               icon: LifeBuoy,       label: "Suporte",                      keywords: "suporte ticket pendente resolvido categoria ajuda problema" },
  { id: "perfil",                icon: UserCircle,     label: "Perfil",                       keywords: "perfil dados pessoais identificação residência habilitações profissional password avatar foto" },
  { id: "utilizadores",          icon: Users,          label: "Utilizadores",                 keywords: "utilizadores admin cargo estado password csv estatísticas anúncios configurações" },
  { id: "audit-log",             icon: Shield,         label: "Audit Log",                    keywords: "audit log auditoria registo acções segurança historico" },
  { id: "turmas",                icon: Info,           label: "Nota — Turmas",                keywords: "turmas legado antigo" },
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
  const [active, setActive] = useState("registo");
  const [query, setQuery] = useState("");

  const filteredIds = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return new Set(
      SECTIONS.filter(s => normalize(s.label + " " + s.keywords).includes(q)).map(s => s.id)
    );
  }, [query]);

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
          {SECTIONS.filter(s => !filteredIds || filteredIds.has(s.id)).map(s => (
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
        <section id="registo" hidden={!!filteredIds && !filteredIds.has("registo")} className="scroll-mt-4 space-y-3">
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
            Depois de submeter, chega um email de confirmação (válido 24h). A conta só fica activa depois de <strong className="c-tx2">confirmar o email</strong> e depois <strong className="c-tx2">ser aprovada</strong>.
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

        {/* Acções de Formação */}
        <section id="acoes-formacao" hidden={!!filteredIds && !filteredIds.has("acoes-formacao")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        <section id="formandos-por-validar" hidden={!!filteredIds && !filteredIds.has("formandos-por-validar")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        <section id="repositorio" hidden={!!filteredIds && !filteredIds.has("repositorio")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Repositório</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Biblioteca de ficheiros organizada por disciplina, com upload por arrastar-e-largar.</p>

          <SchemaRepositorio />

          <Steps items={[
            <>Botão <strong className="c-tx2">"Upload"</strong> ou arrastar o ficheiro para a janela.</>,
            <>Dar título e escolher a disciplina.</>,
            <>Escolher capa, ou deixar em branco (PDFs geram miniatura automática).</>,
            <>Escolher visibilidade e, se aplicável, "Partilhar no site público".</>,
          ]} />

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
        <section id="tarefas" hidden={!!filteredIds && !filteredIds.has("tarefas")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        </section>

        {/* Agenda */}
        <section id="agenda" hidden={!!filteredIds && !filteredIds.has("agenda")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Agenda</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Grelha de eventos, com pesquisa e filtros por formato e âmbito. Eventos passados ficam arquivados.</p>
          <p className="text-xs c-tx3">Um evento pode ser associado a uma acção de formação — inscrever-se no evento inscreve automaticamente na acção (e vice-versa ao cancelar).</p>
        </section>

        {/* Comunidade */}
        <section id="comunidade" hidden={!!filteredIds && !filteredIds.has("comunidade")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        <section id="mensagens" hidden={!!filteredIds && !filteredIds.has("mensagens")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Mensagens</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Mensagens privadas, uma conversa de cada vez.</p>
          <Callout warn>
            Um <strong>formando</strong> só pode escrever a formadores das acções em que está inscrito, ou a administradores.
          </Callout>
        </section>

        {/* Suporte */}
        <section id="suporte" hidden={!!filteredIds && !filteredIds.has("suporte")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        <section id="perfil" hidden={!!filteredIds && !filteredIds.has("perfil")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Perfil</h2>
            <RoleTag role="todos" />
          </div>
          <p className="text-sm c-tx3">Dados da conta em cinco separadores, mais fotografia e palavra-passe: Conta, Identificação, Residência, Habilitações Académicas e Situação Profissional.</p>
          <p className="text-xs c-tx3">Para um formando, as "Áreas" já não se escolhem à mão — reflectem as acções de formação em que está inscrito. A lista "Os meus formadores" é apenas de consulta.</p>
        </section>

        {/* Utilizadores */}
        <section id="utilizadores" hidden={!!filteredIds && !filteredIds.has("utilizadores")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
        <section id="audit-log" hidden={!!filteredIds && !filteredIds.has("audit-log")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold c-tx">Audit Log</h2>
            <RoleTag role="admin" />
          </div>
          <p className="text-sm c-tx3">Registo cronológico de tudo o que acontece na plataforma — logins, uploads, aprovações, eliminações, mudanças de cargo — com autor, alvo, IP e data.</p>
          <p className="text-xs c-tx3">Vista em cartões (por utilizador) ou lista (tabela paginada, com filtros). Serve para rastreabilidade e auditoria de segurança.</p>
        </section>

        {/* Turmas */}
        <section id="turmas" hidden={!!filteredIds && !filteredIds.has("turmas")} className="scroll-mt-4 space-y-3 pt-6 border-t c-br">
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
