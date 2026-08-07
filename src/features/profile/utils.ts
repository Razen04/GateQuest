export const accuracyColor = (acc: number) => {
    if (acc >= 78) return 'bg-emerald-500';
    if (acc >= 65) return 'bg-blue-500';
    return 'bg-amber-400';
};

export const accuracyTextColor = (acc: number) => {
    if (acc >= 78) return 'text-emerald-600 dark:text-emerald-400';
    if (acc >= 65) return 'text-blue-600    dark:text-blue-400';
    return 'text-amber-600 dark:text-amber-400';
};
