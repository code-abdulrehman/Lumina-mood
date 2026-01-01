import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { analyzeMoodPatterns, getMoodDistribution, getTrendActivity } from '../utils/patternAnalyzer';
import { InsightCard } from '../components/InsightCard';
import { BrainCircuit, TrendingUp, Calendar, PieChart, FileText, Share2, Sparkles, CheckCircle2, Zap, Award } from 'lucide-react-native';
import { MOOD_CONFIGS } from '../data/moods';
import { subDays, subMonths, subYears, isAfter, isToday, format, startOfToday } from 'date-fns';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterRange = '7d' | '1m' | '1y' | 'all';

export const InsightsScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, primaryColor, theme } = useMood();
    const [range, setRange] = useState<FilterRange>('7d');
    const reportRef = useRef(null);

    // 1. FILTERED DATA (CRITICAL: All components must rely on this)
    const filteredMoods = useMemo(() => {
        const now = new Date();
        let cutoff: Date | null = null;

        if (range === '7d') cutoff = subDays(now, 7);
        else if (range === '1m') cutoff = subMonths(now, 1);
        else if (range === '1y') cutoff = subYears(now, 1);

        if (!cutoff) return moods;
        return moods.filter(m => isAfter(new Date(m.timestamp), cutoff!));
    }, [moods, range]);

    // 2. DERIVED ANALYTICS
    const reportData = useMemo(() => {
        if (filteredMoods.length === 0) return null;

        const dist = getMoodDistribution(filteredMoods);
        const topMood = dist[0];
        const moodConfig = MOOD_CONFIGS.find(c => c.label === topMood?.level);

        const rangeLabel = range === '7d' ? '7-Day' : range === '1m' ? 'Monthly' : range === '1y' ? 'Yearly' : 'All-Time';

        return {
            title: `${rangeLabel} Pulse`,
            summary: `${filteredMoods.length} entries recorded.`,
            count: filteredMoods.length,
            mainMoodLabel: topMood?.label || 'Steady',
            mainMoodColor: moodConfig?.color || primaryColor,
            dateRange: range === 'all' ? 'Universal History' : `${format(subDays(new Date(), range === '7d' ? 7 : range === '1m' ? 30 : range === '1y' ? 365 : 0), 'MMM d')} — Present`
        };
    }, [filteredMoods, range, primaryColor]);

    const insights = useMemo(() => analyzeMoodPatterns(filteredMoods), [filteredMoods]);
    const distribution = useMemo(() => getMoodDistribution(filteredMoods), [filteredMoods]);
    const trendData = useMemo(() => getTrendActivity(filteredMoods, range), [filteredMoods, range]);

    const handleShareReport = async () => {
        try {
            const uri = await captureRef(reportRef, {
                format: 'png',
                quality: 1.0,
            });

            if (Platform.OS === 'web') {
                const text = `📊 My Lumina ${reportData?.title}\n${reportData?.summary}\nMood: ${reportData?.mainMoodLabel}`;
                await Share.share({ message: text });
                return;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: `Share ${reportData?.title}`,
                    UTI: 'public.png',
                });
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
            <Text style={[
                styles.filterText,
                { color: range === value ? '#fff' : theme.textSecondary }
            ]}>{label}</Text>
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

                {/* RANGE FILTERS */}
                <View style={styles.filterRow}>
                    <FilterBtn label="7D" value="7d" />
                    <FilterBtn label="1M" value="1m" />
                    <FilterBtn label="1Y" value="1y" />
                    <FilterBtn label="All" value="all" />
                </View>

                {/* PREMIUM ANALYTICS CARD (STREAK-LIKE DESIGN) */}
                {reportData && (
                    <View style={styles.cardWrapper}>
                        <ViewShot ref={reportRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={[styles.premiumCard, { backgroundColor: primaryColor, borderRadius: 36 }]}>
                                {/* Visual Overlays */}
                                <View style={[styles.circleOverlay, { top: -40, left: -40 }]} />
                                <View style={[styles.circleOverlay, { bottom: -60, right: -40, width: 150, height: 150, opacity: 0.1 }]} />

                                <View style={styles.cardTop}>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.miniBadge}>
                                            <Award size={10} color={primaryColor} />
                                            <Text style={[styles.miniBadgeText, { color: primaryColor }]}>Verified</Text>
                                        </View>
                                    </View>
                                    <Sparkles size={24} color="#FFF" opacity={0.6} />
                                </View>

                                <View style={styles.cardMainContent}>
                                    <View style={styles.statGlowRing}>
                                        <View style={styles.statInnerCircle}>
                                            <Text style={styles.statBigNumber}>{reportData.count}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.reportTextGroup}>
                                        <Text style={styles.reportRangeTitle}>{reportData.title}</Text>
                                        <Text style={styles.primaryMoodText}>{reportData.mainMoodLabel}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardBottom}>
                                    <View style={styles.brandingRow}>
                                        <Text style={styles.brandTag}>LUMINA MOOD</Text>
                                        <View style={styles.brandDot} />
                                        <Text style={styles.brandDate}>{reportData.dateRange}</Text>
                                    </View>
                                </View>
                            </View>
                        </ViewShot>
                    </View>
                )}

                {reportData && (
                    <TouchableOpacity
                        onPress={handleShareReport}
                        style={[styles.shareAction, { backgroundColor: primaryColor }]}
                        activeOpacity={0.8}
                    >
                        <Share2 size={18} color="#FFF" />
                        <Text style={styles.shareActionText}>Export {range === '7d' ? '7D' : range.toUpperCase()} Report</Text>
                    </TouchableOpacity>
                )}

                {/* MOOD DISTRIBUTION - STRONGLY FILTERED */}
                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <PieChart size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Mood Distribution ({range.toUpperCase()})</Text>
                        </View>
                        <View style={[styles.contentBox, { backgroundColor: theme.card }]}>
                            {distribution.map((item, idx) => {
                                const config = MOOD_CONFIGS.find(c => c.level === item.level);
                                return (
                                    <View key={idx} style={styles.barContainer}>
                                        <View style={styles.barLabels}>
                                            <Text style={[styles.labelMain, { color: theme.text }]}>{config?.label}</Text>
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

                {/* ACTIVITY FLOW - STRONGLY FILTERED */}
                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Calendar size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Activity Flow</Text>
                        </View>
                        <View style={[styles.contentBox, styles.chartBox, { backgroundColor: theme.card }]}>
                            {trendData.map((item, idx) => {
                                const max = Math.max(...trendData.map(d => d.count)) || 1;
                                const h = (item.count / max) * 70;
                                return (
                                    <View key={idx} style={styles.chartCol}>
                                        <View style={styles.barArea}>
                                            <View style={[styles.bar, { height: h + 4, backgroundColor: primaryColor, opacity: item.count > 0 ? 1 : 0.3 }]} />
                                        </View>
                                        <Text style={[styles.chartDay, { color: theme.textSecondary }]}>{item.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                            Displaying recent activity patterns for the selected period.
                        </Text>
                    </View>
                )}

                {/* INSIGHTS - STRONGLY FILTERED */}
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

    // PREMIUM STREAK-STYLE CARD
    cardWrapper: { marginBottom: 20, borderRadius: 36, overflow: 'hidden' },
    premiumCard: { padding: 30, position: 'relative', overflow: 'hidden' },
    circleOverlay: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', opacity: 0.1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    badgeRow: { flexDirection: 'row' },
    miniBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    miniBadgeText: { fontSize: 10, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },

    cardMainContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    statGlowRing: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 6,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 24,
    },
    statInnerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBigNumber: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    reportTextGroup: { flex: 1 },
    reportRangeTitle: { fontSize: 13, fontWeight: '800', color: '#FFF', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    primaryMoodText: { fontSize: 24, fontWeight: '900', color: '#FFF' },

    cardBottom: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 20 },
    brandingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    brandTag: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1.5, opacity: 0.7 },
    brandDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.7 },
    brandDate: { fontSize: 10, fontWeight: '800', color: '#FFF', opacity: 0.7 },

    shareAction: { height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    shareActionText: { color: '#FFF', fontSize: 15, fontWeight: '800', marginLeft: 10 },

    section: { marginBottom: 32 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
    contentBox: { borderRadius: 24, padding: 20 },

    barContainer: { marginBottom: 12 },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    labelMain: { fontSize: 13, fontWeight: '700' },
    labelSub: { fontSize: 13, fontWeight: '700' },
    barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    chartBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    chartCol: { alignItems: 'center', flex: 1 },
    barArea: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: 10, borderRadius: 5 },
    chartDay: { marginTop: 10, fontSize: 11, fontWeight: '800' },

    helperText: { fontSize: 11, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
    empty: { marginTop: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 }
});
