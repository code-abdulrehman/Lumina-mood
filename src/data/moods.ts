import { MoodConfig } from '../types/mood';

export const MOOD_CONFIGS: MoodConfig[] = [
    {
        level: 'great',
        icon: 'Smile',
        label: 'Great',
        color: '#FCD34D', // Amber
    },
    {
        level: 'good',
        icon: 'SmilePlus',
        label: 'Good',
        color: '#6EE7B7', // Emerald
    },
    {
        level: 'neutral',
        icon: 'Meh',
        label: 'Neutral',
        color: '#93C5FD', // Blue
    },
    {
        level: 'down',
        icon: 'Frown',
        label: 'Down',
        color: '#F87171', // Red/Salmon
    },
    {
        level: 'unhappy',
        icon: 'Annoyed',
        label: 'Bad',
        color: '#A78BFA', // Violet
    },
];
