import { MoodConfig } from '../types/mood';
import { CUSTOM_MOOD_IMAGES } from '../constants/MoodIcons';

export const MOOD_CONFIGS: MoodConfig[] = [
    {
        level: 'awesome',
        icon: 'Zap',
        label: 'Awesome',
        color: '#8B5CF6', // Energetic Purple
        customImage: CUSTOM_MOOD_IMAGES.awesome,
    },
    {
        level: 'great',
        icon: 'Smile',
        label: 'Great',
        color: '#FACC15', // Bright Amber
        customImage: CUSTOM_MOOD_IMAGES.great,
    },
    {
        level: 'good',
        icon: 'SmilePlus',
        label: 'Good',
        color: '#34D399', // Fresh Green
        customImage: CUSTOM_MOOD_IMAGES.good,
    },
    {
        level: 'neutral',
        icon: 'Meh',
        label: 'Neutral',
        color: '#9CA3AF', // True Neutral Gray
        customImage: CUSTOM_MOOD_IMAGES.neutral,
    },
    {
        level: 'down',
        icon: 'Frown',
        label: 'Down',
        color: '#60A5FA', // Low-energy Blue
        customImage: CUSTOM_MOOD_IMAGES.down,
    },
    {
        level: 'unhappy',
        icon: 'Annoyed',
        label: 'Bad',
        color: '#6D28D9', // Deep Purple (sadness)
        customImage: CUSTOM_MOOD_IMAGES.unhappy,
    },
    {
        level: 'awful',
        icon: 'Skull',
        label: 'Awful',
        color: '#374151', // Dark Gray
        customImage: CUSTOM_MOOD_IMAGES.awful,
    },
    {
        level: 'loved',
        icon: 'Heart',
        label: 'Loved',
        color: '#EC4899', // Warm Pink
        customImage: CUSTOM_MOOD_IMAGES.loved,
    },
    {
        level: 'blessed',
        icon: 'Sun',
        label: 'Blessed',
        color: '#FDE047', // Soft Yellow
        customImage: CUSTOM_MOOD_IMAGES.blessed,
    },
    {
        level: 'joyful',
        icon: 'PartyPopper',
        label: 'Joyful',
        color: '#FB923C', // Celebration Orange
        customImage: CUSTOM_MOOD_IMAGES.joyful,
    },
    {
        level: 'angry',
        icon: 'Flame',
        label: 'Angry',
        color: '#DC2626', // Strong Red
        customImage: CUSTOM_MOOD_IMAGES.angry,
    },
    {
        level: 'scared',
        icon: 'Ghost',
        label: 'Scared',
        color: '#475569', // Dark Slate (fear)
        customImage: CUSTOM_MOOD_IMAGES.scared,
    },
    {
        level: 'confused',
        icon: 'HelpCircle',
        label: 'Confused',
        color: '#D1D5DB', // Uncertain Gray
        customImage: CUSTOM_MOOD_IMAGES.confused,
    },
    {
        level: 'hot',
        icon: 'Thermometer',
        label: 'Hot',
        color: '#F97316', // Heat Orange
        customImage: CUSTOM_MOOD_IMAGES.hot,
    },
    {
        level: 'hugging',
        icon: 'HeartHandshake',
        label: 'Hugging',
        color: '#93C5FD', // Soft Comfort Blue
        customImage: CUSTOM_MOOD_IMAGES.hugging,
    },
    {
        level: 'woozy',
        icon: 'Dizzy',
        label: 'Woozy',
        color: '#A78BFA', // Disoriented Purple
        customImage: CUSTOM_MOOD_IMAGES.woozy,
    },
];
