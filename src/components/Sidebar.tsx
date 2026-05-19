"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, CalendarDays, FolderOpen, 
  LogOut, Home, UserCog, ShieldCheck, Zap, X 
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasMission, setHasMission] = useState(false);
  const [missionInfo, setMissionInfo] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let channel: any;

    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role, delegated_module, delegation_expiry')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        processMission(data);
        setUserRole(data.role);
      }

      channel = supabase.channel(`profile-changes-${user.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', table: 'profiles', schema: 'public', filter: `id=eq.${user.id}` },
          (payload) => {
            const newData = payload.new;
            processMission(newData);
            if (newData.delegated_module && !showToast) {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 8000); 
            }
          }
        ).subscribe();
    }

    function processMission(data: any) {
      const now = new Date();
      const expiry = data.delegation_expiry ? new Date(data.delegation_expiry) : null;
      const isActive = data.delegated_module && expiry && expiry > now;
      
      setHasMission(!!isActive);
      setMissionInfo(isActive ? data : null);
    }

    getUserData();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [pathname]);

  // Nomes actualizados para reflectir a sua interface
  const menu = [
    { name: "Radar", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Repositório", href: "/dashboard/repositorio", icon: FolderOpen },
    { name: "Perfil", href: "/dashboard/definicoes", icon: UserCog },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* TOAST DE NOTIFICAÇÃO DE MISSÃO */}
      <AnimatePresence>
        {showToast && missionInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 40, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed left-1/2 z-[200] w-full max-w-md px-6"
          >
            <div className="bg-black/80 backdrop-blur-3xl border border-orange-500/30 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(249,115,22,0.2)] flex items-center gap-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 animate-pulse">
                <Zap size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-black mb-1">Nova Missão Delegada</p>
                <p className="text-white text-xs font-light leading-relaxed">
                  Recebeu acesso temporário ao módulo <span className="font-bold text-orange-200 uppercase">{missionInfo.delegated_module}</span>.
                </p>
              </div>
              <button onClick={() => setShowToast(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR DE LARGURA FIXA E SÓBRIA --- */}
      <aside className="fixed left-6 top-6 bottom-6 z-[100] w-[80px] bg-black/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3rem] flex flex-col py-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* INDICADOR DE STATUS */}
        <div className="flex justify-center mb-10 shrink-0">
           <div className={`w-2 h-2 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] 
             ${userRole === 'super-admin' ? 'bg-blue-500' : hasMission ? 'bg-orange-500 animate-pulse shadow-[0_0_15px_#f97316]' : 'bg-green-500'}`} 
           />
        </div>

        {/* BOTÃO NOVO: REGRESSO À HERO (PORTAL) */}
        <div className="w-full mb-8 shrink-0 flex flex-col items-center">
          <button 
            onClick={() => router.push("/")} 
            className="w-full h-14 relative flex items-center justify-center outline-none group"
          >
            <Home size={20} strokeWidth={1.5} className="text-white/30 group-hover:text-blue-400 transition-colors duration-300" />
            
            {/* Legenda Pura Flutuante */}
            <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center">
              <span className="text-[10px] uppercase tracking-[0.4em] font-light text-blue-400 drop-shadow-md whitespace-nowrap">
                Portal
              </span>
            </div>
          </button>
          {/* Divisória */}
          <div className="w-6 h-[1px] bg-white/10 mt-6" />
        </div>

        {/* MENU PRINCIPAL */}
        <nav className="flex-1 w-full flex flex-col items-center space-y-4">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button 
                key={item.name} 
                onClick={() => router.push(item.href)} 
                className="w-full h-14 relative flex items-center justify-center outline-none group"
              >
                {/* Indicador de Actividade */}
                {isActive && (
                  <motion.div layoutId="activeIndicator" className="absolute left-0 w-[3px] h-6 bg-white/40 rounded-r-full" />
                )}
                
                <item.icon size={20} strokeWidth={isActive ? 1.5 : 1} className={`transition-colors duration-300 ${isActive ? "text-white" : "text-white/30 group-hover:text-white/70"}`} />
                
                {/* Legenda Pura Flutuante */}
                <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-light text-white/60 drop-shadow-md whitespace-nowrap">
                    {item.name}
                  </span>
                </div>
              </button>
            );
          })}

          {/* BOTÃO OPERACIONAL / CONTROLO */}
          {(userRole === 'super-admin' || userRole === 'formador' || hasMission) && (
            <div className="w-full pt-4 mt-2">
              <button 
                onClick={() => router.push("/dashboard/admin")} 
                className="w-full h-14 relative flex items-center justify-center outline-none group"
              >
                {pathname === '/dashboard/admin' && (
                  <motion.div layoutId="activeIndicator" className="absolute left-0 w-[3px] h-6 bg-blue-500 rounded-r-full" />
                )}
                
                {hasMission && userRole !== 'super-admin' 
                  ? <Zap size={20} strokeWidth={1.5} className={`transition-colors duration-300 animate-pulse ${pathname === '/dashboard/admin' ? 'text-orange-500' : 'text-orange-500/50 group-hover:text-orange-400'}`} /> 
                  : <ShieldCheck size={20} strokeWidth={1.5} className={`transition-colors duration-300 ${pathname === '/dashboard/admin' ? 'text-blue-500' : 'text-blue-500/30 group-hover:text-blue-400'}`} />
                }

                {/* Legenda Pura Flutuante */}
                <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center">
                  <span className={`text-[10px] uppercase tracking-[0.4em] font-light drop-shadow-md whitespace-nowrap ${hasMission && userRole !== 'super-admin' ? 'text-orange-400/70' : 'text-blue-400/70'}`}>
                    {hasMission && userRole !== 'super-admin' ? 'Missão' : 'Controlo'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </nav>

        {/* LOGOUT */}
        <div className="w-full mt-auto shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full h-14 relative flex items-center justify-center outline-none group"
          >
            <LogOut size={20} strokeWidth={1} className="text-white/20 group-hover:text-red-400/80 transition-colors duration-300" />
            
            <div className="absolute left-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-red-400/70 drop-shadow-md whitespace-nowrap">
                Sair
              </span>
            </div>
          </button>
        </div>
        
      </aside>
    </>
  );
}