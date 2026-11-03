import React from 'react';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
}

/**
 * Magic UI / 21st.dev ShinyButton Component
 * A luxurious button featuring a continuous diagonal shimmer light reflection.
 */
export const ShinyButton: React.FC<ShinyButtonProps> = ({
  children,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.35)',
  ...props
}) => {
  return (
    <button
      {...props}
      className={`relative inline-flex items-center justify-center overflow-hidden font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Shimmer sweep effect */}
      <span
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="absolute inset-0 -translate-x-full animate-shimmer-slide"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
            transform: 'skewX(-20deg)',
            width: '60%',
          }}
        />
      </span>
    </button>
  );
};
