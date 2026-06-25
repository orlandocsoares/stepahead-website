"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Calendar, FileText, 
  User, LogOut, ShieldAlert, Home, LayoutDashboard,
  MessageSquare, LifeBuoy 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

export function CommandCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [internalHover, setInternalHover] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isHero = pathname === "/";
  const shouldShowBar = isHero ? isVisible : true;

  // INJECÇÃO DO PLANO: Inclusão dos caminhos de Comunidade e Suporte com cores premium dedicadas
  const navItems = [
    { label: "Radar", icon: LayoutDashboard, path: "/dashboard", color: "text-blue-400" },
    { label: "Agenda", icon: Calendar, path: "/dashboard/agenda", color: "text-emerald-400" },
    { label: "Repositório", icon: FileText, path: "/dashboard/repositorio", color: "text-amber-400" },
    { label: "Comunidade", icon: MessageSquare, path: "/dashboard/comunidade", color: "text-teal-400" },
    { label: "Suporte", icon: LifeBuoy, path: "/dashboard/suporte", color: "text-rose-400" },
    { label: "Perfil", icon: User, path: "/dashboard/perfil", color: "text-purple-400" },
  ];

  if (profile?.role === 'super-admin') {
    navItems.push({ label: "Controlo", icon: ShieldAlert, path: "/dashboard/admin", color: "text-red-500" });
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return null;

  const displayName = authUser?.user_metadata?.first_name || profile?.first_name || 'Utilizador';
  const avatarUrl = authUser?.user_metadata?.avatar_url || profile?.avatar_url;
  const displayAvatar = avatarUrl || (displayName ? `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=ffffff&textColor=000000` : null);
  const userRoleDisplay = profile?.role === 'super-admin' ? 'Admin' : 'Operacional';

  if (!authUser) return null;

  return (
    <>
      {/* O AVATAR ESPREITADOR: Revela elegantemente o menu na página inicial ao passar o rato */}
      {isHero && !isVisible && (
        <motion.div 
          initial={{ x: "-40%", opacity: 0 }}
          animate={{ x: "-15%", opacity: 1 }}
          whileHover={{ x: "0%", transition: { type: "spring", stiffness: 400, damping: 25 } }}
          onMouseEnter={() => setIsVisible(true)}
          className="fixed left-0 top-0 h-screen z-[110] flex items-center pointer-events-auto cursor-none pl-3"
        >
          <div className="p-2 bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-r-[2rem] shadow-[0_0_45px_rgba(0,0,0,0.6)] flex items-center justify-center cursor-pointer group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-black border border-white/10 group-hover:border-blue-500/50 transition-colors duration-500">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              ) : (
                <User size={16} className="text-white/40" />
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black shadow-[0_0_5px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
          </div>
        </motion.div>
      )}

      <div className={`fixed left-0 top-0 h-screen z-[100] flex items-center pointer-events-none ${isHero ? '' : 'pointer-events-auto'}`}>
        <motion.nav 
          initial={false}
          animate={shouldShowBar ? "visible" : "hidden"}
          variants={{
            hidden: { x: "-125%", transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] } },
            visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
          }}
          onMouseLeave={() => { 
            if (isHero) setIsVisible(false); 
            setInternalHover(false); 
          }}
          onMouseEnter={() => setInternalHover(true)} 
          className="ml-6 pointer-events-auto flex flex-col items-center gap-2 p-4 bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        >
          
          {/* AVATAR DO UTILIZADOR COM BADGE ACTIVO */}
          <div className="relative flex items-center w-full justify-center mt-2 mb-2">
            <button
              onClick={() => router.push('/dashboard/perfil')}
              className="relative w-12 h-12 rounded-full outline-none group flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-white/30 transition-colors duration-500" />
              <div className="absolute inset-[2px] rounded-full overflow-hidden bg-black flex items-center justify-center">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                ) : (
                  <User size={18} className="text-white/40 group-hover:text-white transition-colors" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d0d0f] shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
            </button>

            <AnimatePresence>
              {internalHover && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 15 }} 
                  exit={{ opacity: 0, x: -10 }} 
                  transition={{ duration: 0.2, ease: "easeOut" }} 
                  className="absolute left-full pointer-events-none flex items-center h-full top-0"
                >
                  <div className="flex flex-col ml-2 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-md whitespace-nowrap">{displayName}</span>
                    <span className="text-[7.5px] font-light uppercase tracking-[0.4em] text-white/40 whitespace-nowrap mt-[2px]">{userRoleDisplay}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-8 h-[1px] bg-white/5 mb-2 mt-2" />

          {/* BOTÃO FIXO PARA VOLTAR AO SITE (HERO) */}
          <div className="relative flex items-center w-full justify-center mb-2">
            <button 
              onClick={() => router.push('/')} 
              className="relative p-4 rounded-full transition-all duration-700 group outline-none flex items-center justify-center hover:bg-white/[0.03]"
            >
              <Home size={20} strokeWidth={1} className="relative z-10 text-white/20 group-hover:text-white/70 transition-colors" />
              
              <AnimatePresence>
                {internalHover && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 15 }} 
                    exit={{ opacity: 0, x: -10 }} 
                    transition={{ duration: 0.2, ease: "easeOut" }} 
                    className="absolute left-full pointer-events-none flex items-center h-full top-0"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/40 drop-shadow-md whitespace-nowrap">
                      Página Principal
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* MENUS OPERACIONAIS DA DASHBOARD COM OS NOVOS ELEMENTOS */}
          <div className="flex flex-col gap-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <div key={item.path} className="relative flex items-center justify-center w-full">
                  <button 
                    onClick={() => router.push(item.path)} 
                    className={`relative p-4 rounded-full transition-all duration-700 group outline-none flex items-center justify-center ${isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.03]'}`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 1.5 : 1} className={`relative z-10 transition-colors ${isActive ? item.color : 'text-white/20 group-hover:text-white/70'}`} />
                    {isActive && <motion.div layoutId="glow" className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl" />}
                    
                    <AnimatePresence>
                      {internalHover && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 15 }} 
                          exit={{ opacity: 0, x: -10 }} 
                          transition={{ duration: 0.2, delay: (index + 1) * 0.03, ease: "easeOut" }} 
                          className="absolute left-full pointer-events-none flex items-center h-full top-0"
                        >
                          <span className={`text-[10px] font-medium uppercase tracking-[0.4em] drop-shadow-md whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40'}`}>
                            {item.label}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="w-8 h-[1px] bg-white/5 my-4" />

          {/* BOTÃO TERMINAR SESSÃO (PERFEITAMENTE ALINHADO AO CENTRO) */}
          <div className="relative flex items-center w-full justify-center mb-2">
            <button 
              onClick={handleLogout} 
              className="relative p-4 rounded-full outline-none transition-all duration-700 group hover:bg-white/[0.03] flex items-center justify-center"
            >
              <LogOut size={20} strokeWidth={1.5} className="text-white/20 group-hover:text-red-400/80 transition-colors shrink-0" />
              
              <AnimatePresence>
                {internalHover && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 15 }} 
                    exit={{ opacity: 0, x: -10 }} 
                    transition={{ duration: 0.2, ease: "easeOut" }} 
                    className="absolute left-full pointer-events-none flex items-center h-full top-0"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-red-400/60 drop-shadow-md whitespace-nowrap leading-none">
                      Terminar Sessão
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

        </motion.nav>
      </div>
    </>
  );
}