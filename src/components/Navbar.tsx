
"use client";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-16 md:px-40 py-10 pointer-events-none">
      <div className="flex justify-start items-center w-full max-w-[1800px] mx-auto">
        <div className="flex gap-12 pointer-events-auto items-center">
          {/* O link de login foi movido para o HeroSection para uma interação contextual com o logótipo */}
        </div>
      </div>
    </nav>
  );
}
