import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { getDynamicCardStyles } from '../utils/styleUtils';

interface CardProps {
  data: FlashcardData;
  isTop: boolean;
  onSwipe: () => void;
}

const Card: React.FC<CardProps> = ({ data, isTop, onSwipe }) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!isTop) return;
    setSwipeDirection(direction);
  };

  const handleAnimationEnd = () => {
    if (swipeDirection) {
      onSwipe();
    }
  };

  const animationClass = swipeDirection === 'left' 
    ? 'animate-swipe-out-left' 
    : swipeDirection === 'right' 
      ? 'animate-swipe-out-right' 
      : (isTop ? 'animate-pop-in' : '');

  const cardStyle: React.CSSProperties = {
    zIndex: isTop ? 10 : 1,
    transform: !isTop ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
    filter: !isTop ? 'blur(4px)' : 'none',
    opacity: !isTop ? 0.7 : 1,
    transition: 'transform 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out',
  };

  const dynamicStyles = getDynamicCardStyles(data.mood);

  return (
    <div
      className={`absolute w-full h-full p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col cursor-grab border border-white/10 ${dynamicStyles.background} ${isTop ? '' : 'pointer-events-none'} ${animationClass}`}
      style={cardStyle}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={`absolute top-4 left-6 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${dynamicStyles.badgeColor}`}>
        <span>{data.icon}</span>
        <span>{data.category}</span>
      </div>

      <div className="flex-grow overflow-auto pt-10 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{data.title}</h3>
        <p className="text-slate-200 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{data.content}</p>
      </div>

      {isTop && (
        <div className="flex-shrink-0 pt-4 mt-auto flex justify-center">
          <button
            onClick={() => handleSwipe('right')}
            className="w-full max-w-xs py-3 px-4 bg-white/10 text-slate-200 font-bold rounded-lg hover:bg-white/20 transition-colors duration-200"
            aria-label="Next Card"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Card;