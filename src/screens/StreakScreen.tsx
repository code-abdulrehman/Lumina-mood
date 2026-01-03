import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMood } from '../context/MoodContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, addDays } from 'date-fns';
import { Flame, Share2, Award, Zap, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { getMonthlyPixelData, calculateStreak } from '../utils/patternAnalyzer';
import { MOOD_CONFIGS } from '../data/moods';
import MoodIcon from '../components/MoodIcon';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StreakScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { moods, theme, primaryColor } = useMood();
    const viewShotRef = useRef(null);
    const shareRef = useRef(null);
    const [viewDate, setViewDate] = React.useState(new Date());

    const timelineDays = React.useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const offset = i - 3;
        return addDays(new Date(), offset);
    }), []);

    const pixelData = React.useMemo(() => {
        return getMonthlyPixelData(moods, viewDate.getMonth(), viewDate.getFullYear());
    }, [moods, viewDate]);

    const changeMonth = (offset: number) => {
        setViewDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    const hasMoodOnDay = (date: Date) => {
        return moods.some(m => isSameDay(new Date(m.timestamp), date));
    };

    const stats = React.useMemo(() => {
        const currentStreak = calculateStreak(moods);
        const totalLogs = moods.length;
        const level = Math.ceil(totalLogs / 5) || 1;

        // Month specific moods for the card display context if needed
        const monthMoods = moods.filter(m => isSameMonth(new Date(m.timestamp), viewDate));
        const counts = monthMoods.reduce((acc, m) => {
            acc[m.level] = (acc[m.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sortedMoods = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topMoodConfigs = sortedMoods.slice(0, 3).map(m => MOOD_CONFIGS.find(c => c.level === m[0])).filter(Boolean);

        return { totalLogs, level, maxStreak: currentStreak, topMoodConfigs };
    }, [moods, viewDate]);

    const handleShareStreak = async () => {
        try {
            const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 });
            if (Platform.OS === 'web') {
                const text = `🔥 I achieved a ${stats.maxStreak}-day streak in ${format(viewDate, 'MMMM')} on Lumina Mood! 🧘‍♂️✨`;
                await Share.share({ message: text });
                return;
            }
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Achievement Card', UTI: 'public.png' });
            }
        } catch (e) {
            Alert.alert("Share Error", "Failed to capture streak card.");
        }
    };

    const handlePixelClick = (day: { date: Date; mood?: any }) => {
        // Only navigate if this day has mood data
        if (day.mood) {
            (navigation as any).navigate('History', { scrollToDate: format(day.date, 'yyyy-MM-dd') });
        }
    };

    return (
        <ScreenWrapper>
            <View style={[styles.mainContainer, { backgroundColor: 'transparent', paddingTop: insets.top || 20 }]}>
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={[styles.title, { color: theme.text }]}>Streak</Text>
                        </View>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your daily emotional persistence.</Text>
                    </View>

                    {/* SMALL, MINIMAL 3D ACHIEVMENT CARD */}
                    <View style={styles.cardContainer3D}>
                        <View style={{ borderRadius: 25, overflow: 'hidden' }}>
                            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                                <View style={[styles.streakCard, { backgroundColor: primaryColor }]} ref={shareRef}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.miniBadge}>
                                            <Award size={12} color="#FFF" />
                                            <Text style={styles.miniBadgeText}>VERIFIED</Text>
                                        </View>
                                        <Text style={styles.cardMonthLabel}>{format(viewDate, 'MMM yyyy')}</Text>
                                    </View>

                                    <View style={styles.heroSection}>
                                        <View style={styles.streakDisplay}>
                                            <Text style={styles.streakValue}>{stats.maxStreak}</Text>
                                            <Flame size={24} color="#FFF" fill="#FFF" style={styles.flameIcon} />
                                        </View>
                                        <Text style={styles.heroLabel}>STREAK FOCUS</Text>
                                    </View>

                                    <View style={styles.bottomSection}>
                                        <View style={styles.moodStack}>
                                            {stats.topMoodConfigs.slice(0, 3).map((cfg, i) => (
                                                <View key={i} style={[styles.miniMoodWrapper, { marginLeft: i === 0 ? 0 : -18, zIndex: 10 - i }]}>
                                                    <MoodIcon
                                                        iconName={cfg?.icon || ''}
                                                        size={32}
                                                        color={cfg?.color || '#FFF'}
                                                        customImage={cfg?.customImage}
                                                    />
                                                </View>
                                            ))}
                                        </View>
                                        <View style={styles.brandBadge}>
                                            <Zap size={12} color="#FFF" fill="#FFF" />
                                            <Text style={styles.brandText}>LUMINA</Text>
                                        </View>
                                    </View>
                                </View>
                            </ViewShot>
                        </View>
                    </View>

                    {/* ACTION BUTTONS */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            onPress={handleShareStreak}
                            style={[styles.actionBtn, { backgroundColor: theme.card }]}
                        >
                            <Share2 size={18} color={theme.primary} />
                            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Share Streak</Text>
                        </TouchableOpacity>
                    </View>

                    {/* UNIQUE VERTICAL PILL TRACKER - RESTORED */}
                    <View style={styles.timelineSection}>
                        <View style={styles.sectionHeader}>
                            <Zap size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Weekly Persistence</Text>
                        </View>

                        <View style={[styles.pillBoard, { backgroundColor: theme.card, borderRadius: 32 }]}>
                            {timelineDays.map((day, index) => {
                                const active = hasMoodOnDay(day);
                                const isToday = index === 3;

                                return (
                                    <View key={index} style={styles.pillCol}>
                                        <View style={[
                                            styles.pillContainer,
                                            { backgroundColor: theme.border + '15', borderColor: active ? primaryColor : 'transparent' }
                                        ]}>
                                            <View style={[styles.pillFill, { backgroundColor: active ? primaryColor : "transparent" }]}>
                                                <Flame
                                                    size={16}
                                                    color={active ? "#FFF" : theme.textSecondary + '40'}
                                                    fill={active ? "#FFF" : "transparent"}
                                                />
                                            </View>
                                            <Text style={[
                                                styles.pillDate,
                                                { color: active ? primaryColor : theme.textSecondary },
                                                active && { marginBottom: 4 }
                                            ]}>
                                                {format(day, 'd')}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.pillDayName,
                                            { color: isToday ? primaryColor : theme.textSecondary, fontWeight: isToday ? '900' : '600' }
                                        ]}>
                                            {format(day, 'EEE')[0]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* INTERACTIVE MONTHLY PIXEL CHART - ADDED BACK */}
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

                        <View style={[styles.pixelGrid, { backgroundColor: theme.card, borderRadius: 24 }]}>
                            {pixelData.map((day, idx) => {
                                const config = day.mood ? MOOD_CONFIGS.find(c => c.level === day.mood?.level) : null;
                                const hasData = !!config;

                                const PixelContent = (
                                    <View style={[styles.pixelBox, { borderWidth: 1, borderColor: new Date(day.date).getDate() === new Date().getDate() ? theme.primary : 'transparent' }, !config && { backgroundColor: theme.primary + '15' }, config && { backgroundColor: config.color + '65', borderRadius: 10}]}>
                                        {config ? (
                                            <MoodIcon iconName={config.icon} size={22} color={config.color} customImage={config.customImage} strokeWidth={2} />
                                        ) : (
                                            <Text style={[styles.pixelDateNum, { color: new Date(day.date).getDate() === new Date().getDate() ? theme.primary : theme.textSecondary + '70' }]}>{format(day.date, 'd')}</Text>
                                        )}
                                    </View>
                                );

                                return hasData ? (
                                    <TouchableOpacity key={idx} onPress={() => handlePixelClick(day)} activeOpacity={0.7}>
                                        {PixelContent}
                                    </TouchableOpacity>
                                ) : (
                                    <View key={idx}>
                                        {PixelContent}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 20 }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{moods.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Logs</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 20 }]}>
                            <Text style={[styles.statValue, { color: theme.text }]}>Lv. {Math.ceil(moods.length / 5)}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Habit</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 10 },
    title: { fontSize: 32, fontWeight: '900' },
    subtitle: { fontSize: 15, fontWeight: '500' },

    // 3D EFFECT CONTAINER
    cardContainer3D: {
        marginBottom: 30,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 15,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 4,
    },
    streakCard: {
        padding: 20,
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    miniBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    cardMonthLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
        opacity: 0.8,
        letterSpacing: 0.5,
    },

    heroSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    streakDisplay: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    streakValue: {
        fontSize: 72,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 72,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
    },
    flameIcon: {
        marginTop: 8,
        marginLeft: 4,
    },
    heroLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 6,
        marginTop: -2,
        opacity: 0.9,
    },

    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    moodStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stackedIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 6,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    brandBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    brandText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
        marginLeft: 4,
    },

    actionRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 1 },
    actionBtnText: { fontSize: 14, fontWeight: '800', marginLeft: 10 },

    timelineSection: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },

    miniMoodWrapper: {
        width: 36,
        height: 36,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#F8F9FA',
    },
    // UNIQUE PILL BOARD DESIGN
    pillBoard: {
        paddingVertical: 28,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
    },
    pillCol: { alignItems: 'center', flex: 1 },
    pillContainer: {
        width: 32,
        height: 80,
        borderRadius: 16,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillFill: {
        width: '100%',
        height: '65%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    pillDate: { fontSize: 12, fontWeight: '900', marginTop: 4 },
    pillDayName: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

    pixelSection: { marginBottom: 32 },
    pixelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
    headerTitleRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 8 },
    monthControls: {
        flexDirection: 'row', alignItems: 'center'
    },
    navBtn: { padding: 4 },
    monthLabel: { width: 80, fontSize: 13, fontWeight: '800', marginHorizontal: 12, textTransform: 'uppercase', letterSpacing: 1 },
    pixelGrid: {
        padding: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
    },
    pixelBox: { width: (SCREEN_WIDTH - 70) / 7 - 4, height: (SCREEN_WIDTH - 70) / 7 - 4, margin: 2, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    pixelDateNum: { fontSize: 9, fontWeight: '700' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: {
        flex: 1, paddingVertical: 24, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
    },
    statValue: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }
});
