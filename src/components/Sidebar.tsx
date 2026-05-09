"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, CalendarDays, FolderOpen, 
  LogOut, Home, UserCog, ShieldCheck, Zap, BellRing, X 
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
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

      // 1. BUSCA INICIAL
      const { data } = await supabase
        .from('profiles')
        .select('role, delegated_module, delegation_expiry')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        processMission(data);
        setUserRole(data.role);
      }

      // 2. ESCUTA REALTIME (O segredo da notificação instantânea)
      channel = supabase.channel(`profile-changes-${user.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', table: 'profiles', schema: 'public', filter: `id=eq.${user.id}` },
          (payload) => {
            const newData = payload.new;
            processMission(newData);
            // Se uma nova missão foi atribuída agora
            if (newData.delegated_module && !showToast) {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 8000); // Esconde após 8 segundos
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

  const menu = [
    { name: "Portal Hero", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { name: "Arquivos", href: "/dashboard/repositorio", icon: FolderOpen },
    { name: "Perfil", href: "/dashboard/definicoes", icon: UserCog },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* --- TOAST DE NOTIFICAÇÃO (CRISTALIZADO) --- */}
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

      {/* --- SIDEBAR --- */}
      <motion.aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 260 : 80 }}
        className="fixed left-6 top-6 bottom-6 z-[100] bg-black/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3rem] flex flex-col py-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto"
      >
        {/* STATUS INDICATOR */}
        <div className="px-8 mb-16 flex items-center gap-5">
          <div className="relative flex items-center justify-center shrink-0">
             <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] 
               ${userRole === 'super-admin' ? 'bg-blue-500' : hasMission ? 'bg-orange-500 animate-pulse shadow-[0_0_15px_#f97316]' : 'bg-green-500'}`} 
             />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] uppercase tracking-[0.5em] font-light text-white">
                {userRole === 'super-admin' ? 'Admin Mode' : hasMission ? 'Missão Ativa' : 'Saber Mais'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* MENU */}
        <nav className="flex-1 w-full px-4 space-y-3">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button key={item.name} onClick={() => router.push(item.href)} className="w-full group relative flex items-center h-14 outline-none transition-all duration-500">
                {isActive && <motion.div layoutId="activeIndicator" className="absolute left-[-16px] w-1 h-8 bg-blue-500 shadow-[0_0_15px_#3b82f6] rounded-r-full" />}
                <div className={`flex items-center gap-6 px-5 w-full transition-all ${isActive ? "text-white" : "text-white/20 group-hover:text-white/60"}`}>
                  <item.icon size={20} strokeWidth={isActive ? 1.5 : 1} className="shrink-0" />
                  {isExpanded && <span className="text-[10px] uppercase tracking-[0.3em] font-medium">{item.name}</span>}
                </div>
              </button>
            );
          })}

          {/* BOTÃO OPERACIONAL / MISSÃO */}
          {(userRole === 'super-admin' || userRole === 'formador' || hasMission) && (
            <button 
              onClick={() => router.push("/dashboard/admin")} 
              className={`w-full group relative flex items-center h-14 outline-none transition-all duration-500 ${pathname === '/dashboard/admin' ? 'text-blue-400' : ''}`}
            >
              {pathname === '/dashboard/admin' && <motion.div layoutId="activeIndicator" className="absolute left-[-16px] w-1 h-8 bg-blue-500 shadow-[0_0_15px_#3b82f6] rounded-r-full" />}
              <div className={`flex items-center gap-6 px-5 w-full transition-all ${pathname === '/dashboard/admin' ? 'text-blue-500' : hasMission ? 'text-orange-500 group-hover:text-orange-400' : 'text-blue-500/30 group-hover:text-blue-400'}`}>
                {hasMission && userRole !== 'super-admin' ? <Zap size={20} strokeWidth={1.5} className="shrink-0 animate-pulse" /> : <ShieldCheck size={20} strokeWidth={1.5} className="shrink-0" />}
                {isExpanded && <span className="text-[10px] uppercase tracking-[0.4em] font-black">
                  {hasMission && userRole !== 'super-admin' ? 'Acesso Delegado' : 'Operacional'}
                </span>}
              </div>
            </button>
          )}
        </nav>

        {/* LOGOUT */}
        <div className="px-4 mt-auto">
          <button onClick={handleLogout} className="w-full group relative flex items-center h-14 px-5 gap-6 text-white/10 hover:text-red-400/80 transition-all outline-none">
            <LogOut size={20} strokeWidth={1} className="shrink-0" />
            {isExpanded && <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Sair</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}