interface CardDynamicStyle {
  background: string;
  badgeColor: string;
}

const moodStyles: Record<string, CardDynamicStyle> = {
  energetic: {
    background: 'bg-gradient-to-br from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-400/20 text-amber-200',
  },
  calm: {
    background: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    badgeColor: 'bg-cyan-400/20 text-cyan-200',
  },
  serious: {
    background: 'bg-gradient-to-br from-slate-700 to-slate-800',
    badgeColor: 'bg-slate-400/20 text-slate-200',
  },
  inspirational: {
    background: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    badgeColor: 'bg-purple-400/20 text-purple-200',
  },
  technical: {
    background: 'bg-gradient-to-br from-sky-600 to-blue-700',
    badgeColor: 'bg-sky-400/20 text-sky-200',
  },
  creative: {
    background: 'bg-gradient-to-br from-pink-500 to-rose-600',
    badgeColor: 'bg-pink-400/20 text-pink-200',
  },
};

const defaultStyle: CardDynamicStyle = moodStyles.serious;

export const getDynamicCardStyles = (mood?: string): CardDynamicStyle => {
  if (mood && moodStyles[mood]) {
    return moodStyles[mood];
  }
  return defaultStyle;
};
