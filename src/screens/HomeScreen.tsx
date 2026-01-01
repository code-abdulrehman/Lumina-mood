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
    Keyboard,
    ImageBackground,
    Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { MOOD_CONFIGS } from '../data/moods';
import { useMood } from '../context/MoodContext';
import { calculateStreak } from '../utils/patternAnalyzer';
import {
    Flame,
    Send,
    Sparkles,
    BrainCircuit,
    Copy,
    Check,
    MessageCircle,
    ArrowRight,
    Menu,
    Plus,
    Smile,
    X
} from 'lucide-react-native';
import { getGeminiChatResponse, parseSuggestions, ChatMessage } from '../utils/GeminiService';
import { MoodConfig, MoodEntry } from '../types/mood';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    const navigation = useNavigation<any>();
    const { addMood, updateMoodEntry, moods, apiKey, theme, primaryColor } = useMood();
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

    const scrollToBottom = (delay = 100) => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollToEnd({ animated: true });
            }
        }, delay);
    };

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
            if (!entry) return;

            setSelectedMood(config);
            setCurrentEntry(entry);

            if (entry.chatHistory && entry.chatHistory.length > 0) {
                setChatHistory(entry.chatHistory);
                setSuggestions([]);
                scrollToBottom();
                return;
            }

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
        <View style={styles.mainContainer}>
            {/* AMBIENT BACKGROUND */}
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '10', top: -100, right: -100 }]} />
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '05', bottom: -50, left: -50, width: 400, height: 400 }]} />

            {/* STICKY TOP HEADER - GLASS */}
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="light" style={[styles.glassHeader, { paddingTop: insets.top + 10, borderColor: theme.glassBorder }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.openDrawer()}
                        style={[styles.menuBtn, { backgroundColor: theme.darkGlass }]}
                    >
                        <Menu size={22} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.centerBrand}>
                        <Image source={require('../../assets/branding_logo.png')} style={styles.headerLogo} resizeMode="contain" />
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>Lumina</Text>
                    </View>

                    {streak > 0 ? (
                        <View style={[styles.streakBadge, { backgroundColor: primaryColor + '15' }]}>
                            <Flame size={14} color={primaryColor} fill={primaryColor} />
                            <Text style={[styles.streakText, { color: primaryColor }]}>{streak}d</Text>
                        </View>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>

                {selectedMood ? (
                    <BlurView intensity={60} tint="light" style={[styles.moodBar, { backgroundColor: selectedMood.color + '20', borderRadius: theme.radius, borderColor: selectedMood.color + '30' }]}>
                        {React.createElement((Icons as any)[selectedMood.icon] || Smile, { size: 18, color: selectedMood.color })}
                        <Text style={[styles.moodBarText, { color: selectedMood.color }]}>Tracing {selectedMood.label}</Text>
                        <TouchableOpacity onPress={() => setSelectedMood(null)} style={styles.closeMood}>
                            <X size={14} color={selectedMood.color} />
                        </TouchableOpacity>
                    </BlurView>
                ) : (
                    <Text style={[styles.question, { color: theme.text }]}>How do you feel?</Text>
                )}
            </BlurView>

            {/* CONTENT AREA */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.chatScroll}
                    contentContainerStyle={[styles.chatScrollContent, { paddingTop: 20 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {!selectedMood ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.brainContainer, { backgroundColor: primaryColor + '05' }]}>
                                <BrainCircuit size={100} color={primaryColor + '40'} strokeWidth={1} />
                            </View>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                Select a mood below to begin your neural mindfulness session.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.chatList}>
                            {chatHistory.map((msg, idx) => (
                                <View key={idx} style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? [styles.userBubble, { backgroundColor: theme.primary + '10' }] : styles.modelCard,
                                ]}>
                                    {msg.role === 'model' && (
                                        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                    )}
                                    {msg.role === 'model' && (
                                        <View style={styles.modelHeader}>
                                            <Sparkles size={14} color={theme.primary} />
                                            <Text style={[styles.modelTitle, { color: theme.primary }]}>AI Companion</Text>
                                        </View>
                                    )}
                                    <MarkdownText
                                        text={msg.text}
                                        primaryColor={theme.primary}
                                        style={[
                                            styles.messageText,
                                            msg.role === 'user' ? { color: theme.text } : { color: theme.text }
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
                                <View style={[styles.messageBubble, styles.modelCard, { paddingVertical: 20 }]}>
                                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                    <ActivityIndicator size="small" color={theme.primary} />
                                </View>
                            )}

                            {!isThinking && suggestions && suggestions.length > 0 && (
                                <View style={styles.quickQuestionsContainer}>
                                    <View style={styles.quickHeader}>
                                        <MessageCircle size={14} color={theme.textSecondary} />
                                        <Text style={[styles.quickTitle, { color: theme.textSecondary }]}>Suggested Inquiries:</Text>
                                    </View>
                                    {suggestions.filter(s => s && String(s).trim().length > 0).map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            activeOpacity={0.7}
                                            style={[styles.quickBtn, { borderColor: theme.border, borderRadius: theme.radius, backgroundColor: theme.glassBackground }]}
                                            onPress={() => handleQuickQuestionClick(String(s))}
                                        >
                                            <Text style={[styles.quickBtnText, { color: theme.text }]} numberOfLines={2}>{String(s)}</Text>
                                            <ArrowRight size={14} color={theme.primary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* FOOTER BAR - GLASS REINFORCED */}
                <BlurView intensity={80} tint="light" style={[styles.footerContainer, { borderTopColor: theme.glassBorder, paddingBottom: Math.max(insets.bottom, 15) }]}>
                    <View style={styles.moodSelectorRow}>
                        {MOOD_CONFIGS.map((config) => {
                            const IconComponent = (Icons as any)[config.icon] || Smile;
                            const isSelected = selectedMood?.level === config.level;
                            return (
                                <TouchableOpacity
                                    key={config.level}
                                    style={[
                                        styles.moodIconBtn,
                                        {
                                            backgroundColor: isSelected ? config.color : theme.darkGlass,
                                            borderRadius: 20,
                                            borderColor: isSelected ? config.color : theme.border,
                                            borderWidth: isSelected ? 0 : 1,
                                        }
                                    ]}
                                    onPress={() => handleMoodSelect(config)}
                                >
                                    <IconComponent
                                        size={24}
                                        color={isSelected ? "#fff" : config.color}
                                        strokeWidth={2.5}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedMood && apiKey && (
                        <View style={[styles.inputBar, { borderColor: theme.border, borderRadius: theme.radiusLarge, backgroundColor: theme.darkGlass }]}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Reflect here..."
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
                        <Text style={[styles.tipBoxText, { color: theme.textSecondary, textAlign: 'center' }]}>Connect API Key in Settings for AI Insights</Text>
                    )}
                </BlurView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    bgCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        zIndex: -1,
    },
    glassHeader: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        zIndex: 100,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 28,
        height: 28,
        marginRight: 8,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    question: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    streakText: {
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '900',
    },
    moodBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        marginTop: 5,
    },
    moodBarText: {
        fontSize: 14,
        fontWeight: '800',
        flex: 1,
        marginLeft: 10,
    },
    closeMood: {
        padding: 4,
    },
    chatScroll: {
        flex: 1,
    },
    chatScrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brainContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 50,
        lineHeight: 26,
    },
    chatList: {
        flex: 1,
    },
    messageBubble: {
        padding: 18,
        marginBottom: 16,
        maxWidth: '88%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    modelCard: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    modelTitle: {
        fontSize: 11,
        fontWeight: '900',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
    },
    copyBtn: {
        marginTop: 12,
        alignSelf: 'flex-end',
    },
    quickQuestionsContainer: {
        marginTop: 24,
        marginBottom: 20,
    },
    quickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        marginLeft: 4,
    },
    quickTitle: {
        fontSize: 12,
        fontWeight: '900',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    quickBtnText: {
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 1,
        marginRight: 10,
        lineHeight: 20,
    },
    footerContainer: {
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    moodSelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    moodIconBtn: {
        width: (SCREEN_WIDTH - 40 - 64) / 5,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBar: {
        flexDirection: 'row',
        padding: 4,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 10,
    },
    input: {
        flex: 1,
        height: 54,
        paddingHorizontal: 18,
        fontSize: 16,
        fontWeight: '600',
    },
    sendIconBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    tipBoxText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingBottom: 5,
    }
});
