import React, { useState, useCallback, useEffect } from 'react';
import { FlashcardData } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateFlashcard } from './services/geminiService';
import FileUploadScreen from './components/FileUploadScreen';
import FlashcardDeck from './components/FlashcardDeck';
import { TrashIcon } from './components/icons/TrashIcon';

const App: React.FC = () => {
  const [bookContent, setBookContent] = useLocalStorage<string | null>('bookContent', null);
  const [flashcards, setFlashcards] = useLocalStorage<FlashcardData[]>('flashcards', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewCardRequest = useCallback(async () => {
    if (!bookContent || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const existingTitles = flashcards.map(card => card.title);
      const newCardData = await generateFlashcard(bookContent, existingTitles);

      if (newCardData && newCardData.title && newCardData.content && newCardData.category && newCardData.mood && newCardData.icon) {
        const newFlashcard: FlashcardData = {
          id: crypto.randomUUID(),
          ...newCardData,
        };
        setFlashcards(prev => [...prev, newFlashcard]);
      } else {
        throw new Error('AI failed to generate a complete flashcard. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [bookContent, flashcards, isLoading, setFlashcards]);

  useEffect(() => {
    // If a book is loaded but there are no flashcards, generate the first one.
    if (bookContent && flashcards.length === 0 && !isLoading) {
      handleNewCardRequest();
    }
  }, [bookContent, flashcards.length, isLoading, handleNewCardRequest]);

  const handleFileUpload = (content: string) => {
    setBookContent(content);
    setFlashcards([]); // Reset flashcards for the new book
    setError(null);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete the book and all flashcards? This cannot be undone.')) {
        setBookContent(null);
        setFlashcards([]);
        setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          AI Micro-Learner
        </h1>
        {bookContent && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors duration-200"
            aria-label="Reset book and flashcards"
          >
            <TrashIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </header>

      <main className="w-full flex-grow flex items-center justify-center">
        {!bookContent ? (
          <FileUploadScreen onUpload={handleFileUpload} />
        ) : (
          <FlashcardDeck
            cards={flashcards}
            onGenerateNew={handleNewCardRequest}
            isLoading={isLoading}
            error={error}
          />
        )}
      </main>
    </div>
  );
};

export default App;