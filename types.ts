export interface FlashcardStyleData {
  category: string;
  mood: string;
  icon: string; // Emoji
}

export interface FlashcardData extends FlashcardStyleData {
  id: string;
  title: string;
  content: string;
}
