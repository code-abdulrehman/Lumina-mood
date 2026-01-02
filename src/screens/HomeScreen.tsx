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
    Animated,
    Easing,
    PanResponder
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
import MoodIcon from '../components/MoodIcon';

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
    const { addMood, updateMoodEntry, moods, apiKey, theme, userName, interests } = useMood();
    const streak = calculateStreak(moods);

    const [selectedMood, setSelectedMood] = useState<MoodConfig | null>(null);
    const [currentEntry, setCurrentEntry] = useState<MoodEntry | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const rotation = useRef(new Animated.Value(0)).current;
    const footerScroll = useRef(new Animated.Value(0)).current;
    const lastAngle = useRef(0);
    const rotationOffset = useRef(0);
    const containerRef = useRef<View>(null);
    const containerCenter = useRef({ x: 0, y: 0 });
    const autoSpinDirection = useRef(1); // 1 for clockwise, -1 for counter

    useEffect(() => {
        if (!selectedMood) {
            startAutoSpin();
        } else {
            rotation.stopAnimation();
            startFooterAnimation();
        }
    }, [selectedMood]);

    const startAutoSpin = (startVal?: number) => {
        rotation.stopAnimation();
        const currentVal = startVal !== undefined ? startVal : (rotation as any)._value || 0;

        Animated.timing(rotation, {
            toValue: currentVal + (360 * autoSpinDirection.current),
            duration: 40000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished && !selectedMood) {
                startAutoSpin(currentVal + (360 * autoSpinDirection.current));
            }
        });
    };

    const footerScrollOffset = useRef(0);

    const startFooterAnimation = (startVal?: number) => {
        footerScroll.stopAnimation();
        const currentVal = startVal !== undefined ? startVal : (footerScroll as any)._value || 0;
        const setWidth = MOOD_CONFIGS.length * 52;

        // Normalize to middle set area (using 10 sets, so middle is around -5*setWidth)
        let normalizedStart = currentVal;
        while (normalizedStart < -6 * setWidth) normalizedStart += setWidth;
        while (normalizedStart > -5 * setWidth) normalizedStart -= setWidth;
        footerScroll.setValue(normalizedStart);

        Animated.timing(footerScroll, {
            toValue: normalizedStart - setWidth,
            duration: 25000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished && selectedMood) {
                startFooterAnimation(normalizedStart - setWidth);
            }
        });
    };

    const circlePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                rotation.stopAnimation();
                const { pageX, pageY } = evt.nativeEvent;
                const dx = pageX - containerCenter.current.x;
                const dy = pageY - containerCenter.current.y;
                lastAngle.current = Math.atan2(dy, dx) * (180 / Math.PI);

                // Get current visible rotation value
                rotation.addListener(({ value }) => {
                    rotationOffset.current = value;
                });
                rotation.removeListener(''); // Just to trigger getter if needed, but better to use listener properly
            },
            onPanResponderMove: (evt) => {
                const { pageX, pageY } = evt.nativeEvent;
                const dx = pageX - containerCenter.current.x;
                const dy = pageY - containerCenter.current.y;
                let currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                let delta = currentAngle - lastAngle.current;
                // Handle wrap around
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;

                rotationOffset.current += delta;
                rotation.setValue(rotationOffset.current);
                lastAngle.current = currentAngle;
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { vx, vy } = gestureState;
                const { pageX, pageY } = evt.nativeEvent;

                // Calculate angular velocity: (x*vy - y*vx) / r^2
                const x = pageX - containerCenter.current.x;
                const y = pageY - containerCenter.current.y;
                const r2 = x * x + y * y;
                const angularVelocity = ((x * vy - y * vx) / r2) * (180 / Math.PI) * 1000; // Degrees per second

                if (Math.abs(angularVelocity) > 10) {
                    autoSpinDirection.current = angularVelocity > 0 ? 1 : -1;
                    Animated.decay(rotation, {
                        velocity: angularVelocity / 1000, // Velocity in units per ms
                        deceleration: 0.995,
                        useNativeDriver: true,
                    }).start(({ finished }) => {
                        if (finished && !selectedMood) {
                            startAutoSpin();
                        }
                    });
                } else {
                    startAutoSpin();
                }
            },
        })
    ).current;

    const footerPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                footerScroll.stopAnimation();
                const currentVal = (footerScroll as any)._value || 0;
                const setWidth = MOOD_CONFIGS.length * 52;

                // Jump to middle set area for maximum headroom in both directions (10 sets)
                let normalizedStart = currentVal;
                while (normalizedStart < -6 * setWidth) normalizedStart += setWidth;
                while (normalizedStart > -5 * setWidth) normalizedStart -= setWidth;

                footerScroll.setValue(normalizedStart);
                footerScrollOffset.current = normalizedStart;
            },
            onPanResponderMove: (_, gestureState) => {
                const newVal = footerScrollOffset.current + gestureState.dx;
                footerScroll.setValue(newVal);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (Math.abs(gestureState.vx) > 0.1) {
                    Animated.decay(footerScroll, {
                        velocity: gestureState.vx,
                        deceleration: 0.995,
                        useNativeDriver: true,
                    }).start(({ finished }) => {
                        if (finished && selectedMood) {
                            startFooterAnimation();
                        }
                    });
                } else {
                    startFooterAnimation();
                }
            },
        })
    ).current;

    const spin = rotation.interpolate({
        inputRange: [-360000, 360000], // Large range to handle multiple spins
        outputRange: ['-360000deg', '360000deg'],
    });

    const inverseSpin = rotation.interpolate({
        inputRange: [-360000, 360000],
        outputRange: ['360000deg', '-360000deg'],
    });

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
                const responseText = await getGeminiChatResponse(apiKey, config.label, [], undefined, userName, interests);
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
            const responseText = await getGeminiChatResponse(apiKey, selectedMood.label, updatedHistory, msgToSend, userName, interests);
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
        <View style={[styles.mainContainer, { backgroundColor: 'transparent' }]}>
            {/* STICKY TOP HEADER */}
            <View style={[styles.stickyHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
                <View style={[styles.headerRow, { alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                                {userName ? `Hi, ${userName}` : 'Lumina Mood'}
                            </Text>
                            {selectedMood ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <MoodIcon
                                        iconName={selectedMood.icon}
                                        size={24}
                                        color={selectedMood.color}
                                        customImage={selectedMood.customImage}
                                        strokeWidth={3}
                                    />
                                    <Text style={[styles.question, { color: theme.textSecondary, marginLeft: 10 }]}>
                                        Today you feel <Text style={[styles.question, { color: selectedMood.color }]}>{selectedMood.label.toLowerCase()}</Text>
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.question, { color: theme.text }]}>How do you feel?</Text>
                            )}
                        </View>
                    </View>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Flame size={14} color="#F97316" fill="#F97316" />
                            <Text style={styles.streakText}>{streak}d</Text>
                        </View>
                    )}
                </View>
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
                        <View style={styles.initialState}>
                            <Animated.View
                                {...circlePanResponder.panHandlers}
                                onLayout={(e) => {
                                    const { x, y, width, height } = e.nativeEvent.layout;
                                    // Note: we need page coordinates, but for a centered item this approximation works
                                    // Better to use measureInWindow in a real hook but this is a good start.
                                    containerCenter.current = {
                                        x: SCREEN_WIDTH / 2,
                                        y: y + height / 2 + (Platform.OS === 'ios' ? 120 : 100) // Adjustment for header
                                    };
                                }}
                                style={[
                                    styles.circleContainer,
                                    { transform: [{ rotate: spin }] }
                                ]}
                            >
                                {MOOD_CONFIGS.map((config, index) => {
                                    const angle = (index / MOOD_CONFIGS.length) * 2 * Math.PI;
                                    const radius = SCREEN_WIDTH * 0.35;
                                    const x = Math.cos(angle) * radius;
                                    const y = Math.sin(angle) * radius;

                                    return (
                                        <View
                                            key={config.level}
                                            style={[
                                                styles.circularMoodBtnContainer,
                                                {
                                                    left: (SCREEN_WIDTH * 0.8) / 2 - 35 + x,
                                                    top: (SCREEN_WIDTH * 0.8) / 2 - 35 + y,
                                                }
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={[
                                                    styles.circularMoodBtn,
                                                    { backgroundColor: config.color+"0" }
                                                ]}
                                                onPress={() => handleMoodSelect(config)}
                                            >
                                                <Animated.View style={{ transform: [{ rotate: inverseSpin }] }}>
                                                    <MoodIcon
                                                        iconName={config.icon}
                                                        size={48}
                                                        color="#fff"
                                                        customImage={config.customImage}
                                                        strokeWidth={3}
                                                    />
                                                </Animated.View>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                                <Animated.View style={[styles.centerDecor, { transform: [{ rotate: inverseSpin }] }]}>
                                    <Sparkles size={40} color={theme.primary} />
                                    <Text style={[styles.centerText, { color: theme.textSecondary }]}>How's Life?</Text>
                                </Animated.View>
                            </Animated.View>
                            <Text style={[styles.initialHint, { color: theme.textSecondary }]}>
                                How are you feeling today?
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.chatList}>
                            {chatHistory.map((msg, idx) => (
                                <View key={idx} style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : [styles.modelCard, { borderRadius: theme.radiusLarge, backgroundColor: theme.primary + "15" }],
                                ]}>
                                    {msg.role === 'model' && (
                                        <View style={styles.modelHeaderContainer}>
                                            <View style={styles.modelHeader}>
                                                <Sparkles size={16} color={theme.primary} />
                                                <Text style={[styles.modelTitle, { color: theme.primary }]}>AI Companion</Text>
                                            </View>
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
                                    )}
                                    <MarkdownText
                                        text={msg.text}
                                        primaryColor={theme.primary}
                                        style={[
                                            styles.messageText,
                                            msg.role === 'user' ? styles.userText : { color: theme.text }
                                        ]}
                                    />

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
                                        <MessageCircle size={12} color={theme.textSecondary} />
                                        <Text style={[styles.quickTitle, { color: theme.textSecondary }]}>Suggested Questions:</Text>
                                    </View>
                                    {suggestions.filter(s => s && String(s).trim().length > 0).map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            activeOpacity={0.7}
                                            style={[styles.quickBtn, { borderColor: theme.primary, borderRadius: theme.radius, backgroundColor: theme.card }]}
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
                <View style={[
                    styles.footerContainer,
                    {
                        borderTopColor: theme.border,
                        paddingBottom: Math.max(insets.bottom, 8),
                        borderTopWidth: selectedMood ? 0 : 0,
                        paddingHorizontal: selectedMood ? 0 : 20,
                        paddingTop: selectedMood ? 0 : 12,
                    }
                ]}>
                    {selectedMood && (
                        <View
                            style={styles.infiniteFooterWrapper}
                            {...footerPanResponder.panHandlers}
                        >
                            <Animated.View style={[
                                styles.infiniteFooterScroll,
                                { transform: [{ translateX: footerScroll }] }
                            ]}>
                                {[...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS, ...MOOD_CONFIGS].map((config, index) => {
                                    const isSelected = selectedMood?.level === config.level;
                                    return (
                                        <TouchableOpacity
                                            key={`${config.level}-${index}`}
                                            style={[
                                                styles.compactMoodBtn,
                                                {
                                                    opacity: isSelected ? 1 : 0.6,
                                                    transform: [{ scale: isSelected ? 1.5 : 0.9 }]
                                                }
                                            ]}
                                            onPress={() => handleMoodSelect(config)}
                                        >
                                            <MoodIcon
                                                iconName={config.icon}
                                                size={22}
                                                color={config.color}
                                                customImage={config.customImage}
                                                strokeWidth={isSelected ? 3 : 2}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </Animated.View>
                        </View>
                    )}

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
        paddingHorizontal: 20,
        paddingBottom: 15,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    greeting: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        opacity: 0.6,
    },
    question: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    streakText: {
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '800',
        color: '#F97316',
    },
    chatScroll: {
        flex: 1,
    },
    chatScrollContent: {
        paddingTop: 20,
        paddingBottom: 80,
    },
    initialState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: SCREEN_WIDTH * 1.2,
    },
    circleContainer: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circularMoodBtnContainer: {
        position: 'absolute',
        width: 70,
        height: 70,
    },
    circularMoodBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerDecor: {
        position: 'absolute',
        alignItems: 'center',
    },
    centerText: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 8,
        opacity: 0.5,
    },
    initialHint: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 40,
        opacity: 0.7,
    },
    chatList: {
        paddingHorizontal: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 15,
        borderRadius: 20,
    },
    userBubble: {
        alignSelf: 'flex-end',
    },
    userText: {
        color: '#1E293B',
        fontSize: 15,
        lineHeight: 22,
    },
    modelCard: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modelTitle: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginLeft: 6,
        letterSpacing: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    copyBtn: {
        alignSelf: 'flex-end',
        padding: 8,
        marginTop: 5,
    },
    modelHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quickQuestionsContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    quickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    quickTitle: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginLeft: 8,
        letterSpacing: 1,
    },
    quickBtn: {
        flexDirection: 'row',
        flexShrink: 1,
        alignSelf: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        borderWidth: 1.5,
    },
    quickBtnText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 14,
        marginRight: 10,
    },
    footerContainer: {
        paddingHorizontal: 20,
    },
    compactMoodScroll: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    compactMoodBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    infiniteFooterWrapper: {
        overflow: 'hidden',
        width: '100%',
        height: 60,
        justifyContent: 'center',
    },
    infiniteFooterScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        paddingLeft: 15,
        paddingVertical: 5,
        backgroundColor: '#F8FAFC',
        marginBottom: 2,
        marginHorizontal: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        height: 45,
    },
    sendIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        marginBottom: 5,
    },
    tipBoxText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
});
