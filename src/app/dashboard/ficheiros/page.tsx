"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import {
  FileText, Video, Search, Download, Loader2, Plus, FolderOpen, Lock,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

/*
  Controlo de acesso por especialização:
  - admin  → vê e faz upload para todas as categorias
  - formador com especialização → só vê "Geral" + as suas áreas; upload restrito às suas áreas
  - formador sem especialização / formando → vê tudo, sem restrição de upload
  A especialização é guardada em profiles.specialization como JSON array (ex: '["Matemática","Física"]')
  ou como string simples (formato antigo). parseSpecializations() lida com ambos.
*/

/** Parse seguro: aceita JSON array ["Mat","Fís"] ou string simples "Mat" */
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
  if (role === "admin") return null; // null = admin escolhe livremente entre tudo
  const areas = parseSpecializations(specialization);
  return role === "formador" && areas.length > 0 ? areas : null;
}

export default function FicheirosPage() {
  const { user } = useAdminUser();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Geral");

  const canUpload = user?.role === "admin" || user?.role === "formador";

  const visibleCategories = useMemo(
    () => getVisibleCategories(user?.role, user?.specialization),
    [user?.role, user?.specialization]
  );

  // Áreas permitidas para upload (null = admin, array = formador restrito)
  const uploadAreas = useMemo(
    () => getUploadAreas(user?.role, user?.specialization),
    [user?.role, user?.specialization]
  );

  const isRestricted = user?.role === "formador" && uploadAreas !== null;

  const [activeCategory, setActiveCategory] = useState("Geral");

  useEffect(() => {
    if (user && !visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0] ?? "Geral");
    }
  }, [visibleCategories, user]);

  function openUploadModal() {
    // Pré-selecciona: se tiver áreas restritas, a primeira delas; senão a aba activa
    setUploadCategory(uploadAreas?.[0] ?? activeCategory);
    setIsModalOpen(true);
  }

  async function fetchFiles() {
    const res = await fetch("/api/db/arquivos?orderBy=created_at&ascending=false");
    const { data } = await res.json();
    setFiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchFiles(); }, []);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const inScope = visibleCategories.includes(f.area);
      const matchCat = f.area === activeCategory;
      const matchSearch = f.label?.toLowerCase().includes(search.toLowerCase());
      return inScope && matchCat && matchSearch;
    });
  }, [files, activeCategory, search, visibleCategories]);

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

      // Garante que a área registada está dentro das áreas permitidas
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
        }),
      });
      if (!dbRes.ok) throw new Error("Erro ao registar o ficheiro.");

      setIsModalOpen(false);
      setTitle("");
      setUploadFile(null);
      fetchFiles();
    } catch (err: any) {
      alert(err.message ?? "Erro desconhecido.");
    } finally {
      setIsUploading(false);
    }
  }

  // Opções de área no modal de upload
  const uploadCategoryOptions = uploadAreas ?? CATEGORIES;
  const uploadAreaLocked = uploadAreas?.length === 1; // 1 especialização = bloqueado

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
          {canUpload && (
            <button
              onClick={openUploadModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors"
            >
              <Plus size={14} /> Upload
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-2 flex-wrap">
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70"
            }`}
          >
            {cat}
          </button>
        ))}
        {isRestricted && (
          <span className="px-3 py-1.5 rounded-lg text-xs text-white/20 border border-white/[0.04] flex items-center gap-1.5 cursor-default select-none">
            <Lock size={10} /> {CATEGORIES.length - visibleCategories.length} área{CATEGORIES.length - visibleCategories.length !== 1 ? "s" : ""} sem acesso
          </span>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Nome</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden sm:table-cell">Área</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden md:table-cell">Tipo</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden md:table-cell">Tamanho</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden lg:table-cell">Data</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const ext = f.nome_arquivo?.split(".").pop()?.toUpperCase() ?? "—";
                  const isVideo = f.tipo === "video";
                  const fileUrl = f.nome_arquivo
                    ? `/storage/v1/object/public/materiais/${encodeURIComponent(f.nome_arquivo)}`
                    : "#";
                  return (
                    <tr key={f.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isVideo ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
                            {isVideo ? <Video size={14} /> : <FileText size={14} />}
                          </div>
                          <div>
                            <p className="text-white/80 font-medium truncate max-w-[180px]">{f.label}</p>
                            <p className="text-[10px] text-white/30 font-mono">{ext}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/40 hidden sm:table-cell">{f.area}</td>
                      <td className="px-5 py-3 text-white/40 hidden md:table-cell capitalize">{f.tipo ?? "—"}</td>
                      <td className="px-5 py-3 text-white/40 hidden md:table-cell">{f.tamanho ?? "—"}</td>
                      <td className="px-5 py-3 text-white/40 hidden lg:table-cell">{formatDate(f.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <Download size={13} /> Abrir
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Guia Pedagógico III"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors"
              />
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
                // 1 especialização: campo bloqueado
                <div className="w-full bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5 text-sm text-white/50 flex items-center justify-between cursor-not-allowed">
                  <span>{uploadAreas![0]}</span>
                  <Lock size={12} className="text-white/20" />
                </div>
              ) : (
                // admin ou formador com várias áreas: dropdown restrito às suas áreas
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                >
                  {uploadCategoryOptions.map((c) => (
                    <option key={c} value={c} className="bg-[#0d0d14]">{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40">Ficheiro</label>
              <label className="relative flex flex-col items-center justify-center gap-2 border border-dashed border-white/[0.10] rounded-lg p-8 cursor-pointer hover:border-blue-500/40 transition-colors">
                <input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Download size={20} className="text-white/20" />
                <p className="text-xs text-white/40 text-center">
                  {uploadFile ? uploadFile.name : "Arraste ou clique para seleccionar"}
                </p>
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
