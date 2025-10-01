import React, { useState, useEffect } from 'react';
import { FlashcardData } from '../types';
import Card from './Card';
import { SparklesIcon } from './icons/SparklesIcon';

interface FlashcardDeckProps {
  cards: FlashcardData[];
  onGenerateNew: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onGenerateNew, isLoading, error }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // When we swipe past the last generated card, request a new one.
    if (currentIndex >= cards.length && !isLoading && cards.length > 0) {
      onGenerateNew();
    }
  }, [currentIndex, cards.length, isLoading, onGenerateNew]);

  const handleSwipe = () => {
    // We only advance the index; the animation is handled in the Card component.
    setCurrentIndex(prev => prev + 1);
  };
  
  const hasCards = cards.length > 0;
  const isDeckExhausted = currentIndex >= cards.length;
  const showLoadingIndicator = isLoading && isDeckExhausted;
  const showCaughtUpMessage = !isLoading && hasCards && isDeckExhausted && !error;
  const showInitialErrorState = !isLoading && !hasCards && error;

  return (
    <div className="w-full max-w-md h-[500px] flex flex-col items-center justify-center relative">
      <div className="text-center absolute bottom-full mb-4 w-full h-20 flex flex-col justify-end">
         {hasCards && (
            <p className="text-slate-400">
              Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}
            </p>
         )}
        {error && !showInitialErrorState && <p className="text-red-400 mt-1 px-4">{error}</p>}
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {showLoadingIndicator && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <SparklesIcon className="w-12 h-12 animate-pulse" />
            <p className="mt-4 text-lg">Generating new insight...</p>
          </div>
        )}

        {showCaughtUpMessage && (
             <div className="text-center p-8 bg-slate-800/50 rounded-xl">
                <h3 className="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
                <p className="text-slate-400 mb-6">You've reviewed all generated cards.</p>
                <button
                    onClick={onGenerateNew}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                   <SparklesIcon className="w-5 h-5"/>
                   Generate More
                </button>
            </div>
        )}

        {showInitialErrorState && (
            <div className="text-center p-8 bg-slate-800/50 rounded-xl max-w-sm w-full">
                <h3 className="text-2xl font-bold text-red-400 mb-2">Generation Failed</h3>
                <p className="text-slate-400 mb-6">{error}</p>
                <button
                    onClick={onGenerateNew}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                   Try Again
                </button>
            </div>
        )}
        
        {cards.map((card, index) => {
          if (index < currentIndex) return null; // Don't render past cards
          if (index > currentIndex + 2) return null; // Render only a few upcoming cards for performance
          
          return (
            <Card
              key={card.id}
              data={card}
              isTop={index === currentIndex}
              onSwipe={handleSwipe}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FlashcardDeck;