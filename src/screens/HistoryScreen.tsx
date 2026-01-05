import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, SectionList } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { MoodRow } from '../components/MoodRow';
import { Input } from '../components/common/Input';
import { History as HistoryIcon, Search, Trash2, Calendar, CalendarDays, Clock } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { useNavigation, useRoute } from '@react-navigation/native';


export const HistoryScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, deleteMoodEntry, theme, primaryColor } = useMood();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const sectionListRef = useRef<SectionList>(null);

    const filteredMoods = useMemo(() => {
        if (!searchQuery) return moods;
        return moods.filter(m =>
            m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.chatHistory?.some(h => h.text.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [moods, searchQuery]);

    const groupedMoods = useMemo(() => {
        const sections: { title: string, data: any[] }[] = [];

        filteredMoods.forEach(m => {
            const date = new Date(m.timestamp);
            let title = '';

            if (isToday(date)) title = 'Today';
            else if (isYesterday(date)) title = 'Yesterday';
            else title = format(date, 'MMMM d, yyyy');

            let section = sections.find(s => s.title === title);
            if (!section) {
                section = { title, data: [] };
                sections.push(section);
            }
            section.data.push(m);
        });

        return sections;
    }, [filteredMoods]);

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this mood and its chat history?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMoodEntry(id) }
            ]
        );
    };

    const handlePress = (mood: any) => {
        navigation.navigate('Mood', { resumeEntry: mood });
    };

    // Auto-scroll to specific date when navigated from Streak screen
    useEffect(() => {
        if (route.params?.scrollToDate && sectionListRef.current && groupedMoods.length > 0) {
            const targetDate = route.params.scrollToDate;

            // Find the section index that contains this date
            const sectionIndex = groupedMoods.findIndex(section =>
                section.data.some(mood => format(new Date(mood.timestamp), 'yyyy-MM-dd') === targetDate)
            );

            if (sectionIndex !== -1) {
                // Small delay to ensure SectionList is rendered
                setTimeout(() => {
                    sectionListRef.current?.scrollToLocation({
                        sectionIndex: sectionIndex,
                        itemIndex: 0,
                        animated: true,
                        viewPosition: 0
                    });
                }, 300);
            }

            // Clear the param after scrolling
            navigation.setParams({ scrollToDate: undefined });
        }
    }, [route.params?.scrollToDate, groupedMoods]);

    return (
        <ScreenWrapper>
            <View style={[styles.mainContainer, { backgroundColor: 'transparent', paddingTop: insets.top || 20 }]}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.title, { color: theme.text }]}>History</Text>
                    </View>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your emotional patterns and conversations.</Text>

                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search chats or moods..."
                        icon={<Search size={18} color={theme.textSecondary} />}
                        containerStyle={styles.searchContainer}
                    />
                </View>

                {moods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <HistoryIcon size={80} color={theme.primary} strokeWidth={1} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No history found. Talk to Lumina Mood to start your journal.</Text>
                    </View>
                ) : (
                    <SectionList
                        ref={sectionListRef}
                        sections={groupedMoods}
                        keyExtractor={(item: any) => item?.id?.toString()}
                        stickySectionHeadersEnabled={false}
                        renderSectionHeader={({ section }: { section: any }) => (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {section.title === 'Today' ? (
                                        <Clock size={12} color={primaryColor} />
                                    ) : (
                                        section.title === 'Yesterday' ? (
                                            <Calendar size={12} color={theme.textSecondary} />
                                        ) : (
                                            <CalendarDays size={12} color={theme.textSecondary} />
                                        )
                                    )}
                                    <Text style={{
                                        fontSize: 10,
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.5,
                                        marginLeft: 8,
                                        color: section.title === 'Today' ? primaryColor : theme.textSecondary
                                    }}>
                                        {section.title}
                                    </Text>
                                </View>
                            </View>
                        )}
                        renderItem={({ item: mood }: { item: any }) => (
                            <View style={styles.rowWrapper}>
                                <View style={{ flex: 1 }}>
                                    <MoodRow mood={mood} onPress={() => handlePress(mood)} />
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDelete(mood.id)}
                                    activeOpacity={0.6}
                                    style={[styles.deleteBtn, { backgroundColor: '#FEE2E2' }]}
                                >
                                    <Trash2 size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
    },
    title: { fontSize: 32, fontWeight: '900' },
    subtitle: { fontSize: 15, fontWeight: '500', marginBottom: 10 },
    searchContainer: {
        marginTop: 5,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    groupContainer: {
        marginBottom: 25,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 5,
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 8,
    },
    rowWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deleteBtn: {
        width: 48,
        height:62,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        marginLeft: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -100,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 24,
        fontWeight: '600',
    },
});
