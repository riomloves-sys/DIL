export const uxTD_computePoints = (
  taskType: string,
  mode: 'normal' | 'danger',
  isDoublePoints: boolean
): number => {
  let base = 0;
  
  switch (taskType) {
    case 'truth': base = 10; break;
    case 'dare': base = 20; break;
    case 'mystery': base = 30; break;
    case 'danger': base = 50; break;
    case 'roulette': base = 15; break;
    default: base = 5;
  }

  // Danger mode multiplier
  if (mode === 'danger') base = Math.floor(base * 1.5);

  // Power card multiplier
  if (isDoublePoints) base = base * 2;

  return base;
};

// Simple profanity filter for safety
export const uxTD_isSafeContent = (text: string): boolean => {
  const denyList = ['kill', 'suicide', 'die', 'murder', 'dox', 'rape', 'abuse', 'blood', 'slashed'];
  const lower = text.toLowerCase();
  return !denyList.some(word => lower.includes(word));
};
