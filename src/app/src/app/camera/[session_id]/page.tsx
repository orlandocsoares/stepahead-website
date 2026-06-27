"use client";

import { useState } from "react";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function MobileCameraPage() {
  const params = useParams();
  const sessionId = params?.session_id as string;
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setError(null);

    try {
      // 1. Upload para a nossa API de storage
      const form = new FormData();
      form.append("bucket", "avatars");
      form.append("path", `formadores/remote-${sessionId}-${Math.random()}.${file.name.split('.').pop()}`);
      form.append("file", file);

      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error ?? "Erro ao enviar foto");

      const imageUrl = `/storage/v1/object/public/avatars/${uploadData.data?.path ?? uploadData.path}`;

      // 2. Avisar o computador via SSE broadcast
      await fetch(`/api/sse/camera/${sessionId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "photo_captured", url: imageUrl }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <CheckCircle size={64} className="text-emerald-500 mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Sucesso!</h1>
        <p className="text-white/50 mt-4 text-[10px] uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
          Fotografia enviada. Pode fechar o telemóvel e olhar para o computador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white p-6 font-sans">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
        <Camera size={40} className="text-emerald-500" />
      </div>

      <h1 className="text-xl font-light uppercase tracking-[0.3em] text-center mb-4">Captura Remota</h1>
      <p className="text-white/40 text-[9px] text-center mb-16 max-w-xs uppercase tracking-[0.2em] leading-relaxed">
        Tire uma selfie com a sua câmara frontal para enviar directamente para o Portal.
      </p>

      {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}

      <label className="w-full max-w-xs py-6 bg-emerald-500 text-black font-black text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 rounded-[2rem] cursor-pointer hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        {uploading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Camera size={18} />
            Tirar Foto
          </>
        )}
        <input type="file" accept="image/*" capture="user" disabled={uploading} className="hidden" onChange={handleCapture} />
      </label>
    </div>
  );
}
