"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PROGRAM_INFO } from "@/lib/program-config";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Verifica o estado inicial do utilizador
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Ouve mudanças (Login/Logout) em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-12 md:px-24 py-6 flex items-center justify-between border-b",
      isScrolled ? "bg-white border-black/10 py-3 shadow-sm text-black" : "bg-transparent border-transparent text-white mix-blend-difference"
    )}>
      <div className="flex items-center gap-2">
        <Link href="/" className="font-headline font-black text-xl tracking-tighter uppercase italic">
          {PROGRAM_INFO.name}
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8 font-headline text-xs tracking-widest uppercase font-semibold">
        <Link href="/#programa" className="hover:opacity-50 transition-opacity">Programa</Link>
        <Link href="/#agenda" className="hover:opacity-50 transition-opacity">Agenda</Link>
        <Link href="/#documentacao" className="hover:opacity-50 transition-opacity">Documentação</Link>
        
        {user ? (
          <button 
            onClick={handleLogout}
            className={cn("px-6 py-3 font-bold transition-colors", isScrolled ? "bg-red-600 text-white" : "bg-white text-black")}
          >
            Sair
          </button>
        ) : (
          <Link href="/login" className={cn("px-6 py-3 font-bold transition-colors", isScrolled ? "bg-black text-white" : "bg-white text-black")}>
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}