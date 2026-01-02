import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Linking,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { ExternalLink, Key, ShieldCheck, Sparkles, Trash2, Palette, BrainCircuit, Activity, Check, X } from 'lucide-react-native';
import { validateApiKey } from '../utils/GeminiService';
import * as Clipboard from 'expo-clipboard';

const COLOR_OPTIONS = [
    '#9cb167', // Emerald
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#F59E0B', // Amber
    '#4a6fa5', // Blue
    '#008080', // Teal
    '#bac4c8', //zinc
    '#800000', // Maroon
    '#F97316', // Orange
];

export const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { apiKey, updateApiKey, clearAllData, primaryColor, updatePrimaryColor, theme, userName, interests, updateUserSettings } = useMood();
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [nameInput, setNameInput] = useState(userName || '');
    const [selectedInterests, setSelectedInterests] = useState<string[]>(interests || []);
    const [isSaving, setIsSaving] = useState(false);

    const INTEREST_OPTIONS = [
        { id: 'music', label: 'Music', icon: Activity },
        { id: 'videos', label: 'Videos', icon: Sparkles },
        { id: 'books', label: 'Books', icon: BrainCircuit },
        { id: 'news', label: 'News', icon: Activity },
    ];

    const toggleInterest = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(selectedInterests.filter(i => i !== id));
        } else if (selectedInterests.length < 3) {
            setSelectedInterests([...selectedInterests, id]);
        }
    };

    useEffect(() => {
        if (apiKey) setKeyInput(apiKey);
    }, [apiKey]);

    const handleSave = async () => {
        setIsSaving(true);

        // Validate API Key if it changed
        if (keyInput !== apiKey) {
            const validation = await validateApiKey(keyInput);
            if (!validation.valid) {
                setIsSaving(false);
                Alert.alert("Invalid API Key", validation.error || "Please check your key and try again.");
                return;
            }
        }

        await updateUserSettings({
            apiKey: keyInput,
            userName: nameInput,
            interests: selectedInterests
        });
        setIsSaving(false);
        Alert.alert("Success", "Settings updated.");
    };

    const handleClearData = () => {
        Alert.alert(
            "Clear All Data",
            "This will permanently delete ALL your mood entries and settings. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        setKeyInput('');
                        Alert.alert("Deleted", "All data has been cleared.");
                    }
                }
            ]
        );
    };

    const openStudio = () => {
        Linking.openURL('https://aistudio.google.com/app/apikey');
    };

    const handlePaste = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) {
            setKeyInput(text);
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: 'transparent', paddingTop: insets.top || 20 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
                    {/* BRANDING HEADER */}
                    <View style={styles.brandingSection}>
                        <Image
                            source={require('../../assets/branding_logo.png')}
                            style={styles.brandingLogo}
                            resizeMode="contain"
                        />
                        <View style={styles.brandingTextContainer}>
                            <Text style={[styles.brandTitle, { color: theme.text }]}>Lumina Mood</Text>
                            <View style={styles.taglineRow}>
                                <BrainCircuit size={12} color={primaryColor} />
                                <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>Neural Intelligence AI</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Fine-tune your personal insights engine.</Text>
                    </View>

                    {/* PROFILE SECTION */}
                    <View style={[styles.card, { backgroundColor: '#fff', borderRadius: theme.radiusLarge }]}>
                        <View style={styles.cardHeader}>
                            <Activity size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Personal Profile</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Update how I address you and what you're interested in.
                        </Text>

                        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: theme.radius }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Your Name"
                                value={nameInput}
                                onChangeText={setNameInput}
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Interests (Max 3)</Text>
                        <View style={styles.interestsGrid}>
                            {INTEREST_OPTIONS.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.interestTag,
                                        {
                                            borderColor: selectedInterests.includes(item.id) ? theme.primary : theme.border,
                                            backgroundColor: selectedInterests.includes(item.id) ? `${theme.primary}10` : 'transparent',
                                            borderRadius: theme.radius
                                        }
                                    ]}
                                    onPress={() => toggleInterest(item.id)}
                                >
                                    <Text style={{
                                        color: selectedInterests.includes(item.id) ? theme.primary : theme.textSecondary,
                                        fontWeight: '700'
                                    }}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* THEME SECTION */}
                    <View style={[styles.card, { backgroundColor: '#fff', borderRadius: theme.radiusLarge }]}>
                        <View style={styles.cardHeader}>
                            <Palette size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>App Theme</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Choose a primary color that fits your vibe.
                        </Text>
                        <View style={styles.colorGrid}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorSwatch,
                                        { borderRadius: theme.radius },
                                        { backgroundColor: color },
                                    ]}
                                    onPress={() => updatePrimaryColor(color)}
                                >
                                    {primaryColor === color && (
                                        <Check size={20} color={theme.card} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* AI SECTION */}
                    <View style={[styles.card, { backgroundColor: '#fff', borderRadius: theme.radiusLarge }]}>
                        <View style={styles.cardHeader}>
                            <Sparkles size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>AI Companion</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Add a Gemini API key to enable supportive chat acknowledgments.
                        </Text>

                        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: theme.radius }]}>
                            <Key size={18} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Paste your API key here"
                                value={keyInput}
                                onChangeText={setKeyInput}
                                secureTextEntry
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {keyInput.length > 0 && (
                                    <TouchableOpacity onPress={() => setKeyInput('')} style={styles.clearBtnInner}>
                                        <X size={18} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={handlePaste} style={styles.pasteBtnInner}>
                                    <Sparkles size={14} color={theme.primary} />
                                    <Text style={[styles.pasteBtnTextInner, { color: theme.primary }]}>Paste</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save All Settings"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkButton} onPress={openStudio}>
                            <Text style={[styles.linkText, { color: theme.primary }]}>Get a free key at Google AI Studio</Text>
                            <ExternalLink size={14} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* DATA SECTION */}
                    <View style={[styles.card, { backgroundColor: '#fff', borderRadius: theme.radiusLarge }]}>
                        <View style={styles.cardHeader}>
                            <Trash2 size={20} color="#EF4444" />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Data Management</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Wipe your profile and start over fresh.
                        </Text>
                        <TouchableOpacity style={[styles.clearButton, { borderRadius: theme.radius }]} onPress={handleClearData}>
                            <Text style={styles.clearButtonText}>Clear All Data</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: '#ECFDF5', borderRadius: theme.radiusLarge }]}>
                        <ShieldCheck size={20} color="#10B981" />
                        <Text style={[styles.infoText, { color: '#065F46' }]}>
                            Your data and API key are stored locally on this device for your privacy.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.versionText, { color: theme.textSecondary }]}>Lumina Mood v1.4.0</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
    },
    brandingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        paddingVertical: 10,
    },
    brandingLogo: {
        width: 64,
        height: 64,
        borderRadius: 16,
        marginRight: 16,
    },
    brandingTextContainer: {
        flex: 1,
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandTagline: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 6,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    card: {
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 8,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 24,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 60,
        fontSize: 15,
        fontWeight: '500',
    },
    clearBtnInner: {
        padding: 8,
    },
    pasteBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginLeft: 4,
    },
    pasteBtnTextInner: {
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    interestTag: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 2,
    },
    saveButton: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    clearButton: {
        borderWidth: 2,
        borderColor: '#EF4444',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 6,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 24,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    }
});
