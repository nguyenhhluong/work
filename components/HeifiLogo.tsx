
import React from 'react';

interface HeifiLogoProps {
  className?: string;
  glow?: boolean;
}

export const HeifiLogo: React.FC<HeifiLogoProps> = ({ className = "w-10 h-10", glow = true }) => (
  <div className={`relative ${className} ${glow ? 'shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''} rounded-2xl overflow-hidden bg-[#0a0a0f] flex items-center justify-center border border-white/5`}>
    <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] text-white fill-none stroke-current" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {/* Abstract H Monogram based on flowing sharp lines */}
      <path d="M25 20 Q 30 50, 25 80" />
      <path d="M75 20 Q 70 50, 75 80" />
      <path d="M25 50 C 35 40, 65 60, 75 50" />
      {/* Decorative flourishes */}
      <path d="M35 30 Q 50 20, 65 30" opacity="0.3" strokeWidth="2" />
      <path d="M35 70 Q 50 80, 65 70" opacity="0.3" strokeWidth="2" />
    </svg>
  </div>
);
