"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, CheckCircle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function MobileCameraPage() {
  const params = useParams();
  const session_id = params.session_id as string;
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    // 1. Enviar a imagem para o Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `remote-${session_id}-${Math.random()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`formadores/${fileName}`, file);

    if (error) {
      alert("Erro ao enviar foto: " + error.message);
      setUploading(false);
      return;
    }

    // Gerar o link público da imagem
    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.path}`;

    // 2. Avisar o computador em tempo real que a foto chegou!
    const channel = supabase.channel(`camera-${session_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'photo_captured',
      payload: { url: imageUrl }
    });

    setSuccess(true);
    setUploading(false);
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white p-6 text-center font-sans">
        <CheckCircle size={64} className="text-emerald-500 mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Sucesso!</h1>
        <p className="text-white/50 mt-4 text-[10px] uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
          Fotografia processada. Pode voltar a olhar para o ecrã do seu computador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white p-6 font-sans overflow-hidden">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
        <Camera size={40} className="text-emerald-500" />
      </div>
      
      <h1 className="text-xl font-light uppercase tracking-[0.3em] text-center mb-4">Portal Saber Mais</h1>
      <p className="text-white/40 text-[9px] text-center mb-16 max-w-xs uppercase tracking-[0.2em] leading-relaxed">
        Modo de câmara remoto. Tire uma selfie ou escolha uma foto do seu dispositivo para o seu perfil de Formador.
      </p>

      <label className="w-full max-w-xs py-5 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 rounded-[2rem] cursor-pointer hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        {uploading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Camera size={18} />
            Capturar Fotografia
          </>
        )}
        {/* capture="user" força a abertura da câmara frontal no telemóvel */}
        <input type="file" accept="image/*" capture="user" disabled={uploading} className="hidden" onChange={handleCapture} />
      </label>
    </div>
  );
}