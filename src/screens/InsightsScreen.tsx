import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { analyzeMoodPatterns, getMoodDistribution, getTrendActivity } from '../utils/patternAnalyzer';
import { InsightCard } from '../components/InsightCard';
import { BrainCircuit, TrendingUp, Calendar, PieChart, FileText, Share2, Sparkles, CheckCircle2, Zap, Award } from 'lucide-react-native';
import { MOOD_CONFIGS } from '../data/moods';
import { subDays, subMonths, subYears, isAfter, isToday, format, startOfToday } from 'date-fns';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterRange = '7d' | '1m' | '1y' | 'all';

export const InsightsScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, primaryColor, theme } = useMood();
    const [range, setRange] = useState<FilterRange>('7d');
    const reportRef = useRef(null);

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
            const uri = await captureRef(reportRef, { format: 'png', quality: 1.0 });
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
                range === value ? { backgroundColor: primaryColor } : { backgroundColor: theme.darkGlass }
            ]}
        >
            <Text style={[
                styles.filterText,
                { color: range === value ? '#fff' : theme.textSecondary }
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.mainContainer}>
            {/* AMBIENT BACKGROUND */}
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '10', top: -100, right: -100 }]} />
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '05', bottom: -50, left: -50, width: 400, height: 400 }]} />

            <ScrollView
                onScroll={(e) => { }}
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Neural patterns & emotional intelligence.</Text>
                </View>

                {/* RANGE FILTERS */}
                <BlurView intensity={30} tint="light" style={[styles.filterRow, { borderColor: theme.glassBorder }]}>
                    <FilterBtn label="7D" value="7d" />
                    <FilterBtn label="1M" value="1m" />
                    <FilterBtn label="1Y" value="1y" />
                    <FilterBtn label="All" value="all" />
                </BlurView>

                {/* PREMIUM ANALYTICS CARD */}
                {reportData && (
                    <View style={styles.cardWrapper}>
                        <ViewShot ref={reportRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={[styles.premiumCard, { backgroundColor: primaryColor, borderRadius: 32 }]}>
                                <View style={[styles.circleOverlay, { top: -40, left: -40 }]} />
                                <View style={styles.cardTop}>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.miniBadge}>
                                            <Award size={10} color={primaryColor} />
                                            <Text style={[styles.miniBadgeText, { color: primaryColor }]}>Neural Verfied</Text>
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
                                        <Text style={styles.brandTag}>LUMINA NEURAL</Text>
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
                        <Text style={styles.shareActionText}>Export Intelligence</Text>
                    </TouchableOpacity>
                )}

                {/* MOOD DISTRIBUTION - GLASS */}
                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <PieChart size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Distribution</Text>
                        </View>
                        <BlurView intensity={40} tint="light" style={[styles.contentBox, { borderColor: theme.glassBorder }]}>
                            {distribution.map((item, idx) => {
                                const config = MOOD_CONFIGS.find(c => c.level === item.level);
                                return (
                                    <View key={idx} style={styles.barContainer}>
                                        <View style={styles.barLabels}>
                                            <Text style={[styles.labelMain, { color: theme.text }]}>{config?.label}</Text>
                                            <Text style={[styles.labelSub, { color: theme.textSecondary }]}>{item.percentage}%</Text>
                                        </View>
                                        <View style={[styles.barBg, { backgroundColor: theme.darkGlass }]}>
                                            <View style={[styles.barFill, { width: `${item.percentage}%`, backgroundColor: config?.color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </BlurView>
                    </View>
                )}

                {/* ACTIVITY FLOW - GLASS */}
                {filteredMoods.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHead}>
                            <Calendar size={18} color={primaryColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Activity Flow</Text>
                        </View>
                        <BlurView intensity={40} tint="light" style={[styles.contentBox, styles.chartBox, { borderColor: theme.glassBorder }]}>
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
                        </BlurView>
                    </View>
                )}

                {/* INSIGHTS */}
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
                            <BlurView intensity={40} tint="light" style={[styles.contentBox, { padding: 30, borderColor: theme.glassBorder }]}>
                                <Text style={{ color: theme.textSecondary, textAlign: 'center', fontWeight: '600' }}>Logging patterns pending...</Text>
                            </BlurView>
                        )}
                    </View>
                )}

                {filteredMoods.length === 0 && (
                    <View style={styles.empty}>
                        <BrainCircuit size={80} color={theme.border} style={{ marginBottom: 16 }} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Journal currently empty for this period.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 15, fontWeight: '600', opacity: 0.7 },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 28,
        padding: 6,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 18, alignItems: 'center' },
    filterText: { fontSize: 13, fontWeight: '800' },
    cardWrapper: { marginBottom: 20, borderRadius: 32, overflow: 'hidden' },
    premiumCard: { padding: 30, position: 'relative', overflow: 'hidden' },
    circleOverlay: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF', opacity: 0.1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    badgeRow: { flexDirection: 'row' },
    miniBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    miniBadgeText: { fontSize: 9, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
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
    reportRangeTitle: { fontSize: 12, fontWeight: '800', color: '#FFF', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    primaryMoodText: { fontSize: 26, fontWeight: '900', color: '#FFF' },
    cardBottom: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 20 },
    brandingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    brandTag: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 2, opacity: 0.8 },
    brandDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginHorizontal: 10, opacity: 0.8 },
    brandDate: { fontSize: 10, fontWeight: '800', color: '#FFF', opacity: 0.8 },
    shareAction: { height: 60, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    shareActionText: { color: '#FFF', fontSize: 15, fontWeight: '900', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 },
    section: { marginBottom: 36 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
    contentBox: { borderRadius: 28, padding: 24, borderWidth: 1, overflow: 'hidden' },
    barContainer: { marginBottom: 16 },
    barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    labelMain: { fontSize: 14, fontWeight: '800' },
    labelSub: { fontSize: 14, fontWeight: '800' },
    barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    chartBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
    chartCol: { alignItems: 'center', flex: 1 },
    barArea: { height: 100, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: 12, borderRadius: 6 },
    chartDay: { marginTop: 12, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    empty: { marginTop: 80, alignItems: 'center' },
    emptyText: { fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 60, lineHeight: 24 }
});
