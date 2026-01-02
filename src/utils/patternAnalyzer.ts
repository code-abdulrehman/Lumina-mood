import { MoodEntry, Insight, MoodLevel } from '../types/mood';
import { MOOD_CONFIGS } from '../data/moods';
import {
    format,
    isWeekend,
    subDays,
    isSameDay,
    startOfDay,
    eachDayOfInterval,
    subMonths,
    subYears,
    eachWeekOfInterval,
    eachMonthOfInterval,
    isSameWeek,
    isSameMonth,
    endOfWeek,
    endOfMonth,
    startOfWeek,
    startOfMonth
} from 'date-fns';

export interface MoodDistribution {
    level: MoodLevel;
    label: string;
    count: number;
    percentage: number;
}

export interface TrendData {
    label: string;
    count: number;
    fullDate?: Date;
    moodLevel?: MoodLevel;
}

export const getMoodDistribution = (moods: MoodEntry[]): MoodDistribution[] => {
    const levels: MoodLevel[] = [
        'awesome', 'great', 'good', 'neutral', 'down', 'unhappy', 'awful',
        'loved', 'blessed', 'joyful', 'angry', 'scared', 'confused', 'hot', 'hugging', 'woozy'
    ];
    const labels: Record<MoodLevel, string> = {
        awesome: 'Awesome',
        great: 'Great',
        good: 'Good',
        neutral: 'Neutral',
        down: 'Down',
        unhappy: 'Bad',
        awful: 'Awful',
        loved: 'Loved',
        blessed: 'Blessed',
        joyful: 'Joyful',
        angry: 'Angry',
        scared: 'Scared',
        confused: 'Confused',
        hot: 'Hot',
        hugging: 'Hugging',
        woozy: 'Woozy'
    };

    const total = moods.length || 1;

    const counts = moods.reduce((acc, m) => {
        acc[m.level] = (acc[m.level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return levels.map(level => ({
        level,
        label: labels[level],
        count: counts[level] || 0,
        percentage: Math.round(((counts[level] || 0) / total) * 100)
    })).sort((a, b) => b.count - a.count);
};

export const getTrendActivity = (moods: MoodEntry[], range: '7d' | '1m' | '1y' | 'all'): TrendData[] => {
    const now = new Date();

    const getDominantMood = (relevantMoods: MoodEntry[]): MoodLevel | undefined => {
        if (relevantMoods.length === 0) return undefined;
        const counts = relevantMoods.reduce((acc, m) => {
            acc[m.level] = (acc[m.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as MoodLevel;
    };

    if (range === '7d') {
        const startDate = subDays(now, 6);
        const interval = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(now) });
        return interval.map(date => {
            const dayMoods = moods.filter(m => isSameDay(new Date(m.timestamp), date));
            return {
                label: format(date, 'EEE'),
                count: dayMoods.length,
                moodLevel: getDominantMood(dayMoods)
            };
        });
    }

    if (range === '1m') {
        const startDate = subMonths(now, 1);
        const weeks = eachWeekOfInterval({ start: startDate, end: now });
        return weeks.map((weekStart, idx) => {
            const weekMoods = moods.filter(m => isSameWeek(new Date(m.timestamp), weekStart));
            return {
                label: `W${idx + 1}`,
                count: weekMoods.length,
                moodLevel: getDominantMood(weekMoods)
            };
        });
    }

    if (range === '1y') {
        const startDate = subYears(now, 1);
        const months = eachMonthOfInterval({ start: startDate, end: now });
        return months.map(monthStart => {
            const monthMoods = moods.filter(m => isSameMonth(new Date(m.timestamp), monthStart));
            return {
                label: format(monthStart, 'MMM'),
                count: monthMoods.length,
                moodLevel: getDominantMood(monthMoods)
            };
        });
    }

    const sortedMoods = [...moods].sort((a, b) => a.timestamp - b.timestamp);
    if (sortedMoods.length === 0) return [];

    const firstDate = new Date(sortedMoods[0].timestamp);
    const months = eachMonthOfInterval({ start: firstDate, end: now }).slice(-12);
    return months.map(monthStart => {
        const monthMoods = moods.filter(m => isSameMonth(new Date(m.timestamp), monthStart));
        return {
            label: format(monthStart, 'MMM'),
            count: monthMoods.length,
            moodLevel: getDominantMood(monthMoods)
        };
    });
};

export const analyzeMoodPatterns = (moods: MoodEntry[]): Insight[] => {
    if (moods.length < 3) return [];

    const insights: Insight[] = [];

    // 1. Frequency Pattern
    const counts = moods.reduce((acc, mood) => {
        acc[mood.level] = (acc[mood.level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topMoodSort = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topMood = topMoodSort[0];

    if (topMood) {
        insights.push({
            title: 'Dominant Vibe',
            description: `You've expressed "${topMood[0]}" ${topMood[1]} times in this period.`,
            type: 'frequency',
            moodLevel: topMood[0] as MoodLevel,
            topMoods: topMoodSort.slice(0, 4).map(m => m[0] as MoodLevel)
        });
    }

    // 2. Time Pattern
    const timeBuckets = moods.reduce((acc, mood) => {
        const hour = new Date(mood.timestamp).getHours();
        let bucket = '';
        if (hour >= 5 && hour < 12) bucket = 'morning';
        else if (hour >= 12 && hour < 17) bucket = 'afternoon';
        else if (hour >= 17 && hour < 21) bucket = 'evening';
        else bucket = 'night';

        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const activeTime = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0];
    if (activeTime && activeTime[1] >= 2) {
        insights.push({
            title: `${activeTime[0].charAt(0).toUpperCase() + activeTime[0].slice(1)} Streak`,
            description: `You are most reflective during the ${activeTime[0]} hours.`,
            type: 'time',
        });
    }

    // 3. Positivity Score
    const points: Record<MoodLevel, number> = {
        awesome: 7,
        loved: 7,
        blessed: 7,
        joyful: 6,
        great: 6,
        good: 5,
        hugging: 5,
        neutral: 4,
        confused: 3,
        woozy: 3,
        down: 3,
        unhappy: 2,
        scared: 2,
        hot: 2,
        awful: 1,
        angry: 1
    };
    const avgScore = moods.reduce((acc, m) => acc + (points[m.level] || 4), 0) / moods.length;

    if (avgScore >= 5.5) {
        insights.push({
            title: 'Positivity Peak',
            description: 'Your mood average is exceptionally high. You are thriving!',
            type: 'pattern',
        });
    } else if (avgScore <= 3.5) {
        insights.push({
            title: 'Heavy Period',
            description: 'You have been feeling a bit lower than usual. Take some time for self-care.',
            type: 'pattern',
        });
    }

    return insights;
};

export const calculateStreak = (moods: MoodEntry[]): number => {
    if (moods.length === 0) return 0;
    const uniqueDays = Array.from(new Set(moods.map(m => format(new Date(m.timestamp), 'yyyy-MM-dd'))))
        .sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let checkDate = uniqueDays[0] === today ? new Date() : subDays(new Date(), 1);

    for (let i = 0; i < uniqueDays.length; i++) {
        if (format(checkDate, 'yyyy-MM-dd') === uniqueDays[i]) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }

    return streak;
};

export interface PixelDay {
    date: Date;
    mood?: MoodEntry;
    color?: string;
}

export const getPixelData = (moods: MoodEntry[]): PixelDay[] => {
    const now = new Date();
    const startDate = subDays(now, 29); // Last 30 days
    const days = eachDayOfInterval({ start: startDate, end: now });

    return days.map(day => {
        const dayMoods = moods.filter(m => isSameDay(new Date(m.timestamp), day));
        const latestMood = dayMoods.sort((a, b) => b.timestamp - a.timestamp)[0];

        let color: string | undefined;
        if (latestMood) {
            const config = MOOD_CONFIGS.find(c => c.level === latestMood.level);
            color = config?.color;
        }

        return {
            date: day,
            mood: latestMood,
            color
        };
    });
};

export const getMonthlyPixelData = (moods: MoodEntry[], month: number, year: number): PixelDay[] => {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const dayMoods = moods.filter(m => isSameDay(new Date(m.timestamp), day));
        const latestMood = dayMoods.sort((a, b) => b.timestamp - a.timestamp)[0];

        let color: string | undefined;
        if (latestMood) {
            const config = MOOD_CONFIGS.find(c => c.level === latestMood.level);
            color = config?.color;
        }

        return {
            date: day,
            mood: latestMood,
            color
        };
    });
};
