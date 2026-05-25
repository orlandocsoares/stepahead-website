import React from 'react';

interface TabletPreviewProps {
  children: React.ReactNode;
  className?: string;
}

export function TabletPreview({ children, className = '' }: TabletPreviewProps) {
  return (
    <div className={`mx-auto max-w-[800px] w-full p-3 md:p-6 bg-zinc-950 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative border-[6px] md:border-8 border-zinc-800 ${className}`}>
      {/* Camera Dot */}
      <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-700 shadow-inner"></div>
      
      {/* Screen */}
      <div className="relative w-full aspect-[3/4] md:aspect-[4/3] bg-zinc-50 rounded-[1.25rem] md:rounded-[2rem] overflow-hidden ring-1 ring-white/10">
        {children}
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 w-16 md:w-24 h-1 md:h-1.5 rounded-full bg-zinc-800"></div>
    </div>
  );
}
