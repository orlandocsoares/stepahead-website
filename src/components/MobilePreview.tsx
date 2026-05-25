import React from 'react';

interface MobilePreviewProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePreview({ children, className = '' }: MobilePreviewProps) {
  return (
    <div className={`mx-auto max-w-[320px] w-full p-2 md:p-3 bg-zinc-950 rounded-[2.5rem] shadow-2xl relative border-[4px] md:border-[6px] border-zinc-800 ${className}`}>
      {/* Top Notch / Speaker */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-4 md:h-5 bg-zinc-950 rounded-b-xl z-20 flex justify-center items-center">
        <div className="w-10 h-1 bg-zinc-800 rounded-full"></div>
      </div>
      
      {/* Screen */}
      <div className="relative w-full aspect-[9/19.5] bg-zinc-50 rounded-[2rem] overflow-hidden ring-1 ring-white/10">
        {children}
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 w-20 md:w-28 h-1 md:h-1.5 rounded-full bg-zinc-800"></div>
    </div>
  );
}
