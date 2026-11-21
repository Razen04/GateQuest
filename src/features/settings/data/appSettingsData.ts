import {
    BookOpenIcon,
    DeviceMobileIcon,
    MoonStarsIcon,
    SunIcon,
} from '@phosphor-icons/react';

export const ACCENTS = [
    { id: 'default', label: 'Blue (Default)', swatch: 'oklch(0.62 0.22 255)' },
    { id: 'ocean', label: 'Ocean', swatch: 'oklch(0.62 0.22 190)' },
    { id: 'forest', label: 'Forest', swatch: 'oklch(0.62 0.22 140)' },
    { id: 'amber', label: 'Amber', swatch: 'oklch(0.7 0.18 70)' },
    { id: 'rose', label: 'Rose', swatch: 'oklch(0.62 0.22 340)' },
    { id: 'violet', label: 'Violet', swatch: 'oklch(0.6 0.22 275)' },
] as const;

export const THEME_MODES = [
    {
        id: 'light' as const,
        label: 'Light',
        preview: 'bg-white border-border',
        icon: SunIcon,
    },
    {
        id: 'sepia' as const,
        label: 'Sepia',
        preview: 'bg-[#1a140d] border-[#3a2e1e]',
        icon: BookOpenIcon,
    },
    {
        id: 'dark' as const,
        label: 'Dark',
        preview: 'bg-zinc-900 border-zinc-700',
        icon: MoonStarsIcon,
    },
    {
        id: 'amoled' as const,
        label: 'AMOLED',
        preview: 'bg-black border-zinc-800',
        icon: DeviceMobileIcon,
    },
];
