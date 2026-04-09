import React from "react";

export default function LadderLogo({ className = "", style = {}, color = "currentColor", ...props }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, ...style }}
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="currentColor" fillOpacity="0.08" />
      
      {/* Subtle AI Circuit Patterns */}
      <path d="M 22 15 L 30 23 M 78 15 L 70 23 M 22 85 L 30 77 M 78 85 L 70 77" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" strokeLinecap="round" />
      <circle cx="18" cy="11" r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="82" cy="11" r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="18" cy="89" r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="82" cy="89" r="2.5" fill="currentColor" fillOpacity="0.4" />
      
      {/* Ladder Rails */}
      <line x1="32" y1="20" x2="32" y2="80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="68" y1="20" x2="68" y2="80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      
      {/* Rung 1 (Contact) */}
      <line x1="32" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="4.5" />
      <line x1="56" y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="4.5" />
      <line x1="44" y1="26" x2="44" y2="46" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="56" y1="26" x2="56" y2="46" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      
      {/* Rung 2 (Coil) */}
      <line x1="32" y1="64" x2="42" y2="64" stroke="currentColor" strokeWidth="4.5" />
      <line x1="58" y1="64" x2="68" y2="64" stroke="currentColor" strokeWidth="4.5" />
      <path d="M 47 54 Q 40 64 47 74 M 53 54 Q 60 64 53 74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      
      {/* Wiring dots */}
      <circle cx="32" cy="36" r="3" fill="currentColor" />
      <circle cx="32" cy="64" r="3" fill="currentColor" />
    </svg>
  );
}
