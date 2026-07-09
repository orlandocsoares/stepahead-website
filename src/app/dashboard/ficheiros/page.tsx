"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  FileText, Search, Download, Loader2, Plus, FolderOpen, Lock,
  Globe, Users, GraduationCap, LayoutGrid, List, ExternalLink,
  FileImage, FileVideo, FileArchive, File, Trash2, ImagePlus, Pencil, Settings,
  ChevronRight, Upload, Folder, HardDrive, ArrowUpDown
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CAPA_GERAL, AREA_COVERS, getAreaCover, isBrandedCapa } from "@/lib/capas";

const CATEGORIES_FALLBACK = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];

const VISIBILIDADE_OPTIONS = [
  { value: "privado",           label: "Só eu",                        icon: Lock,          color: "c-tx3" },
  { value: "formadores",        label: "Formadores",                   icon: Users,         color: "text-blue-400" },
  { value: "publico",           label: "Todos",                        icon: Globe,         color: "text-emerald-400" },
  // Legado — apenas para exibir ficheiros antigos, não seleccionável em novos uploads.
  // A publicação numa Acção de Formação específica passa a fazer-se em Acções de Formação → Materiais.
  { value: "turma",             label: "Minha turma (legado)",              icon: GraduationCap, color: "text-amber-400" },
  { value: "formadores_turma",  label: "Formadores + Turma (legado)",       icon: Users,         color: "text-purple-400" },
  { value: "acao_formacao",     label: "Acção de Formação (legado)",        icon: GraduationCap, color: "text-amber-400" },
  { value: "formadores_acao",   label: "Formadores + Acção (legado)",       icon: Users,         color: "text-purple-400" },
];

const CAT_COLORS: Record<string, string> = {
  "Geral": "text-slate-400", "Matemática": "text-blue-400",
  "Língua Portuguesa": "text-violet-400", "Física": "text-cyan-400",
  "Química": "text-emerald-400", "Pedagogia": "text-amber-400",
};

function VisibilidadeBadge({ v, small, acaoNome }: { v: string; small?: boolean; acaoNome?: string }) {
  const opt = VISIBILIDADE_OPTIONS.find(o => o.value === v) ?? VISIBILIDADE_OPTIONS[0];
  const Icon = opt.icon;
  const isAcao = v === "acao_formacao" || v === "formadores_acao";
  return (
    <span className={`inline-flex items-center gap-1 ${small ? "text-[9px]" : "text-[10px]"} ${opt.color}`}>
      <Icon size={small ? 9 : 10} /> {isAcao && acaoNome ? acaoNome : opt.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function getDisponibilidadeStatus(disponivel_de?: string | null, disponivel_ate?: string | null) {
  const now = new Date();
  const de = disponivel_de ? new Date(disponivel_de) : null;
  const ate = disponivel_ate ? new Date(disponivel_ate) : null;
  if (de && now < de) return "agendado";
  if (ate && now > ate) return "expirado";
  if (de || ate) return "activo";
  return null;
}

function DisponibilidadeBadge({ disponivel_de, disponivel_ate }: { disponivel_de?: string | null; disponivel_ate?: string | null }) {
  const status = getDisponibilidadeStatus(disponivel_de, disponivel_ate);
  const ate = disponivel_ate ? new Date(disponivel_ate) : null;
  const diasRestantes = ate ? Math.ceil((ate.getTime() - Date.now()) / 86400000) : null;
  if (!status) return null;
  if (status === "agendado") return (
    <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
      <CalendarClock size={9} /> A partir de {formatDate(disponivel_de!)}
    </span>
  );
  if (status === "expirado") return (
    <span className="inline-flex items-center gap-1 text-[9px] text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
      <CalendarClock size={9} /> Expirado
    </span>
  );
  if (status === "activo" && diasRestantes !== null && diasRestantes <= 7) return (
    <span className="inline-flex items-center gap-1 text-[9px] text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded px-1.5 py-0.5">
      <CalendarClock size={9} /> Expira em {diasRestantes}d
    </span>
  );
  return null;
}

function getFileStyle(nome?: string, tipo?: string) {
  const ext = nome?.split(".").pop()?.toLowerCase() ?? "";
  if (tipo === "video" || ["mp4","mov","avi","mkv"].includes(ext))
    return { Icon: FileVideo,   bg: "bg-orange-500/10", text: "text-orange-400",   label: "Vídeo",  accent: "#f97316" };
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext))
    return { Icon: FileImage,   bg: "bg-pink-500/10",   text: "text-pink-400",     label: ext.toUpperCase(), accent: "#ec4899" };
  if (["zip","rar","7z"].includes(ext))
    return { Icon: FileArchive, bg: "bg-yellow-500/10", text: "text-yellow-400",   label: ext.toUpperCase(), accent: "#eab308" };
  if (ext === "pdf")
    return { Icon: FileText,    bg: "bg-red-500/10",    text: "text-red-400",      label: "PDF",    accent: "#ef4444" };
  if (["doc","docx"].includes(ext))
    return { Icon: FileText,    bg: "bg-blue-500/10",   text: "text-blue-400",     label: "Word",   accent: "#3b82f6" };
  if (["ppt","pptx"].includes(ext))
    return { Icon: FileText,    bg: "bg-orange-500/10", text: "text-orange-400",   label: "PPT",    accent: "#f97316" };
  if (["xls","xlsx"].includes(ext))
    return { Icon: FileText,    bg: "bg-emerald-500/10","text": "text-emerald-400", label: "Excel", accent: "#10b981" };
  return { Icon: File,          bg: "c-s2",             text: "c-tx3",             label: ext.toUpperCase() || "—", accent: "#6b7280" };
}

function parseSpecializations(raw?: string, allCats?: string[]): string[] {
  const cats = allCats ?? CATEGORIES_FALLBACK;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s: string) => cats.includes(s));
  } catch {}
  return cats.includes(raw) ? [raw] : [];
}

function getVisibleCategories(role?: string, specialization?: string, allCats?: string[]): string[] {
  const cats = allCats ?? CATEGORIES_FALLBACK;
  if (role === "admin" || role === "super-admin") return cats;
  const areas = parseSpecializations(specialization, cats);
  if (role === "formador" && areas.length > 0) return ["Geral", ...areas];
  return cats;
}

function getUploadAreas(role?: string, specialization?: string, allCats?: string[]): string[] | null {
  if (role === "admin" || role === "super-admin") return null;
  const areas = parseSpecializations(specialization, allCats);
  return role === "formador" && areas.length > 0 ? ["Geral", ...areas] : null;
}

export default function FicheirosPage() {
  const { user } = useAdminUser();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Geral");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Geral");
  const [visibilidade, setVisibilidade] = useState("publico");
  const [acaoFormacaoId, setAcaoFormacaoId] = useState<string>("");
  const [minhasAcoes, setMinhasAcoes] = useState<{ id: string; designacao: string }[]>([]);
  const [acoesNomes, setAcoesNomes] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortCol, setSortCol] = useState<"nome" | "area" | "tamanho" | "data" | "visibilidade">("data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedCapa, setSelectedCapa] = useState<string | null>(null);
  const [disponivel_de, setDisponivelDe] = useState("");
  const [disponivel_ate, setDisponivelAte] = useState("");
  const [disciplinas, setDisciplinas] = useState<{ id: string; nome: string }[]>([]);
  const [gruposFormacao, setGruposFormacao] = useState<{ id: string; nome: string }[]>([]);
  const [gruposUpload, setGruposUpload] = useState<string[]>([]);
  const [sitePublico, setSitePublico] = useState(false);
  const [activeGrupo, setActiveGrupo] = useState<string>("todos");
  const [isDragging, setIsDragging] = useState(false);

  const [editingFile, setEditingFile] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArea, setEditArea] = useState("Geral");
  const [editVisibilidade, setEditVisibilidade] = useState("publico");
  const [editAcaoFormacaoId, setEditAcaoFormacaoId] = useState("");
  const [editDisponivelDe, setEditDisponivelDe] = useState("");
  const [editDisponivelAte, setEditDisponivelAte] = useState("");
  const [editGrupos, setEditGrupos] = useState<string[]>([]);
  const [editSitePublico, setEditSitePublico] = useState(false);
  const [editCapa, setEditCapa] = useState<string | null>(null);
  const [editCapaTouched, setEditCapaTouched] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  const canUpload = user?.role === "admin" || user?.role === "formador" || user?.role === "super-admin";
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  const allCatNames = useMemo(() => ["Geral", ...disciplinas.map(d => d.nome)], [disciplinas]);
  const visibleCategories = useMemo(() => getVisibleCategories(user?.role, user?.specialization, allCatNames), [user?.role, user?.specialization, allCatNames]);
  const uploadAreas = useMemo(() => getUploadAreas(user?.role, user?.specialization, allCatNames), [user?.role, user?.specialization, allCatNames]);
  const isRestricted = user?.role === "formador" && uploadAreas !== null;
  const uploadCategoryOptions = uploadAreas ?? allCatNames;
  const uploadAreaLocked = uploadAreas?.length === 1;

  function openUploadModal(prefillFile?: File) {
    setTitle(prefillFile ? prefillFile.name.replace(/\.[^.]+$/, "").replace(/_/g, " ") : "");
    setUploadFile(prefillFile ?? null);
    setThumbnailPreview(prefillFile?.type === "application/pdf" ? URL.createObjectURL(prefillFile) : null);
    setVisibilidade("publico");
    setAcaoFormacaoId(minhasAcoes[0]?.id ?? "");
    setUploadCategory(uploadAreas?.[0] ?? activeCategory);
    setDisponivelDe(""); setDisponivelAte("");
    setGruposUpload([]); setSitePublico(false);
    setSelectedCapa(null);
    setIsModalOpen(true);
  }

  const capaOptions = useMemo(() => {
    const opts = [{ label: "Geral", url: CAPA_GERAL }];
    const specific = getAreaCover(uploadCategory);
    if (specific) opts.push({ label: uploadCategory, url: specific });
    return opts;
  }, [uploadCategory]);

  // Se mudar de disciplina, a capa específica anterior deixa de fazer sentido.
  useEffect(() => {
    if (selectedCapa && !capaOptions.some(o => o.url === selectedCapa)) setSelectedCapa(null);
  }, [capaOptions]);

  function handleFileSelect(file: File) {
    setUploadFile(file);
    setThumbnailPreview(file.type === "application/pdf" ? URL.createObjectURL(file) : null);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
  }

  // Drag & drop global
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: DragEvent) => { if (!e.relatedTarget) setIsDragging(false); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && canUpload) openUploadModal(file);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => { window.removeEventListener("dragover", onDragOver); window.removeEventListener("dragleave", onDragLeave); window.removeEventListener("drop", onDrop); };
  }, [canUpload, activeCategory]);

  async function fetchFiles() {
    try {
      const res = await fetch("/api/arquivos/lista");
      const json = await res.json();
      const rows = json?.data ?? json;
      setFiles(Array.isArray(rows) ? rows : []);
    } catch { setFiles([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchFiles();
    fetch("/api/admin/disciplinas").then(r => r.json()).then(j => setDisciplinas(j.disciplinas?.filter((d: any) => d.activo) ?? []));
    fetch("/api/admin/grupos-formacao").then(r => r.json()).then(j => setGruposFormacao(j.grupos?.filter((g: any) => g.activo) ?? []));
    if (user) {
      fetch("/api/acoes-formacao").then(r => r.json()).then(json => {
        const todas = json.data ?? [];
        setAcoesNomes(Object.fromEntries(todas.map((a: any) => [a.id, a.designacao])));
        const isAdminUser = user.role === "admin" || user.role === "super-admin";
        if (isAdminUser || user.role === "formador") {
          setMinhasAcoes(isAdminUser ? todas : todas.filter((a: any) => (a.formadores ?? []).some((f: any) => f.id === user.id)));
        }
      });
    }
  }, [user?.id, user?.role]);

  // Contagens por categoria
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of files) c[f.area] = (c[f.area] ?? 0) + 1;
    return c;
  }, [files]);

  const totalSizeMB = useMemo(() => {
    let total = 0;
    for (const f of files) {
      const m = parseFloat(f.tamanho);
      if (!isNaN(m)) total += m;
    }
    return total.toFixed(1);
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const isOwner = f.uploader_id === user?.id;
      if (!isAdmin && !isOwner) {
        if (f.visibilidade === "privado") return false;
        if (f.visibilidade === "formadores" && user?.role === "formando") return false;
        const status = getDisponibilidadeStatus(f.disponivel_de, f.disponivel_ate);
        if (status === "agendado" || status === "expirado") return false;
      }
      if (!visibleCategories.includes(f.area)) return false;
      if (activeCategory !== "Geral" && f.area !== activeCategory) return false;
      if (activeGrupo !== "todos") {
        const gs: string[] = Array.isArray(f.grupos) ? f.grupos : [];
        if (activeGrupo === "sem-grupo") { if (gs.length > 0) return false; }
        else { if (!gs.includes(activeGrupo)) return false; }
      }
      if (search && !f.label?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortCol === "nome") cmp = (a.label ?? "").localeCompare(b.label ?? "");
      else if (sortCol === "area") cmp = (a.area ?? "").localeCompare(b.area ?? "");
      else if (sortCol === "tamanho") cmp = (a.tamanho ?? 0) - (b.tamanho ?? 0);
      else if (sortCol === "data") cmp = new Date(a.criado_em ?? 0).getTime() - new Date(b.criado_em ?? 0).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [files, search, activeCategory, activeGrupo, visibleCategories, user, sortCol, sortDir]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !title) return;
    setIsUploading(true);
    try {
      const sanitized = uploadFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${Date.now()}_${sanitized}`;
      const form = new FormData();
      form.append("bucket", "materiais"); form.append("path", fileName); form.append("file", uploadFile);
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Erro no upload.");
      const areaFinal = uploadAreas && !uploadAreas.includes(uploadCategory) ? uploadAreas[0] : uploadCategory;
      const dbRes = await fetch("/api/db/arquivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: title, nome_arquivo: fileName, area: areaFinal,
          tamanho: (uploadFile.size / (1024 * 1024)).toFixed(2) + " MB",
          tipo: uploadFile.type.includes("video") ? "video" : "pdf",
          visibilidade,
          ...((visibilidade === "acao_formacao" || visibilidade === "formadores_acao") && acaoFormacaoId ? { acao_formacao_id: acaoFormacaoId } : {}),
          ...(disponivel_de ? { disponivel_de } : {}),
          ...(disponivel_ate ? { disponivel_ate } : {}),
          ...(gruposUpload[0] ? { grupo_formacao_id: gruposUpload[0] } : {}),
          ...(selectedCapa ? { thumbnail_url: selectedCapa } : {}),
          site_publico: sitePublico && visibilidade === "publico",
        }),
      });
      if (!dbRes.ok) throw new Error("Erro ao registar.");
      if (gruposUpload.length > 0) {
        const newFile = (await dbRes.json())?.data?.[0];
        if (newFile?.id) await fetch("/api/arquivos/editar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: newFile.id, grupos: gruposUpload }) });
      }
      setIsModalOpen(false); setThumbnailPreview(null); fetchFiles();
    } catch (err: any) { alert(err.message ?? "Erro."); }
    finally { setIsUploading(false); }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Eliminar "${nome}"?`)) return;
    await fetch("/api/db/arquivos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eq: { id } }) });
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function openEditModal(f: any) {
    setEditingFile(f); setEditTitle(f.label ?? ""); setEditArea(f.area ?? "Geral");
    setEditVisibilidade(f.visibilidade ?? "publico"); setEditAcaoFormacaoId(f.acao_formacao_id ?? "");
    setEditDisponivelDe(f.disponivel_de ? f.disponivel_de.slice(0, 10) : "");
    setEditDisponivelAte(f.disponivel_ate ? f.disponivel_ate.slice(0, 10) : "");
    setEditGrupos(Array.isArray(f.grupos) ? f.grupos : []);
    setEditSitePublico(f.site_publico ?? false);
    const knownCapa = f.thumbnail_url === CAPA_GERAL || Object.values(AREA_COVERS).includes(f.thumbnail_url) ? f.thumbnail_url : null;
    setEditCapa(knownCapa);
    setEditCapaTouched(false);
  }

  const editCapaOptions = useMemo(() => {
    const opts = [{ label: "Geral", url: CAPA_GERAL }];
    const specific = getAreaCover(editArea);
    if (specific) opts.push({ label: editArea, url: specific });
    return opts;
  }, [editArea]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFile) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/arquivos/editar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFile.id, label: editTitle, area: editArea, visibilidade: editVisibilidade,
          acao_formacao_id: editAcaoFormacaoId || null, disponivel_de: editDisponivelDe || null,
          disponivel_ate: editDisponivelAte || null, grupos: editGrupos,
          site_publico: editSitePublico && editVisibilidade === "publico",
          ...(editCapaTouched ? { thumbnail_url: editCapa ?? "" } : {}),
        }),
      });
      if (!res.ok) throw new Error("Erro ao guardar.");
      setEditingFile(null); fetchFiles();
    } catch (err: any) { alert(err.message); }
    finally { setIsSavingEdit(false); }
  }

  return (
    <div className="flex gap-4 h-full w-full min-h-0">

      {/* ── Sidebar de navegação ── */}
      <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0 min-h-0">
        {/* Stats */}
        <div className="c-bg2 border c-br rounded-xl p-3 mb-2 space-y-2">
          <div className="flex items-center gap-2 c-tx5 text-[10px] font-semibold uppercase tracking-widest">
            <HardDrive size={11} /> Repositório
          </div>
          <div className="flex justify-between text-xs">
            <span className="c-tx4">{files.length} ficheiro{files.length !== 1 ? "s" : ""}</span>
            <span className="c-tx5">{totalSizeMB} MB</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${Math.min(Number(totalSizeMB) / 5, 100)}%` }} />
          </div>
        </div>

        {/* Categorias */}
        <p className="text-[9px] font-bold uppercase tracking-widest c-tx5 px-2 mb-1">Disciplinas</p>
        {visibleCategories.map(cat => {
          const count = catCounts[cat] ?? 0;
          const active = activeCategory === cat;
          const color = CAT_COLORS[cat] ?? "c-tx4";
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all group ${active ? "c-s1 border c-br font-medium c-tx" : "c-tx3 hc-s1 hc-tx"}`}>
              <Folder size={13} className={active ? color : "c-tx5 group-hover:" + color} />
              <span className="flex-1 truncate">{cat}</span>
              {count > 0 && <span className={`text-[10px] ${active ? "c-tx4" : "c-tx5"}`}>{count}</span>}
            </button>
          );
        })}

        {/* Grupos */}
        {gruposFormacao.length > 0 && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-widest c-tx5 px-2 mb-1 mt-3">Grupos</p>
            {[{ id: "todos", nome: "Todos" }, ...gruposFormacao, { id: "sem-grupo", nome: "Sem grupo" }].map(g => (
              <button key={g.id} onClick={() => setActiveGrupo(g.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${activeGrupo === g.id ? "c-s1 border c-br font-medium c-tx" : "c-tx3 hc-s1 hc-tx"}`}>
                <Users size={12} className="c-tx5" />
                <span className="truncate">{g.nome}</span>
              </button>
            ))}
          </>
        )}

        {/* Upload drop zone — admin/formador */}
        {canUpload && (
          <button onClick={() => openUploadModal()}
            className="mt-auto flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 c-tx4 hover:text-blue-400 transition-all text-center group">
            <Upload size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Arrastar ou clicar<br />para fazer upload</span>
          </button>
        )}
      </aside>

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Categorias — mobile */}
          <div className="flex gap-1.5 flex-wrap lg:hidden w-full">
            {visibleCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${activeCategory === cat ? "bg-blue-600 text-white" : "c-s1 c-tx4 border c-br hc-s2"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar ficheiros..."
              className="pl-8 pr-4 py-2 rounded-lg c-s1 border c-br text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 w-full transition-colors" />
          </div>

          {/* Sort */}
          <select value={`${sortCol}-${sortDir}`}
            onChange={e => { const [c, d] = e.target.value.split("-"); setSortCol(c as any); setSortDir(d as any); }}
            className="c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx outline-none hidden sm:block">
            {[
              ["data-desc","Mais recentes"],["data-asc","Mais antigos"],
              ["nome-asc","Nome A→Z"],["nome-desc","Nome Z→A"],
              ["tamanho-desc","Maior tamanho"],
            ].map(([v,l]) => <option key={v} value={v} className="c-bg">{l}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 c-s1 border c-br rounded-lg p-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "c-tx4 hc-tx2"}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "c-tx4 hc-tx2"}`}><List size={14} /></button>
          </div>

          {canUpload && (
            <button onClick={() => openUploadModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors whitespace-nowrap">
              <Upload size={14} /> Upload
            </button>
          )}
          {isAdmin && (
            <a href="/dashboard/config" className="p-2 rounded-lg c-s1 border c-br c-tx4 hover:c-tx transition-colors" title="Configurações"><Settings size={16} /></a>
          )}
        </div>

        {/* Contagem */}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-xs c-tx5">{filtered.length} ficheiro{filtered.length !== 1 ? "s" : ""} {activeCategory !== "Geral" ? `em ${activeCategory}` : ""}</p>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl c-s1 border c-br flex items-center justify-center">
              <FolderOpen size={26} className="c-tx5" strokeWidth={1} />
            </div>
            <div>
              <p className="text-sm font-medium c-tx3">Pasta vazia</p>
              <p className="text-xs c-tx5 mt-1">{canUpload ? "Arrasta um ficheiro ou clica em Upload." : "Sem ficheiros nesta categoria."}</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRELHA ── */
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((f, i) => {
                  const { Icon, bg, text, label, accent } = getFileStyle(f.nome_arquivo, f.tipo);
                  const isOwner = f.uploader_id === user?.id;
                  const canAct = isOwner || isAdmin;
                  const fileUrl = f.nome_arquivo ? `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}` : "#";
                  return (
                    <motion.div key={f.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.02 }}
                      className="group c-bg2 border c-br rounded-2xl overflow-hidden hover:border-white/[0.15] hover:shadow-lg transition-all flex flex-col">

                      {/* Thumbnail — clicável (div, não <a>, para poder conter botões sem HTML inválido) */}
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
                        onKeyDown={e => { if (e.key === "Enter") window.open(fileUrl, "_blank", "noopener,noreferrer"); }}
                        className={`block relative overflow-hidden cursor-pointer ${f.thumbnail_url ? "bg-white" : ""}`} style={{ aspectRatio: "640/905" }}>
                        {f.thumbnail_url ? (
                          <>
                            <img src={f.thumbnail_url} alt={f.label} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                            {isBrandedCapa(f.thumbnail_url) && (
                              <p className="absolute left-[8%] right-[8%] top-[20%] text-slate-800 font-semibold leading-tight line-clamp-2 text-[9px] sm:text-[10px] md:text-xs">
                                {f.label}
                              </p>
                            )}
                          </>
                        ) : label === "PDF" ? (
                          <embed src={fileUrl} type="application/pdf" className="w-full h-full pointer-events-none" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${bg}`}>
                            <Icon size={44} className={`${text} opacity-40`} />
                          </div>
                        )}

                        {/* Accent top bar */}
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />

                        {/* Type badge */}
                        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm" style={{ color: accent }}>
                          {label}
                        </span>

                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors c-tx"
                            title="Abrir">
                            <ExternalLink size={15} />
                          </a>
                          {canAct && (
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); openEditModal(f); }}
                              className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors c-tx" title="Editar / datas">
                              <Settings size={15} />
                            </button>
                          )}
                          {canAct && (
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(f.id, f.label ?? f.nome_arquivo ?? "ficheiro"); }}
                              className="p-2.5 rounded-xl bg-red-500/30 backdrop-blur-sm hover:bg-red-500/50 transition-colors text-red-300" title="Eliminar">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info — compacta */}
                      <div className="px-2.5 py-1.5 flex flex-col gap-0.5">
                        <p className="text-[10px] c-tx font-medium truncate">{f.label}</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] c-tx5 truncate">{f.tamanho ?? "—"} · {formatDate(f.criado_em ?? f.created_at)}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <DisponibilidadeBadge disponivel_de={f.disponivel_de} disponivel_ate={f.disponivel_ate} />
                            <VisibilidadeBadge v={f.visibilidade ?? "publico"} small acaoNome={f.acao_formacao_id ? acoesNomes[f.acao_formacao_id] : undefined} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ── LISTA ── */
          <div className="flex-1 overflow-y-auto">
            <div className="c-bg2 border c-br rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b c-br">
                      {(["nome","area","tamanho","data"] as const).map((col, i) => (
                        <th key={col} onClick={() => toggleSort(col)}
                          className={`text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer select-none transition-colors hover:c-tx2 ${sortCol === col ? "c-tx2" : "c-tx5"} ${i === 1 ? "hidden sm:table-cell" : i === 2 ? "hidden md:table-cell" : i === 3 ? "hidden lg:table-cell" : ""}`}>
                          <span className="flex items-center gap-1">
                            {["Nome","Área","Tamanho","Data"][i]}
                            <ArrowUpDown size={10} className="opacity-40" />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider c-tx5">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => {
                      const { Icon, bg, text } = getFileStyle(f.nome_arquivo, f.tipo);
                      const isOwner = f.uploader_id === user?.id;
                      const canAct = isOwner || isAdmin;
                      const fileUrl = f.nome_arquivo ? `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}` : "#";
                      return (
                        <tr key={f.id} className="border-b c-br hover:bg-white/[0.02] transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                                <Icon size={15} className={text} />
                              </div>
                              <div className="min-w-0">
                                <p className="c-tx2 font-medium truncate max-w-[200px] text-sm">{f.label}</p>
                                <DisponibilidadeBadge disponivel_de={f.disponivel_de} disponivel_ate={f.disponivel_ate} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 c-tx4 text-sm hidden sm:table-cell">{f.area}</td>
                          <td className="px-4 py-3 c-tx5 text-xs hidden md:table-cell">{f.tamanho ?? "—"}</td>
                          <td className="px-4 py-3 c-tx5 text-xs hidden lg:table-cell">{formatDate(f.criado_em ?? f.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg c-tx4 hover:c-tx hc-s2 transition-colors" title="Abrir">
                                <Download size={14} />
                              </a>
                              {canAct && (
                                <>
                                  <button onClick={() => openEditModal(f)} className="p-1.5 rounded-lg c-tx4 hover:c-tx hc-s2 transition-colors" title="Editar"><Pencil size={14} /></button>
                                  <button onClick={() => handleDelete(f.id, f.label ?? "ficheiro")} className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Drag & drop overlay ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed border-blue-500/60 bg-blue-500/10">
              <Upload size={48} className="text-blue-400 animate-bounce" />
              <p className="text-lg font-semibold text-blue-300">Largar para fazer upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal upload ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="c-bg border c-br c-tx max-w-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b c-br">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Upload size={15} className="text-blue-400" /> Novo ficheiro
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Título *</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Guia Pedagógico III"
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Ficheiro *</label>
                <label className="flex items-center gap-2 border border-dashed c-br rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500/40 transition-colors">
                  <input type="file" required onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} className="sr-only" />
                  <Upload size={14} className="c-tx5 shrink-0" />
                  <p className="text-sm c-tx3 truncate">{uploadFile ? uploadFile.name : "Seleccionar ficheiro"}</p>
                </label>
                {thumbnailPreview && <embed src={thumbnailPreview} type="application/pdf" className="w-full h-16 rounded pointer-events-none mt-1" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Disciplina</label>
                {uploadAreaLocked ? (
                  <div className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx3 flex items-center justify-between">
                    <span>{uploadAreas![0]}</span><Lock size={11} className="c-tx5" />
                  </div>
                ) : (
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none">
                    {uploadCategoryOptions.map(c => <option key={c} value={c} className="c-bg">{c}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Grupos</label>
                {gruposFormacao.length === 0 ? <p className="text-xs c-tx5 italic pt-2">Nenhum grupo criado</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {gruposFormacao.map(g => {
                      const sel = gruposUpload.includes(g.id);
                      return (
                        <button key={g.id} type="button" onClick={() => setGruposUpload(prev => sel ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${sel ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : "c-s1 c-tx3 c-br hc-s2"}`}>
                          {g.nome}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3 flex items-center justify-between">
                <span>Capa (opcional)</span>
                {selectedCapa && (
                  <button type="button" onClick={() => setSelectedCapa(null)} className="text-[10px] c-tx4 hc-tx">Remover</button>
                )}
              </label>
              <div className="flex gap-2">
                {capaOptions.map(opt => (
                  <button key={opt.url} type="button" onClick={() => setSelectedCapa(opt.url)}
                    className={`relative w-24 h-[72px] rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${selectedCapa === opt.url ? "border-blue-500" : "border-transparent hover:border-white/20"}`}>
                    <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate px-1">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] c-tx5">Se não escolher, é usada a pré-visualização automática do ficheiro.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3">Visibilidade</label>
              <div className={"grid gap-2 grid-cols-3"}>
                {VISIBILIDADE_OPTIONS.filter(opt => {
                  if (opt.value === "turma" || opt.value === "formadores_turma") return false;
                  if (opt.value === "acao_formacao" || opt.value === "formadores_acao") return false;
                  return true;
                }).map(opt => {
                  const Icon = opt.icon;
                  const sel = visibilidade === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setVisibilidade(opt.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all ${sel ? "border-blue-500/50 bg-blue-500/10" : "c-br c-s1 hc-s2"}`}>
                      <Icon size={14} className={sel ? "text-blue-400" : "c-tx4"} />
                      <span className={`text-[10px] font-medium ${sel ? "text-blue-300" : "c-tx3"}`}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {(visibilidade === "acao_formacao" || visibilidade === "formadores_acao") && minhasAcoes.length > 0 && (
                <select value={acaoFormacaoId} onChange={e => setAcaoFormacaoId(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none">
                  {minhasAcoes.map(a => <option key={a.id} value={a.id} className="c-bg">{a.designacao}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3 flex items-center gap-1.5"><CalendarClock size={11} /> Disponibilidade (opcional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><span className="text-[10px] c-tx4">A partir de</span>
                  <input type="date" value={disponivel_de} onChange={e => setDisponivelDe(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx2 outline-none focus:border-blue-500/50 [color-scheme:dark]" /></div>
                <div className="space-y-1"><span className="text-[10px] c-tx4">Expira em</span>
                  <input type="date" value={disponivel_ate} onChange={e => setDisponivelAte(e.target.value)} min={disponivel_de || undefined} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx2 outline-none focus:border-blue-500/50 [color-scheme:dark]" /></div>
              </div>
            </div>
            {visibilidade === "publico" && (
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border c-br hc-s1 transition-colors">
                <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${sitePublico ? "bg-emerald-500" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sitePublico ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <input type="checkbox" className="sr-only" checked={sitePublico} onChange={e => setSitePublico(e.target.checked)} />
                <div><p className="text-xs font-medium c-tx">Partilhar no site público</p><p className="text-[10px] c-tx4">Visível em sabermais.edu.ao/recursos</p></div>
              </label>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
              <button type="submit" disabled={isUploading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isUploading ? <><Loader2 size={14} className="animate-spin" /> A enviar...</> : <><Upload size={13} /> Guardar</>}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal edição ── */}
      <Dialog open={!!editingFile} onOpenChange={o => { if (!o) setEditingFile(null); }}>
        <DialogContent className="c-bg border c-br c-tx max-w-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b c-br">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2"><Pencil size={15} className="text-blue-400" /> Editar ficheiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs c-tx3">Título *</label>
              <input required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none focus:border-blue-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Disciplina</label>
                <select value={editArea} onChange={e => setEditArea(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none">
                  {allCatNames.map(c => <option key={c} value={c} className="c-bg">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Grupos</label>
                {gruposFormacao.length === 0 ? <p className="text-xs c-tx5 italic pt-2">Nenhum grupo</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {gruposFormacao.map(g => {
                      const sel = editGrupos.includes(g.id);
                      return (
                        <button key={g.id} type="button" onClick={() => setEditGrupos(prev => sel ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                          className={`px-2 py-1 rounded-lg text-[11px] border transition-colors ${sel ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : "c-s1 c-tx3 c-br hc-s2"}`}>
                          {g.nome}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3 flex items-center justify-between">
                <span>Capa (opcional)</span>
                {editCapa && (
                  <button type="button" onClick={() => { setEditCapa(null); setEditCapaTouched(true); }} className="text-[10px] c-tx4 hc-tx">Remover</button>
                )}
              </label>
              <div className="flex gap-2">
                {editCapaOptions.map(opt => (
                  <button key={opt.url} type="button" onClick={() => { setEditCapa(opt.url); setEditCapaTouched(true); }}
                    className={`relative w-24 h-[72px] rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${editCapa === opt.url ? "border-blue-500" : "border-transparent hover:border-white/20"}`}>
                    <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate px-1">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] c-tx5">Se não escolher, mantém-se a capa atual do ficheiro.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3">Visibilidade</label>
              <div className={"grid gap-2 grid-cols-3"}>
                {VISIBILIDADE_OPTIONS.filter(opt => {
                  if (opt.value === "turma" || opt.value === "formadores_turma") return false;
                  if (opt.value === "acao_formacao" || opt.value === "formadores_acao") return false;
                  return true;
                }).map(opt => {
                  const Icon = opt.icon;
                  const sel = editVisibilidade === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setEditVisibilidade(opt.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all ${sel ? "border-blue-500/50 bg-blue-500/10" : "c-br c-s1 hc-s2"}`}>
                      <Icon size={14} className={sel ? "text-blue-400" : "c-tx4"} />
                      <span className={`text-[10px] font-medium ${sel ? "text-blue-300" : "c-tx3"}`}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {(editVisibilidade === "acao_formacao" || editVisibilidade === "formadores_acao") && minhasAcoes.length > 0 && (
                <select value={editAcaoFormacaoId} onChange={e => setEditAcaoFormacaoId(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx outline-none">
                  {minhasAcoes.map(a => <option key={a.id} value={a.id} className="c-bg">{a.designacao}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs c-tx3 flex items-center gap-1.5"><CalendarClock size={11} /> Disponibilidade (opcional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><span className="text-[10px] c-tx4">A partir de</span>
                  <input type="date" value={editDisponivelDe} onChange={e => setEditDisponivelDe(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx2 outline-none focus:border-blue-500/50 [color-scheme:dark]" /></div>
                <div className="space-y-1"><span className="text-[10px] c-tx4">Expira em</span>
                  <input type="date" value={editDisponivelAte} onChange={e => setEditDisponivelAte(e.target.value)} min={editDisponivelDe || undefined} className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx2 outline-none focus:border-blue-500/50 [color-scheme:dark]" /></div>
              </div>
            </div>
            {editVisibilidade === "publico" && (
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border c-br hc-s1 transition-colors">
                <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${editSitePublico ? "bg-emerald-500" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editSitePublico ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <input type="checkbox" className="sr-only" checked={editSitePublico} onChange={e => setEditSitePublico(e.target.checked)} />
                <div><p className="text-xs font-medium c-tx">Partilhar no site público</p><p className="text-[10px] c-tx4">Visível em sabermais.edu.ao/recursos</p></div>
              </label>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditingFile(null)} className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
              <button type="submit" disabled={isSavingEdit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSavingEdit ? <><Loader2 size={14} className="animate-spin" /> A guardar...</> : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
