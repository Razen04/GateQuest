export const accuracyColor = (acc: number) => {
    if (acc >= 78) return 'bg-chart-2';
    if (acc >= 65) return 'bg-chart-1';
    return 'bg-chart-4';
};

export const accuracyTextColor = (acc: number) => {
    if (acc >= 78) return 'text-chart-2';
    if (acc >= 65) return 'text-chart-1';
    return 'text-chart-4';
};
