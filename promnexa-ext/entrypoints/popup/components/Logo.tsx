import React from 'react';

// Promnexa brand logo — abstract geometric symbol representing clarity and transformation
export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer hexagonal shape representing structured thinking */}
    <path
      d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z"
      fill="url(#logoGradient)"
      opacity="0.15"
    />
    {/* Inner transformation symbol — arrow merging into a refined shape */}
    <path
      d="M10 20L14 12H18L22 20"
      stroke="url(#logoGradient)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17H20"
      stroke="url(#logoGradient)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Spark/clarity dot */}
    <circle
      cx="16"
      cy="9"
      r="1.5"
      fill="url(#logoGradient)"
    />
    <defs>
      <linearGradient id="logoGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#817CF5" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
  </svg>
);

export const LogoMark: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z"
      fill="var(--accent-primary)"
      opacity="0.2"
    />
    <path
      d="M10 20L14 12H18L22 20"
      stroke="var(--accent-primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17H20"
      stroke="var(--accent-primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="16" cy="9" r="1.5" fill="var(--accent-primary)" />
  </svg>
);
