import React from "react";

export const ClarifyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M32 16v16l11 11"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path
      d="M20 12l2 4M44 12l-2 4M12 20l4 2M52 20l-4 2M12 44l4-2M52 44l-4-2M20 52l2-4M44 52l-2-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SavingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 48L20 36L28 42L40 28L56 16"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M44 16H56V28"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="36" r="3" fill="currentColor" />
    <circle cx="28" cy="42" r="3" fill="currentColor" />
    <circle cx="40" cy="28" r="3" fill="currentColor" />
  </svg>
);

export const PlanIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="10"
      y="8"
      width="44"
      height="48"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M18 24h28M18 34h20M18 44h24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 8V4M42 8V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="46" cy="44" r="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
    <path
      d="M42 44l3 3 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SolarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="24" cy="14" r="8" stroke="currentColor" strokeWidth="2" />
    <path
      d="M24 2v4M24 22v4M36 14h4M8 14h4M32.5 5.5l-2.8 2.8M18.3 19.7l-2.8 2.8M32.5 22.5l-2.8-2.8M18.3 8.3l-2.8-2.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="6" y="28" width="36" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M18 28v16M30 28v16M6 36h36" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const EnergyAuditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 40V18l16-12 16 12v22a2 2 0 01-2 2H10a2 2 0 01-2-2z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M18 42V28h12v14"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M24 16l-4 8h8l-4 8"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CarbonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="24" cy="38" rx="18" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M24 6c-8 0-14 6-14 14 0 6 4 11 10 13v5M24 6c8 0 14 6 14 14 0 6-4 11-10 13v5"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.3" />
    <circle cx="32" cy="18" r="4" fill="currentColor" fillOpacity="0.3" />
    <circle cx="24" cy="12" r="2" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

export const FinanceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="12" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="24" cy="26" r="8" stroke="currentColor" strokeWidth="2" />
    <path
      d="M24 22v8M21 25h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="8" y="18" width="6" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="34" y="24" width="6" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
    <path d="M4 18h40" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const GuideIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 6h12a4 4 0 014 4v32a3 3 0 00-3-3H8V6z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M40 6H28a4 4 0 00-4 4v32a3 3 0 013-3h13V6z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M12 14h4M12 20h6M32 14h4M32 20h6M32 26h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const CaseStudyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M6 18h36"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
    <circle cx="18" cy="14" r="2" fill="currentColor" fillOpacity="0.5" />
    <circle cx="24" cy="14" r="2" fill="currentColor" fillOpacity="0.3" />
    <path
      d="M14 28l6 6 12-12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FAQIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M18 18c0-3.3 2.7-6 6-6s6 2.7 6 6c0 2.5-1.5 4.5-4 5.5V26"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="24" cy="32" r="2" fill="currentColor" />
  </svg>
);
