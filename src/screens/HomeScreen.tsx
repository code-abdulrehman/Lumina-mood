import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Share,
    Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { MOOD_CONFIGS } from '../data/moods';
import { useMood } from '../context/MoodContext';
import { calculateStreak } from '../utils/patternAnalyzer';
import { Flame, Send, Sparkles, BrainCircuit, Copy, Check, MessageCircle, ArrowRight } from 'lucide-react-native';
import { getGeminiChatResponse, parseSuggestions, ChatMessage } from '../utils/GeminiService';
import { MoodConfig, MoodEntry } from '../types/mood';
import { useRoute } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MarkdownText = ({ text, style, primaryColor }: { text: string, style: any, primaryColor: string }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <Text style={style}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <Text key={i} style={{ fontWeight: '800', color: primaryColor }}>
                            {part.slice(2, -2)}
                        </Text>
                    );
                }
                return <Text key={i}>{part}</Text>;
            })}
        </Text>
    );
};

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { addMood, updateMoodEntry, moods, apiKey, theme } = useMood();
    const streak = calculateStreak(moods);

    const [selectedMood, setSelectedMood] = useState<MoodConfig | null>(null);
    const [currentEntry, setCurrentEntry] = useState<MoodEntry | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const scrollRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);

    // Auto-scroll logic
    const scrollToBottom = (delay = 100) => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollToEnd({ animated: true });
            }
        }, delay);
    };

    // Handle incoming history resumption
    useEffect(() => {
        if (route.params?.resumeEntry) {
            const entry = route.params.resumeEntry as MoodEntry;
            const config = MOOD_CONFIGS.find(c => c.level === entry.level);
            if (config) {
                setSelectedMood(config);
                setCurrentEntry(entry);
                setChatHistory(entry.chatHistory || []);
                setSuggestions([]);
                scrollToBottom(500);
            }
        }
    }, [route.params]);

    const handleMoodSelect = async (config: MoodConfig) => {
        if (isThinking) return;

        try {
            const entry = await addMood(config.level, config.icon, config.label);
            if (!entry) return; // Limit reached

            setSelectedMood(config);
            setCurrentEntry(entry);

            // If entry already has chat history, load it
            if (entry.chatHistory && entry.chatHistory.length > 0) {
                setChatHistory(entry.chatHistory);
                setSuggestions([]);
                scrollToBottom();
                return;
            }

            // Otherwise start new chat
            setChatHistory([]);
            setSuggestions([]);

            if (apiKey) {
                setIsThinking(true);
                const responseText = await getGeminiChatResponse(apiKey, config.label, []);
                const { cleanText, suggestions: newSugs } = parseSuggestions(responseText);

                const newHistory: ChatMessage[] = [{ role: 'model', text: cleanText }];
                setChatHistory(newHistory);
                setSuggestions(newSugs);
                await updateMoodEntry(entry.id, { chatHistory: newHistory });
                scrollToBottom();
            }
        } catch (err) {
            console.error("Mood Select Error:", err);
            setIsThinking(false);
        } finally {
            if (apiKey) setIsThinking(false);
        }
    };

    const handleSendMessage = async (text?: string) => {
        const msgToSend = (typeof text === 'string' ? text : userInput).trim();
        if (!msgToSend || !apiKey || !selectedMood || !currentEntry || isThinking) return;

        const userMsg: ChatMessage = { role: 'user', text: msgToSend };
        setSuggestions([]);

        const updatedHistory = [...chatHistory, userMsg];
        setChatHistory(updatedHistory);
        setUserInput('');
        setIsThinking(true);

        scrollToBottom();

        try {
            const responseText = await getGeminiChatResponse(apiKey, selectedMood.label, updatedHistory, msgToSend);
            const { cleanText, suggestions: newSugs } = parseSuggestions(responseText);

            const finalHistory: ChatMessage[] = [...updatedHistory, { role: 'model', text: cleanText }];
            setChatHistory(finalHistory);
            setSuggestions(newSugs);
            await updateMoodEntry(currentEntry.id, { chatHistory: finalHistory });
            scrollToBottom(200);
        } catch (err) {
            console.error("SendMessage Gemini Error:", err);
        } finally {
            setIsThinking(false);
        }
    };

    const handleQuickQuestionClick = (question: string) => {
        handleSendMessage(question);
    };

    const handleCopy = async (text: string, index: number) => {
        try {
            await Share.share({ message: text });
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            Alert.alert("Error", "Could not share text.");
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            {/* STICKY TOP HEADER */}
            <View style={[styles.stickyHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Lumina Mood</Text>
                        <Text style={[styles.question, { color: theme.text }]}>How do you feel?</Text>
                    </View>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={14} color="#F97316" fill="#F97316" />
                            <Text style={styles.streakText}>{streak}d</Text>
                        </View>
                    )}
                </View>

                {selectedMood && (
                    <View style={[styles.moodBar, { backgroundColor: selectedMood.color, borderRadius: theme.radius }]}>
                        {React.createElement((Icons as any)[selectedMood.icon] || Icons.Smile, { size: 20, color: '#fff' })}
                        <Text style={styles.moodBarText}>You're feeling {selectedMood.label}</Text>
                    </View>
                )}
            </View>

            {/* CONTENT AREA */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.chatScroll}
                    contentContainerStyle={styles.chatScrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {!selectedMood ? (
                        <View style={styles.emptyState}>
                            <BrainCircuit size={80} color={theme.border} style={{ marginBottom: 20 }} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Track your mood to start a new journey of awareness.</Text>
                        </View>
                    ) : (
                        <View style={styles.chatList}>
                            {chatHistory.map((msg, idx) => (
                                <View key={idx} style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : [styles.modelCard, { borderColor: theme.border, borderRadius: theme.radiusLarge }],
                                ]}>
                                    {msg.role === 'model' && (
                                        <View style={styles.modelHeader}>
                                            <Sparkles size={16} color={theme.primary} />
                                            <Text style={[styles.modelTitle, { color: theme.primary }]}>AI Companion</Text>
                                        </View>
                                    )}
                                    <MarkdownText
                                        text={msg.text}
                                        primaryColor={theme.primary}
                                        style={[
                                            styles.messageText,
                                            msg.role === 'user' ? styles.userText : { color: theme.text }
                                        ]}
                                    />
                                    {msg.role === 'model' && (
                                        <TouchableOpacity
                                            style={styles.copyBtn}
                                            onPress={() => handleCopy(msg.text, idx)}
                                        >
                                            {copiedIndex === idx ? (
                                                <Check size={16} color={theme.primary} />
                                            ) : (
                                                <Copy size={16} color={theme.textSecondary} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {isThinking && (
                                <View style={[styles.messageBubble, styles.modelCard, { borderColor: theme.border, borderRadius: theme.radiusLarge }]}>
                                    <ActivityIndicator size="small" color={theme.primary} />
                                </View>
                            )}

                            {/* Suggestions displayed as Prompt Buttons */}
                            {!isThinking && suggestions && suggestions.length > 0 && (
                                <View style={styles.quickQuestionsContainer}>
                                    <View style={styles.quickHeader}>
                                        <MessageCircle size={14} color={theme.textSecondary} />
                                        <Text style={[styles.quickTitle, { color: theme.textSecondary }]}>Suggested Questions:</Text>
                                    </View>
                                    {suggestions.filter(s => s && String(s).trim().length > 0).map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            activeOpacity={0.7}
                                            style={[styles.quickBtn, { borderColor: theme.primary, borderRadius: theme.radius }]}
                                            onPress={() => handleQuickQuestionClick(String(s))}
                                        >
                                            <Text style={[styles.quickBtnText, { color: theme.primary }]} numberOfLines={2}>{String(s)}</Text>
                                            <ArrowRight size={14} color={theme.primary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* FOOTER BAR */}
                <View style={[styles.footerContainer, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 15) }]}>
                    {/* Mood Selector Row */}
                    <View style={styles.moodSelectorRow}>
                        {MOOD_CONFIGS.map((config) => {
                            const IconComponent = (Icons as any)[config.icon] || Icons.Smile;
                            const isSelected = selectedMood?.level === config.level;
                            return (
                                <TouchableOpacity
                                    key={config.level}
                                    style={[
                                        styles.moodIconBtn,
                                        {
                                            backgroundColor: isSelected ? config.color : theme.card,
                                            borderRadius: theme.radius
                                        }
                                    ]}
                                    onPress={() => handleMoodSelect(config)}
                                >
                                    <IconComponent
                                        size={22}
                                        color={isSelected ? "#fff" : config.color}
                                        strokeWidth={2.5}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Chat Input Bar */}
                    {selectedMood && apiKey && (
                        <View style={[styles.inputBar, { borderColor: theme.border, borderRadius: theme.radiusLarge }]}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Thoughts..."
                                value={userInput}
                                onChangeText={setUserInput}
                                onSubmitEditing={() => handleSendMessage()}
                                placeholderTextColor={theme.textSecondary}
                                autoCorrect={true}
                                onFocus={() => scrollToBottom(300)}
                            />
                            <TouchableOpacity
                                style={[styles.sendIconBtn, { backgroundColor: theme.primary }]}
                                onPress={() => handleSendMessage()}
                                disabled={isThinking || userInput.trim() === ''}
                            >
                                <Send size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {!selectedMood && !apiKey && (
                        <View style={styles.tipBox}>
                            <Sparkles size={14} color={theme.primary} />
                            <Text style={[styles.tipBoxText, { color: theme.textSecondary }]}>Add API key in Settings for AI chat.</Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    stickyHeader: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    greeting: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    question: {
        fontSize: 24,
        fontWeight: '900',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    streakText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '800',
        color: '#F97316',
    },
    moodBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginTop: 5,
    },
    moodBarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 10,
    },
    chatScroll: {
        flex: 1,
    },
    chatScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    emptyState: {
        flex: 1,
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 40,
        lineHeight: 24,
    },
    chatList: {
        flex: 1,
    },
    messageBubble: {
        padding: 16,
        marginBottom: 12,
        maxWidth: '85%',
        position: 'relative',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#F3F4F6',
        borderBottomRightRadius: 4,
    },
    modelCard: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modelTitle: {
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 6,
        textTransform: 'uppercase',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#374151',
    },
    copyBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
    },
    quickQuestionsContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    quickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 4,
    },
    quickTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        backgroundColor: '#FFF',
    },
    quickBtnText: {
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 1,
        marginRight: 10,
    },
    footerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    moodSelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    moodIconBtn: {
        width: (SCREEN_WIDTH - 40 - 48) / 5,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBar: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 4,
        alignItems: 'center',
        borderWidth: 1,
    },
    input: {
        flex: 1,
        height: 48,
        paddingHorizontal: 15,
        fontSize: 15,
    },
    sendIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 10,
    },
    tipBoxText: {
        fontSize: 12,
        marginLeft: 6,
        fontWeight: '600',
    }
});
