
"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-16 md:px-40 py-10 pointer-events-none">
      <div className="flex justify-center items-center w-full max-w-[1800px] mx-auto">
        <div className="flex gap-12 pointer-events-auto items-center">
          <Link 
            href="/login" 
            className="text-[12px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors"
          >
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
