import React, { useEffect, useState } from 'react';

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

/**
 * Magic UI TypingAnimation Component
 * Hiệu ứng hoạt ảnh mô phỏng quá trình gõ chữ tự nhiên trên màn hình.
 */
export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  duration = 30,
  className = '',
  cursor = true,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setIsTyping(true);
    setDisplayedText('');

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, duration);

    return () => clearInterval(interval);
  }, [text, duration]);

  return (
    <span className={`inline-block ${className}`}>
      {displayedText}
      {cursor && isTyping && (
        <span className="inline-block w-2 h-4.5 bg-indigo-600 dark:bg-indigo-400 ml-1 rounded-xs animate-pulse align-middle" />
      )}
    </span>
  );
};

