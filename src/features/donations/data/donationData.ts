export const TIERS = [
    {
        id: 'bronze',
        name: 'Bronze',
        threshold: '>= ₹50',
        dotClass: 'bg-chart-5',
        perks: [
            'Bronze profile frame',
            'Avatar & banner uploads',
            'Bronze color name across app',
            'AMOLED mode + all accents',
            'Custom AI prompt',
            'Discord patron role',
        ],
    },
    {
        id: 'gold',
        name: 'Gold',
        threshold: '>= ₹169',
        dotClass: 'bg-chart-4',
        perks: [
            'Everything in Bronze',
            'Gold color name across app',
            'Gold profile frame',
            'Animated GIF avatars & banners',
        ],
    },
    {
        id: 'platinum',
        name: 'Platinum',
        threshold: '>= ₹569',
        dotClass: 'bg-chart-3',
        perks: [
            'Everything in Gold',
            'Purple color name across app',
            'Platinum profile frame',
        ],
    },
] as const;
