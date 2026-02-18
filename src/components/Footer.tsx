import { PROGRAM_INFO } from "@/lib/program-config";

export function Footer() {
  return (
    <footer className="py-20 bg-white border-t border-black/5">
      <div className="max-w-[1800px] mx-auto px-16 md:px-40 flex flex-col md:flex-row justify-between items-center gap-8 text-left">
        <div className="space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">{PROGRAM_INFO.name}</h2>
          <p className="text-[8px] text-black/30 font-bold uppercase tracking-widest">{PROGRAM_INFO.copyright}</p>
        </div>
        <div className="flex gap-8 items-center">
          <span className="text-[8px] font-black text-black/10 uppercase tracking-[0.5em]">Versão {PROGRAM_INFO.version}</span>
          <button className="text-[8px] font-black uppercase tracking-[0.4em] hover:text-black transition-colors">Suporte</button>
        </div>
      </div>
    </footer>
  );
}