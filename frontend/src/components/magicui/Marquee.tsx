import React from 'react';

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Magic UI Marquee Component
 * Infinite looping carousel with pause-on-hover and GPU-accelerated CSS animations.
 */
export const Marquee: React.FC<MarqueeProps> = ({
  className = '',
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  duration = 35,
  ...props
}) => {
  return (
    <div
      {...props}
      style={{ '--duration': `${duration}s` } as React.CSSProperties}
      className={`group flex overflow-hidden p-2 [--gap:1.25rem] [gap:var(--gap)] ${
        vertical ? 'flex-col' : 'flex-row'
      } ${className}`}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`flex shrink-0 justify-around [gap:var(--gap)] ${
              vertical
                ? 'animate-marquee-vertical flex-col'
                : 'animate-marquee flex-row'
            } ${reverse ? '[animation-direction:reverse]' : ''} ${
              pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
            }`}
          >
            {children}
          </div>
        ))}
    </div>
  );
};
