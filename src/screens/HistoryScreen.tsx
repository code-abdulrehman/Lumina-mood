import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { MoodRow } from '../components/MoodRow';
import { History as HistoryIcon, Search, Trash2, Calendar, Clock } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

export const HistoryScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, deleteMoodEntry, theme, primaryColor } = useMood();
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = useState('');

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
            else title = format(date, 'MMMM yyyy');

            const section = sections.find(s => s.title === title);
            if (section) {
                section.data.push(m);
            } else {
                sections.push({ title, data: [m] });
            }
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
        navigation.navigate('Home', { resumeEntry: mood });
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={[styles.title, { color: theme.text }]}>History</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your emotional patterns and conversations.</Text>

                <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Search size={18} color={theme.textSecondary} />
                    <TextInput
                        placeholder="Search chats or moods..."
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.searchInput, { color: theme.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {moods.length === 0 ? (
                <View style={styles.emptyState}>
                    <HistoryIcon size={80} color={theme.border} strokeWidth={1} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No history found. Talk to Lumina to start your journal.</Text>
                </View>
            ) : (
                <FlatList
                    data={groupedMoods}
                    keyExtractor={(item) => item.title}
                    renderItem={({ item }) => (
                        <View style={styles.groupContainer}>
                            <View style={styles.groupHeader}>
                                {item.title === 'Today' ? (
                                    <Clock size={14} color={primaryColor} />
                                ) : (
                                    <Calendar size={14} color={theme.textSecondary} />
                                )}
                                <Text style={[styles.groupTitle, { color: item.title === 'Today' ? primaryColor : theme.textSecondary }]}>
                                    {item.title}
                                </Text>
                            </View>
                            {item.data.map(mood => (
                                <View key={mood.id} style={styles.rowWrapper}>
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
                            ))}
                        </View>
                    )}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
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
        height: 48,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
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
