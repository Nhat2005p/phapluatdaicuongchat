import React, { useEffect, useRef, useState } from 'react';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  decimalPlaces?: number;
  suffix?: string;
  prefix?: string;
  useGrouping?: boolean;
}

/**
 * Magic UI NumberTicker Component
 * Smoothly animates numbers upwards using easing curves when scrolled into view.
 */
export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  direction = 'up',
  delay = 0,
  duration = 1.8,
  className = '',
  decimalPlaces = 0,
  suffix = '',
  prefix = '',
  useGrouping = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(direction === 'down' ? value : 0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now() + delay * 1000;
          const durationMs = duration * 1000;

          const startVal = direction === 'down' ? value : 0;
          const endVal = direction === 'down' ? 0 : value;

          const animate = (currentTime: number) => {
            if (currentTime < startTime) {
              requestAnimationFrame(animate);
              return;
            }

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out quad
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = startVal + (endVal - startVal) * easeProgress;

            setDisplayValue(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(endVal);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, direction, delay, duration]);

  const formattedNumber = displayValue.toLocaleString('vi-VN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping,
  });

  return (
    <span ref={elementRef} className={`inline-block tabular-nums tracking-tight ${className}`}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
