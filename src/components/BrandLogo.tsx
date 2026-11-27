import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', theme = 'dark' }) => {
  const iconDims =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleClass =
    size === 'sm'
      ? 'text-base font-bold'
      : size === 'lg'
        ? 'text-xl font-extrabold'
        : 'text-lg font-bold';

  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0D3822]';
  const subColor = theme === 'dark' ? 'text-[#9EE870]' : 'text-[#1E7A3E]';

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDims} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="andesPeakGrad" x1="6" y1="36" x2="40" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#28AD47" />
            <stop offset="100%" stopColor="#84F042" />
          </linearGradient>
          <linearGradient id="andesLeafGrad" x1="10" y1="38" x2="44" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5CD938" />
            <stop offset="100%" stopColor="#A9F85B" />
          </linearGradient>
        </defs>
        {/* Left & Center Mountain Peaks */}
        <path
          d="M5 34L17.5 13L25 25.5L31.5 16.5L43 34H5Z"
          fill="url(#andesPeakGrad)"
        />
        {/* Snow Cap Highlights */}
        <path
          d="M17.5 13L13.4 20L17.2 18.4L19.6 21L21.8 19.6L17.5 13Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        <path
          d="M31.5 16.5L28.6 20.8L31.2 19.8L33.1 21.6L34.9 20.9L31.5 16.5Z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
        {/* Fresh Swooping Leaf Accent */}
        <path
          d="M9 36.5C18.5 39.5 32.5 36.5 41.5 26.5C34.5 31.5 22 33 10.5 31.5L9 36.5Z"
          fill="url(#andesLeafGrad)"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`${titleClass} tracking-tight ${textColor} whitespace-nowrap`}>
          Andes Fresh
        </span>
        <span className={`text-[10px] font-semibold tracking-[0.08em] ${subColor} text-right mt-0.5 whitespace-nowrap`}>
          S.A.C.
        </span>
      </div>
    </div>
  );
};
