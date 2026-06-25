import React from "react";

export default function ZenBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-1000">
      {/* Soft floating glowing ambient lights */}
      {/* 1. Fresh Sky Blue Glow (top left) */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-sky-100/45 dark:bg-sky-950/20 blur-[130px] animate-pulse-slow" />
      
      {/* 2. Refreshing Mint/Teal Glow (bottom right) */}
      <div className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[70%] rounded-full bg-teal-100/30 dark:bg-teal-950/15 blur-[150px] animate-pulse-slow [animation-delay:4s]" />
      
      {/* 3. Elegant Lavender/Indigo Glow (mid right) */}
      <div className="absolute top-[25%] right-[-5%] w-[45%] h-[45%] rounded-full bg-indigo-100/35 dark:bg-indigo-950/10 blur-[110px] animate-pulse-slow [animation-delay:2s]" />

      {/* Gentle premium noise overlay for organic paper texture feel */}
      <div 
        className="absolute inset-0 opacity-[0.008] dark:opacity-[0.015] bg-noise pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
