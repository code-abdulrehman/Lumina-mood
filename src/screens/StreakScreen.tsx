import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { format, subDays, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { Flame, Star, Trophy, Target, Share2, Sparkles, Award, Zap, ChevronLeft, ChevronRight, LayoutGrid, Calendar } from 'lucide-react-native';
import { getMonthlyPixelData } from '../utils/patternAnalyzer';
import { MOOD_CONFIGS } from '../data/moods';
import MoodIcon from '../components/MoodIcon';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StreakScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, theme, primaryColor } = useMood();
    const viewShotRef = useRef(null);
    const shareRef = useRef(null);
    const [viewDate, setViewDate] = React.useState(new Date());

    const pixelData = React.useMemo(() => {
        return getMonthlyPixelData(moods, viewDate.getMonth(), viewDate.getFullYear());
    }, [moods, viewDate]);

    const changeMonth = (offset: number) => {
        setViewDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    // 1. FILTERED DATA FOR SELECTED MONTH
    const monthMoods = React.useMemo(() => {
        return moods.filter(m => isSameMonth(new Date(m.timestamp), viewDate));
    }, [moods, viewDate]);

    // 2. MONTH-SPECIFIC STATS
    const stats = React.useMemo(() => {
        const totalLogs = monthMoods.length;
        const level = Math.ceil(totalLogs / 5) || 1;

        // Find top 3 dominant moods
        const counts = monthMoods.reduce((acc, m) => {
            acc[m.level] = (acc[m.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sortedMoods = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topMoodConfigs = sortedMoods.slice(0, 3).map(m => MOOD_CONFIGS.find(c => c.level === m[0])).filter(Boolean);
        const topConfig = topMoodConfigs[0];

        // Calculate Longest Streak in this month
        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(viewDate),
            end: endOfMonth(viewDate)
        });

        let maxStreak = 0;
        let currentStreak = 0;

        daysInMonth.forEach(day => {
            const hasActivity = moods.some(m => isSameDay(new Date(m.timestamp), day));
            if (hasActivity) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        return { totalLogs, level, maxStreak, topConfig, topMoodConfigs };
    }, [monthMoods, viewDate, moods]);

    const hasMoodOnDay = (date: Date) => {
        return moods.some(m => isSameDay(new Date(m.timestamp), date));
    };

    const handleShareStreak = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 1.0,
            });

            if (Platform.OS === 'web') {
                const text = `🔥 I achieved a ${stats.maxStreak}-day streak in ${format(viewDate, 'MMMM')} on Lumina Mood! 🧘‍♂️✨`;
                await Share.share({ message: text });
                return;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Achievement Card',
                    UTI: 'public.png',
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Share Error", "Failed to capture streak card.");
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Streak</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your daily emotional persistence.</Text>
                </View>

                {/* PREMIUM STREAK CARD WRAPPED IN VIEWSHOT */}
                <View style={styles.cardWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                        <View style={[styles.streakCard, { backgroundColor: primaryColor, borderRadius: 0 }]} ref={shareRef}>
                            <View style={[styles.circleOverlay, { top: -40, left: -40 }]} />
                            <View style={[styles.circleOverlay, { bottom: -60, right: -40, width: 150, height: 150, opacity: 0.1 }]} />

                            <View style={styles.cardHeader}>
                                <View style={styles.badgeWrapper}>
                                    <View style={styles.miniBadge}>
                                        <Award size={10} color={primaryColor} />
                                        <Text style={[styles.miniBadgeText, { color: primaryColor }]}>Verified</Text>
                                    </View>
                                </View>
                                <Sparkles size={24} color="#FFF" opacity={0.6} />
                            </View>

                            <View style={styles.streakContent}>
                                <View style={styles.topMoodsTContainer}>
                                    {stats.topMoodConfigs && stats.topMoodConfigs.length > 0 ? (
                                        stats.topMoodConfigs.length === 1 ? (
                                            <View style={styles.singleMoodCenter}>
                                                <MoodIcon
                                                    iconName={stats.topMoodConfigs[0]?.icon || ''}
                                                    size={48}
                                                    color="#FFF"
                                                    customImage={stats.topMoodConfigs[0]?.customImage}
                                                />
                                            </View>
                                        ) : (
                                            <View style={styles.triLayout}>
                                                {/* Top Mood */}
                                                <View style={styles.triTop}>
                                                    <MoodIcon
                                                        iconName={stats.topMoodConfigs[0]?.icon || ''}
                                                        size={36}
                                                        color="#FFF"
                                                        customImage={stats.topMoodConfigs[0]?.customImage}
                                                    />
                                                </View>
                                                <View style={styles.triBottomRow}>
                                                    {/* Left Bottom */}
                                                    <View style={styles.triBottomIcon}>
                                                        <MoodIcon
                                                            iconName={stats.topMoodConfigs[1]?.icon || ''}
                                                            size={36}
                                                            color="#FFF"
                                                            customImage={stats.topMoodConfigs[1]?.customImage}
                                                        />
                                                    </View>
                                                    {/* Right Bottom */}
                                                    {stats.topMoodConfigs[2] && (
                                                        <View style={styles.triBottomIcon}>
                                                            <MoodIcon
                                                                iconName={stats.topMoodConfigs[2]?.icon || ''}
                                                                size={36}
                                                                color="#FFF"
                                                                customImage={stats.topMoodConfigs[2]?.customImage}
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )
                                    ) : (
                                        <View style={styles.triTop}>
                                            <Flame size={48} color="#FFF" fill="#FFF" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.streakTextGroup}>
                                    <Text style={styles.streakNumber}>{stats.maxStreak}</Text>
                                    <View style={styles.streakLabelRow}>
                                        <Text style={styles.streakLabel}>Peak Streak</Text>
                                        <View style={styles.smallDot} />
                                        <Text style={styles.streakLabel}>{format(viewDate, 'MMM')}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.footerBranding}>
                                    <Text style={styles.brandingText}>LUMINA MOOD</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.brandingText}>{format(new Date(), 'yyyy')}</Text>
                                </View>
                            </View>
                        </View>
                    </ViewShot>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={handleShareStreak}
                        style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                        <Share2 size={18} color={primaryColor} />
                        <Text style={[styles.actionBtnText, { color: primaryColor }]}>Share Achievement</Text>
                    </TouchableOpacity>
                </View>

                {/* INTERACTIVE MONTHLY PIXEL CHART */}
                <View style={styles.pixelSection}>
                    <View style={styles.sectionHeader}>
                        <Calendar size={18} color={primaryColor} />
                        <View style={styles.headerTitleRow}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Monthly Pixels</Text>
                            <View style={styles.monthControls}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                                    <ChevronLeft size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.monthLabel, { color: theme.text }]}>{format(viewDate, 'MMM yyyy')}</Text>
                                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                                    <ChevronRight size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.pixelGrid, { backgroundColor: theme.card, borderRadius: 32 }]}>
                        {pixelData.map((day, idx) => {
                            const config = day.mood ? MOOD_CONFIGS.find(c => c.level === day.mood?.level) : null;
                            return (
                                <View key={idx} style={[styles.pixelBox, !config && { backgroundColor: theme.primary + '15' }, config && { backgroundColor: config.color + '65', borderRadius: 12 }]}>
                                    {config ? (
                                        <MoodIcon
                                            iconName={config.icon}
                                            size={26}
                                            color={config.color}
                                            customImage={config.customImage}
                                            strokeWidth={2}
                                        />
                                    ) : (
                                        <Text style={[styles.pixelDateNum, { color: theme.textSecondary + '40' }]}>{format(day.date, 'd')}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>Tap boxes to see your mood history across time.</Text>
                </View>

                {/* STATS OVERVIEW */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 24 }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalLogs}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Month Logs</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 24 }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>Lv. {stats.level}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Month Score</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 34, fontWeight: '900' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    cardWrapper: { marginBottom: 20, borderRadius: 36, overflow: 'hidden' },
    streakCard: { padding: 30, position: 'relative', overflow: 'hidden' },
    circleOverlay: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', opacity: 0.1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    badgeWrapper: { flexDirection: 'row' },
    miniBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    miniBadgeText: { fontSize: 10, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
    streakContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
    topMoodsTContainer: {
        width: 100,
        height: 100,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    singleMoodCenter: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    triLayout: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    triTop: {
        marginBottom: 2,
    },
    triBottomRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    triBottomIcon: {
        marginHorizontal: 2,
    },
    statGlowFace: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakTextGroup: { alignItems: 'flex-start' },
    streakNumber: { fontSize: 72, fontWeight: '900', color: '#FFF', lineHeight: 72 },
    streakLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    streakLabel: { fontSize: 13, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 },
    smallDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.5 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 20, alignItems: 'center' },
    footerBranding: { flexDirection: 'row', alignItems: 'center' },
    brandingText: { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 1.5, opacity: 0.7 },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.7 },

    actionRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, borderWidth: 1 },
    actionBtnText: { fontSize: 14, fontWeight: '800', marginLeft: 10 },

    pixelSection: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
    headerTitleRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 8 },
    monthControls: { flexDirection: 'row', alignItems: 'center' },
    navBtn: { padding: 4 },
    monthLabel: { fontSize: 13, fontWeight: '800', marginHorizontal: 12, textTransform: 'uppercase', letterSpacing: 1 },
    pixelGrid: {
        padding: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    pixelBox: {
        width: (SCREEN_WIDTH - 80) / 7 - 4,
        height: (SCREEN_WIDTH - 80) / 7 - 4,
        margin: 2,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pixelDateNum: { fontSize: 9, fontWeight: '700' },
    helperText: { fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 12, opacity: 0.6 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, paddingVertical: 24, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    statValue: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }
});
