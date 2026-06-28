"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  FileText, Video, Search, Download, Loader2, Plus, FolderOpen, Lock,
  Globe, Users, GraduationCap, LayoutGrid, List, ExternalLink,
  FileImage, FileVideo, FileArchive, File, Trash2, ImagePlus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];

const VISIBILIDADE_OPTIONS = [
  { value: "privado",           label: "Só eu",              icon: Lock,          color: "text-white/40",    roles: ["formador", "admin"] },
  { value: "turma",             label: "Minha turma",        icon: GraduationCap, color: "text-amber-400",   roles: ["formador"] },
  { value: "formadores",        label: "Formadores",         icon: Users,         color: "text-blue-400",    roles: ["formador", "admin"] },
  { value: "formadores_turma",  label: "Formadores + Turma", icon: Users,         color: "text-purple-400",  roles: ["formador"] },
  { value: "publico",           label: "Todos",              icon: Globe,         color: "text-emerald-400", roles: ["formador", "admin"] },
];

function VisibilidadeBadge({ v, small }: { v: string; small?: boolean }) {
  const opt = VISIBILIDADE_OPTIONS.find(o => o.value === v) ?? VISIBILIDADE_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1 ${small ? "text-[9px]" : "text-[10px]"} ${opt.color}`}>
      <Icon size={small ? 9 : 10} /> {opt.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function getFileStyle(nome?: string, tipo?: string) {
  const ext = nome?.split(".").pop()?.toLowerCase() ?? "";
  if (tipo === "video" || ["mp4","mov","avi","mkv"].includes(ext))
    return { Icon: FileVideo,   bg: "bg-orange-500/10", text: "text-orange-400",  label: "Vídeo" };
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext))
    return { Icon: FileImage,   bg: "bg-pink-500/10",   text: "text-pink-400",    label: ext.toUpperCase() };
  if (["zip","rar","7z"].includes(ext))
    return { Icon: FileArchive, bg: "bg-yellow-500/10", text: "text-yellow-400",  label: ext.toUpperCase() };
  if (ext === "pdf")
    return { Icon: FileText,    bg: "bg-red-500/10",    text: "text-red-400",     label: "PDF" };
  if (["doc","docx"].includes(ext))
    return { Icon: FileText,    bg: "bg-blue-500/10",   text: "text-blue-400",    label: "Word" };
  if (["ppt","pptx"].includes(ext))
    return { Icon: FileText,    bg: "bg-orange-500/10", text: "text-orange-400",  label: "PPT" };
  if (["xls","xlsx"].includes(ext))
    return { Icon: FileText,    bg: "bg-emerald-500/10","text": "text-emerald-400", label: "Excel" };
  return { Icon: File,          bg: "bg-white/[0.06]",  text: "text-white/40",    label: ext.toUpperCase() || "—" };
}

function parseSpecializations(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s: string) => CATEGORIES.includes(s));
  } catch {}
  return CATEGORIES.includes(raw) ? [raw] : [];
}

function getVisibleCategories(role?: string, specialization?: string): string[] {
  if (role === "admin") return CATEGORIES;
  const areas = parseSpecializations(specialization);
  if (role === "formador" && areas.length > 0) return ["Geral", ...areas];
  return CATEGORIES;
}

function getUploadAreas(role?: string, specialization?: string): string[] | null {
  if (role === "admin") return null;
  const areas = parseSpecializations(specialization);
  return role === "formador" && areas.length > 0 ? ["Geral", ...areas] : null;
}

export default function FicheirosPage() {
  const { user } = useAdminUser();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Geral");
  const [visibilidade, setVisibilidade] = useState("publico");
  const [turmaId, setTurmaId] = useState<string>("");
  const [minhasTurmas, setMinhasTurmas] = useState<{ id: string; nome: string; area: string }[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [generatingThumbs, setGeneratingThumbs] = useState(false);
  const [thumbProgress, setThumbProgress] = useState<{ done: number; total: number } | null>(null);

  const canUpload = user?.role === "admin" || user?.role === "formador";

  const visibleCategories = useMemo(
    () => getVisibleCategories(user?.role, user?.specialization),
    [user?.role, user?.specialization]
  );

  const showGeral = true;
  const uploadAreas = useMemo(
    () => getUploadAreas(user?.role, user?.specialization),
    [user?.role, user?.specialization]
  );
  const isRestricted = user?.role === "formador" && uploadAreas !== null;

  function openUploadModal() {
    setTitle("");
    setUploadFile(null);
    setThumbnailPreview(null);
    setVisibilidade("publico");
    setTurmaId(minhasTurmas[0]?.id ?? "");
    setUploadCategory(uploadAreas?.[0] ?? activeCategory);
    setIsModalOpen(true);
  }

  async function handleGenerateMissingThumbnails() {
    setGeneratingThumbs(true);
    setThumbProgress(null);
    try {
      const res = await fetch("/api/arquivos/gerar-thumbnails");
      const { ficheiros } = await res.json();
      if (!ficheiros?.length) { setGeneratingThumbs(false); return; }

      const { generatePdfThumbnail } = await import("@/lib/pdf-thumbnail");
      setThumbProgress({ done: 0, total: ficheiros.length });

      let ok = 0;
      for (let i = 0; i < ficheiros.length; i++) {
        const f = ficheiros[i];
        try {
          const fileUrl = `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}`;
          const fileRes = await fetch(fileUrl);
          if (!fileRes.ok) { console.warn("[thumb] ficheiro não encontrado:", f.nome_arquivo); continue; }

          const blob = await fileRes.blob();
          const pdfFile = new File([blob], f.nome_arquivo, { type: "application/pdf" });
          const thumbBlob = await generatePdfThumbnail(pdfFile);
          if (!thumbBlob) { console.warn("[thumb] falhou renderizar:", f.nome_arquivo); continue; }

          const thumbName = `thumb_${f.id}.jpg`;
          const thumbForm = new FormData();
          thumbForm.append("bucket", "materiais");
          thumbForm.append("path", `thumbnails/${thumbName}`);
          thumbForm.append("upsert", "true");
          thumbForm.append("file", new File([thumbBlob], thumbName, { type: "image/jpeg" }));
          const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: thumbForm });
          if (!uploadRes.ok) { console.warn("[thumb] upload falhou:", await uploadRes.text()); continue; }

          const thumbnailUrl = `/storage/v1/object/public/materiais/thumbnails/${thumbName}`;
          const patchRes = await fetch("/api/arquivos/gerar-thumbnails", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: f.id, thumbnail_url: thumbnailUrl }),
          });
          if (patchRes.ok) ok++;
          else console.warn("[thumb] patch falhou:", await patchRes.text());
        } catch (err) {
          console.error("[thumb] erro:", err);
        }
        setThumbProgress({ done: i + 1, total: ficheiros.length });
      }
      alert(`Capas geradas: ${ok}/${ficheiros.length}`);
      fetchFiles();
    } finally {
      setGeneratingThumbs(false);
      setThumbProgress(null);
    }
  }

  function handleFileSelect(file: File) {
    setUploadFile(file);
    setThumbnailPreview(null);
    if (file.type === "application/pdf") {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }

  async function fetchFiles() {
    try {
      const res = await fetch("/api/db/arquivos?orderBy=created_at&ascending=false");
      const json = await res.json();
      const rows = json?.data ?? json;
      setFiles(Array.isArray(rows) ? rows : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    // Definir categoria activa inicial
    setActiveCategory("Geral");
  }, [user?.role, user?.specialization]);

  useEffect(() => {
    fetchFiles();
    if (user?.role === "formador") {
      fetch("/api/turmas").then(r => r.json()).then(json => {
        const todas = json.data ?? [];
        setMinhasTurmas(todas.filter((t: any) => t.formador_id === user.id));
      });
    }
  }, [user?.id, user?.role]);

  // Filtro: visibilidade + categoria + search
  const filtered = useMemo(() => {
    return files.filter((f) => {
      // Controlo de visibilidade
      const isOwner = f.uploader_id === user?.id;
      const isAdmin = user?.role === "admin" || user?.role === "super-admin";
      const isFormador = user?.role === "formador";

      if (!isAdmin && !isOwner) {
        if (f.visibilidade === "privado") return false;
        if (f.visibilidade === "formadores" && !isFormador) return false;
      }

      // Categoria
      if (!visibleCategories.includes(f.area)) return false;
      if (activeCategory !== "Geral" && f.area !== activeCategory) return false;

      // Pesquisa
      if (search && !f.label?.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [files, search, activeCategory, visibleCategories, user]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !title) return;
    setIsUploading(true);
    try {
      const sanitized = uploadFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${Date.now()}_${sanitized}`;
      const form = new FormData();
      form.append("bucket", "materiais");
      form.append("path", fileName);
      form.append("file", uploadFile);
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Erro no upload do ficheiro.");

      const areaFinal = uploadAreas && !uploadAreas.includes(uploadCategory)
        ? uploadAreas[0]
        : uploadCategory;

      const dbRes = await fetch("/api/db/arquivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: title,
          nome_arquivo: fileName,
          area: areaFinal,
          tamanho: (uploadFile.size / (1024 * 1024)).toFixed(2) + " MB",
          tipo: uploadFile.type.includes("video") ? "video" : "pdf",
          visibilidade,
          ...(visibilidade === "turma" && turmaId ? { turma_id: turmaId } : {}),
        }),
      });
      if (!dbRes.ok) throw new Error("Erro ao registar o ficheiro.");

      setIsModalOpen(false);
      setThumbnailPreview(null);
      fetchFiles();
    } catch (err: any) {
      alert(err.message ?? "Erro desconhecido.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Eliminar "${nome}"? Esta acção não pode ser desfeita.`)) return;
    try {
      await fetch(`/api/db/arquivos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eq: { id } }),
      });
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch {
      alert("Erro ao eliminar o ficheiro.");
    }
  }

  async function handleVisibilidadeChange(id: string, newVis: string) {
    setUpdatingId(id);
    try {
      await fetch(`/api/db/arquivos?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilidade: newVis }),
      });
      setFiles(prev => prev.map(f => f.id === id ? { ...f, visibilidade: newVis } : f));
    } finally {
      setUpdatingId(null);
    }
  }

  const uploadCategoryOptions = uploadAreas ?? CATEGORIES;
  const uploadAreaLocked = uploadAreas?.length === 1;

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white">Ficheiros</h2>
          <p className="text-sm text-white/40 mt-0.5">
            {filtered.length} ficheiro{filtered.length !== 1 ? "s" : ""}
            {isRestricted && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-400/70">
                <Lock size={10} /> restrito a {uploadAreas!.join(", ")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 w-48 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
              <List size={14} />
            </button>
          </div>
          {canUpload && (
            <button onClick={openUploadModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
              <Plus size={14} /> Upload
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-2 flex-wrap">
        {visibleCategories.filter(cat => showGeral || cat !== "Geral").map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FolderOpen size={22} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Sem ficheiros</p>
            <p className="text-xs text-white/30 mt-1">
              {canUpload ? "Clica em \"Upload\" para adicionar o primeiro ficheiro." : "Ainda não há ficheiros nesta categoria."}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRELHA ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((f) => {
            const { Icon, bg, text, label } = getFileStyle(f.nome_arquivo, f.tipo);
            const isOwner = f.uploader_id === user?.id;
            const isAdmin = user?.role === "admin" || user?.role === "super-admin";
            const canChangeVis = isOwner || isAdmin;
            const fileUrl = f.nome_arquivo
              ? `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}`
              : "#";
            return (
              <div key={f.id} className="group bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all flex flex-col">
                {/* Miniatura */}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className={`flex items-center justify-center h-28 relative overflow-hidden ${f.thumbnail_url ? "" : bg}`}>
                    {f.thumbnail_url ? (
                      <img src={f.thumbnail_url} alt={f.label} className="w-full h-full object-cover" />
                    ) : label === "PDF" ? (
                      <embed src={fileUrl} type="application/pdf" className="w-full h-full pointer-events-none" />
                    ) : (
                      <Icon size={40} className={`${text} opacity-60`} />
                    )}
                    <span className={`absolute bottom-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 ${text}`}>
                      {label}
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ExternalLink size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
                {/* Info */}
                <div className="px-3 py-2.5 flex flex-col gap-1.5 flex-1">
                  <p className="text-xs text-white/80 font-medium leading-tight line-clamp-2">{f.label}</p>
                  <p className="text-[10px] text-white/30">{f.area} · {f.tamanho ?? "—"} · {formatDate(f.created_at)}</p>
                  {canChangeVis ? (
                    <select
                      value={f.visibilidade ?? "publico"}
                      onChange={(e) => handleVisibilidadeChange(f.id, e.target.value)}
                      disabled={updatingId === f.id}
                      className="mt-auto bg-transparent border border-white/[0.06] rounded px-1.5 py-1 text-[10px] text-white/40 outline-none cursor-pointer hover:border-white/20 transition-colors w-full"
                    >
                      {VISIBILIDADE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#0d0d14]">{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-auto">
                      <VisibilidadeBadge v={f.visibilidade ?? "publico"} small />
                    </div>
                  )}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDelete(f.id, f.label ?? f.nome_arquivo ?? "ficheiro")}
                      className="mt-1 w-full flex items-center justify-center gap-1 py-1 rounded text-[10px] text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={10} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LISTA ── */
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Nome</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden sm:table-cell">Área</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden md:table-cell">Tamanho</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden lg:table-cell">Data</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Visibilidade</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const { Icon, bg, text } = getFileStyle(f.nome_arquivo, f.tipo);
                  const ext = f.nome_arquivo?.split(".").pop()?.toUpperCase() ?? "—";
                  const isOwner = f.uploader_id === user?.id;
                  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
                  const canChangeVis = isOwner || isAdmin;
                  const fileUrl = f.nome_arquivo
                    ? `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}`
                    : "#";
                  return (
                    <tr key={f.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${text}`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-white/80 font-medium truncate max-w-[180px]">{f.label}</p>
                            <p className="text-[10px] text-white/30 font-mono">{ext}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/40 hidden sm:table-cell">{f.area}</td>
                      <td className="px-5 py-3 text-white/40 hidden md:table-cell">{f.tamanho ?? "—"}</td>
                      <td className="px-5 py-3 text-white/40 hidden lg:table-cell">{formatDate(f.created_at)}</td>
                      <td className="px-5 py-3">
                        {canChangeVis ? (
                          <select value={f.visibilidade ?? "publico"}
                            onChange={(e) => handleVisibilidadeChange(f.id, e.target.value)}
                            disabled={updatingId === f.id}
                            className="bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white/60 outline-none cursor-pointer hover:border-white/20 transition-colors disabled:opacity-40">
                            {VISIBILIDADE_OPTIONS.map(o => (
                              <option key={o.value} value={o.value} className="bg-[#0d0d14]">{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <VisibilidadeBadge v={f.visibilidade ?? "publico"} small />
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                            <Download size={13} /> Abrir
                          </a>
                          {(isOwner || isAdmin) && (
                            <button
                              onClick={() => handleDelete(f.id, f.label ?? f.nome_arquivo ?? "ficheiro")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
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
      )}

      {/* Modal de upload */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0d0d14] border border-white/[0.08] text-white max-w-md rounded-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Plus size={16} className="text-blue-400" /> Registar novo ficheiro
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpload} className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Título</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Guia Pedagógico III"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40 flex items-center justify-between">
                <span>Área</span>
                {isRestricted && (
                  <span className="text-[10px] text-amber-400/70 flex items-center gap-1">
                    <Lock size={9} /> limitado pela especialização
                  </span>
                )}
              </label>
              {uploadAreaLocked ? (
                <div className="w-full bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5 text-sm text-white/50 flex items-center justify-between cursor-not-allowed">
                  <span>{uploadAreas![0]}</span><Lock size={12} className="text-white/20" />
                </div>
              ) : (
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors">
                  {uploadCategoryOptions.map((c) => (
                    <option key={c} value={c} className="bg-[#0d0d14]">{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Visibilidade */}
            <div className="space-y-2">
              <label className="text-xs text-white/40">Visibilidade</label>
              <div className={`grid gap-2 ${(user?.role === "formador" && minhasTurmas.length > 0) ? "grid-cols-4" : "grid-cols-3"}`}>
                {VISIBILIDADE_OPTIONS.filter(opt => {
                  if (opt.value === "turma" || opt.value === "formadores_turma")
                    return user?.role === "formador" && minhasTurmas.length > 0;
                  return true;
                }).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setVisibilidade(opt.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center transition-all ${
                        visibilidade === opt.value
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}>
                      <Icon size={16} className={visibilidade === opt.value ? "text-blue-400" : "text-white/30"} />
                      <span className={`text-[10px] font-medium ${visibilidade === opt.value ? "text-blue-300" : "text-white/40"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed">
                {visibilidade === "privado" && "Só você tem acesso a este documento."}
                {visibilidade === "turma" && "Apenas os formandos da turma seleccionada têm acesso."}
                {visibilidade === "formadores" && "Você e todos os formadores podem ver este documento."}
                {visibilidade === "formadores_turma" && "Formadores e os formandos da turma seleccionada podem ver este documento."}
                {visibilidade === "publico" && "Todos os utilizadores da plataforma podem ver este documento."}
              </p>
              {(visibilidade === "turma" || visibilidade === "formadores_turma") && minhasTurmas.length > 0 && (
                <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                  {minhasTurmas.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0d0d14]">{t.nome} ({t.area})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Ficheiro</label>
              <label className="relative flex flex-col items-center justify-center gap-2 border border-dashed border-white/[0.10] rounded-lg p-6 cursor-pointer hover:border-blue-500/40 transition-colors overflow-hidden">
                <input type="file" required onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                {thumbnailPreview ? (
                  <>
                    <embed src={thumbnailPreview} type="application/pdf" className="w-full h-32 rounded pointer-events-none" />
                    <p className="text-[10px] text-white/40 truncate max-w-full mt-1">{uploadFile?.name}</p>
                  </>
                ) : (
                  <>
                    <Download size={20} className="text-white/20" />
                    <p className="text-xs text-white/40 text-center">
                      {uploadFile ? uploadFile.name : "Arraste ou clique para seleccionar"}
                    </p>
                  </>
                )}
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isUploading}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isUploading ? <><Loader2 size={14} className="animate-spin" /> A enviar...</> : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
