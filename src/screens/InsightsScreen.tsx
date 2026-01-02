import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { MoodLevel } from '../types/mood';
import { analyzeMoodPatterns, getMoodDistribution, getTrendActivity } from '../utils/patternAnalyzer';
import { InsightCard } from '../components/InsightCard';
import { BrainCircuit, TrendingUp, Calendar, PieChart, Share2, Sparkles, Zap, Award, Clock, Target } from 'lucide-react-native';
import { MOOD_CONFIGS } from '../data/moods';
import MoodIcon from '../components/MoodIcon';
import { subDays, subMonths, subYears, isAfter, format, startOfToday } from 'date-fns';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterRange = '7d' | '1m' | '1y' | 'all';

export const InsightsScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, primaryColor, theme } = useMood();
    const [range, setRange] = useState<FilterRange>('7d');
    const reportRef = useRef(null);
    const shareRef = useRef(null);
    const [showAllDistribution, setShowAllDistribution] = useState(false);

    const filteredMoods = useMemo(() => {
        const now = new Date();
        let cutoff: Date | null = null;
        if (range === '7d') cutoff = subDays(now, 7);
        else if (range === '1m') cutoff = subMonths(now, 1);
        else if (range === '1y') cutoff = subYears(now, 1);
        if (!cutoff) return moods;
        return moods.filter(m => isAfter(new Date(m.timestamp), cutoff!));
    }, [moods, range]);

    const reportData = useMemo(() => {
        if (filteredMoods.length === 0) return null;
        const dist = getMoodDistribution(filteredMoods);
        const topMood = dist[0];
        const moodConfig = MOOD_CONFIGS.find(c => c.level === topMood?.level);
        const activeDist = dist.filter(d => d.count > 0);
        const topMoodConfigs = activeDist.slice(0, 3).map(d => MOOD_CONFIGS.find(c => c.level === d.level)).filter(Boolean);
        const rangeLabel = range === '7d' ? '7-Day' : range === '1m' ? 'Monthly' : range === '1y' ? 'Yearly' : 'All-Time';
        return {
            title: `${rangeLabel} Pulse`,
            summary: `${filteredMoods.length} entries recorded.`,
            count: filteredMoods.length,
            mainMoodLabel: topMood?.label || 'Steady',
            mainMoodColor: moodConfig?.color || primaryColor,
            topConfig: moodConfig,
            topMoodConfigs: topMoodConfigs,
            dateRange: range === 'all' ? 'Universal History' : `${format(subDays(startOfToday(), range === '7d' ? 7 : range === '1m' ? 30 : range === '1y' ? 365 : 0), 'MMM d')} — Present`
        };
    }, [filteredMoods, range, primaryColor]);

    const insights = useMemo(() => analyzeMoodPatterns(filteredMoods), [filteredMoods]);
    const distribution = useMemo(() => getMoodDistribution(filteredMoods), [filteredMoods]);
    const trendData = useMemo(() => getTrendActivity(filteredMoods, range), [filteredMoods, range]);

    const timeOfDayData = useMemo(() => {
        const buckets: Record<string, { count: number, moods: MoodLevel[] }> = {
            morning: { count: 0, moods: [] },
            afternoon: { count: 0, moods: [] },
            evening: { count: 0, moods: [] },
            night: { count: 0, moods: [] }
        };
        filteredMoods.forEach(m => {
            const hour = new Date(m.timestamp).getHours();
            let key = 'night';
            if (hour >= 5 && hour < 12) key = 'morning';
            else if (hour >= 12 && hour < 17) key = 'afternoon';
            else if (hour >= 17 && hour < 21) key = 'evening';
            buckets[key].count++;
            buckets[key].moods.push(m.level);
        });
        return Object.entries(buckets).map(([key, data]) => {
            const counts = data.moods.reduce((acc, m) => {
                const moodKey = m as string;
                acc[moodKey] = (acc[moodKey] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            const dominant = sortedCounts.length > 0 ? sortedCounts[0][0] as MoodLevel : undefined;
            return { label: key, count: data.count, moodLevel: dominant };
        });
    }, [filteredMoods]);

    const handleShareReport = async () => {
        try {
            const uri = await captureRef(reportRef, { format: 'png', quality: 1.0 });
            if (Platform.OS === 'web') {
                const text = `📊 My Feeling ${reportData?.title}\n${reportData?.summary}\nMood: ${reportData?.mainMoodLabel}`;
                await Share.share({ message: text });
                return;
            }
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Share ${reportData?.title}`, UTI: 'public.png' });
            }
        } catch (e) {
            Alert.alert("Share Error", "Failed to capture report card.");
        }
    };

    const FilterBtn = ({ label, value }: { label: string, value: FilterRange }) => (
        <TouchableOpacity
            onPress={() => setRange(value)}
            style={[
                styles.filterBtn,
                { backgroundColor: range === value ? primaryColor : theme.card },
                range === value ? styles.filterBtnActive : { borderColor: theme.border, borderWidth: 1 }
            ]}
        >
            <Text style={[styles.filterText, { color: range === value ? '#fff' : theme.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Patterns focused on your persistence.</Text>
                </View>

                <View style={styles.filterRow}>
                    <FilterBtn label="7D" value="7d" />
                    <FilterBtn label="1M" value="1m" />
                    <FilterBtn label="1Y" value="1y" />
                    <FilterBtn label="All" value="all" />
                </View>

                {reportData && (
                    <View style={styles.cardContainer3D}>
                        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                            <ViewShot ref={reportRef} options={{ format: 'png', quality: 1.0 }}>
                                <View style={[styles.premiumCard, { backgroundColor: primaryColor }]} ref={shareRef}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.miniBadge}>
                                            <Award size={12} color="#FFF" />
                                            <Text style={styles.miniBadgeText}>ANALYTICS</Text>
                                        </View>
                                        <Text style={styles.dateRangeText}>{reportData.dateRange}</Text>
                                    </View>

                                    <View style={styles.heroSection}>
                                        <Text style={styles.heroValue}>{reportData.mainMoodLabel}</Text>
                                        <Text style={styles.heroSubLabel}>DOMINANT FLOW</Text>
                                    </View>

                                    <View style={styles.statsMiniRow}>
                                        <View style={styles.miniStat}>
                                            <Text style={styles.miniStatValue}>{reportData.count}</Text>
                                            <Text style={styles.miniStatLabel}>LOGS</Text>
                                        </View>
                                        <View style={styles.miniDivider} />
                                        <View style={styles.miniStat}>
                                            <Text style={styles.miniStatValue}>{range.toUpperCase()}</Text>
                                            <Text style={styles.miniStatLabel}>WINDOW</Text>
                                        </View>
                                    </View>

                                    <View style={styles.footerSection}>
                                        <View style={styles.footerIcons}>
                                            {reportData.topMoodConfigs.slice(0, 3).map((cfg, i) => (
                                                <View key={i} style={[styles.stackedIcon, { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }]}>
                                                    <MoodIcon iconName={cfg?.icon || ''} size={22} color="#FFF" customImage={cfg?.customImage} />
                                                </View>
                                            ))}
                                        </View>
                                        <View style={styles.brandTag}>
                                            <Zap size={10} color="#FFF" fill="#FFF" />
                                            <Text style={styles.brandTagText}>FEELING INSIGHTS</Text>
                                        </View>
                                    </View>
                                </View>
                            </ViewShot>
                        </View>
                    </View>
                )}

                {reportData && (
                    <TouchableOpacity
                        onPress={handleShareReport}
                        style={[styles.shareAction, { backgroundColor: primaryColor }]}
                        activeOpacity={0.8}
                    >
                        <Share2 size={18} color="#FFF" />
                        <Text style={styles.shareActionText}>Share {range === '7d' ? '7D' : range.toUpperCase()} Report</Text>
                    </TouchableOpacity>
                )}

                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <PieChart size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Mood Distribution</Text>
                        </View>
                        <View style={[styles.contentBox, { backgroundColor: theme.card }]}>
                            {distribution.filter(d => d.count > 0).map((item, idx) => {
                                const config = MOOD_CONFIGS.find(c => c.level === item.level);
                                return (
                                    <View key={idx} style={styles.barContainer}>
                                        <View style={styles.barLabels}>
                                            <View style={styles.barLabelRow}>
                                                <MoodIcon iconName={config?.icon || ''} size={18} color={theme.text} customImage={config?.customImage} />
                                                <Text style={[styles.labelMain, { color: theme.text }]}>{config?.label}</Text>
                                            </View>
                                            <Text style={[styles.labelSub, { color: theme.textSecondary }]}>{item.percentage}%</Text>
                                        </View>
                                        <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                                            <View style={[styles.barFill, { width: `${item.percentage}%`, backgroundColor: config?.color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Calendar size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Activity Flow</Text>
                        </View>
                        <View style={[styles.contentBox, styles.chartBox, { backgroundColor: theme.card }]}>
                            {trendData.map((item, idx) => {
                                const max = Math.max(...trendData.map(d => d.count)) || 1;
                                const fill = (item.count / max);
                                const config = MOOD_CONFIGS.find(c => c.level === item.moodLevel);
                                return (
                                    <View key={idx} style={styles.chartCol}>
                                        <View style={[styles.timeBarBg, { backgroundColor: theme.border, height: 80, width: 10 }]}>
                                            <View style={[
                                                styles.timeBarFill,
                                                { height: `${fill * 100}%`, backgroundColor: config?.color || theme.border, opacity: item.count > 0 ? 1 : 0.3 }
                                            ]} />
                                        </View>
                                        <Text style={[styles.chartDay, { color: theme.textSecondary }]}>{item.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Clock size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Mood by Time</Text>
                        </View>
                        <View style={[styles.contentBox, { backgroundColor: theme.card }]}>
                            <View style={styles.timeRow}>
                                {timeOfDayData.map((item, idx) => {
                                    const max = Math.max(...timeOfDayData.map(d => d.count)) || 1;
                                    const fill = (item.count / max);
                                    const config = MOOD_CONFIGS.find(c => c.level === item.moodLevel);
                                    return (
                                        <View key={idx} style={styles.timeCol}>
                                            <View style={[styles.timeBarBg, { backgroundColor: theme.border }]}>
                                                <View style={[
                                                    styles.timeBarFill,
                                                    { height: `${fill * 100}%`, backgroundColor: config?.color || theme.border, opacity: item.count > 0 ? 1 : 0.3 }
                                                ]} />
                                            </View>
                                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{item.label.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <TrendingUp size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Mindfulness Logic</Text>
                        </View>
                        {insights.length > 0 ? (
                            insights.map((insight, index) => (
                                <InsightCard key={index} insight={insight} />
                            ))
                        ) : (
                            <View style={[styles.contentBox, { padding: 24, backgroundColor: theme.card }]}>
                                <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Keep logging to see "{range.toUpperCase()}" patterns.</Text>
                            </View>
                        )}
                    </View>
                )}

                {filteredMoods.length === 0 && (
                    <View style={styles.empty}>
                        <BrainCircuit size={64} color={theme.border} style={{ marginBottom: 16 }} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No mood entries found for the {range.toUpperCase()} range.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 32, fontWeight: '900' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 20,
    },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
    filterBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    filterText: { fontSize: 12, fontWeight: '800' },

    // 3D EFFECT CONTAINER
    cardContainer3D: {
        marginBottom: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 15,
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 4,
    },
    premiumCard: {
        padding: 20,
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomWidth: 4,
        borderRightWidth: 2,
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
    dateRangeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
        opacity: 0.8,
        letterSpacing: 0.5,
    },

    heroSection: {
        alignItems: 'center',
        marginBottom: 15,
    },
    heroValue: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFF',
        opacity: 0.9,
        marginTop: -2,
        letterSpacing: 4,
    },

    statsMiniRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: 15,
        marginBottom: 20,
    },
    miniStat: {
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    miniStatValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
    },
    miniStatLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: '#FFF',
        opacity: 0.7,
        letterSpacing: 1.5,
        marginTop: 2,
    },
    miniDivider: {
        width: 1.5,
        height: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    footerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    footerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stackedIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    brandTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    brandTagText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1.5,
        marginLeft: 4,
        opacity: 0.9,
    },

    section: { marginBottom: 32 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
    contentBox: { borderRadius: 24, padding: 20 },
    barContainer: { marginBottom: 12 },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    barLabelRow: { flexDirection: 'row', alignItems: 'center' },
    labelMain: { fontSize: 13, fontWeight: '700' },
    labelSub: { fontSize: 13, fontWeight: '700' },
    barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    shareAction: { height: 50, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    shareActionText: { color: '#FFF', fontSize: 14, fontWeight: '800', marginLeft: 10 },

    chartBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    chartCol: { alignItems: 'center', flex: 1 },
    barArea: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: 10, borderRadius: 5 },
    chartDay: { marginTop: 10, fontSize: 11, fontWeight: '800' },

    timeRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 },
    timeCol: { alignItems: 'center' },
    timeBarBg: { width: 12, height: 60, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    timeBarFill: { width: '100%', borderRadius: 6 },
    timeLabel: { fontSize: 10, fontWeight: '800', marginTop: 8 },

    empty: { marginTop: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 }
});
