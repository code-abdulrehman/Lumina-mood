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
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useToast } from '../context/ToastContext';
import { ExternalLink, Key, ShieldCheck, Sparkles, Trash2, Palette, Activity, Check, X, BrainCircuit, PlayCircle } from 'lucide-react-native';
import { validateApiKey } from '../utils/GeminiService';
import * as Clipboard from 'expo-clipboard';
import { INTEREST_OPTIONS } from '../data/interests';

const COLOR_OPTIONS = [
    '#9cb167',
    '#5347de',
    '#b82f4d',
    '#b684aeff',
    '#ffc145',
    '#4a6fa5',
    '#008080',
    '#91b4b4ff',
    '#800000',
    '#df7343',
];

export const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { apiKey, updateApiKey, clearAllData, primaryColor, updatePrimaryColor, theme, userName, interests, updateUserSettings } = useMood();
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [nameInput, setNameInput] = useState(userName || '');
    const [selectedInterests, setSelectedInterests] = useState<string[]>(interests || []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleInterest = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(selectedInterests.filter(i => i !== id));
        } else if (selectedInterests.length < 5) {
            setSelectedInterests([...selectedInterests, id]);
        }
    };

    useEffect(() => {
        if (apiKey) setKeyInput(apiKey);
    }, [apiKey]);

    const handleSave = async () => {
        setIsSaving(true);

        const currentKey = apiKey || '';
        const newKey = keyInput.trim();

        // Validate API Key only if it changed and is not empty
        if (newKey !== currentKey && newKey.length > 0) {
            const validation = await validateApiKey(newKey);
            if (!validation.valid) {
                setIsSaving(false);
                showToast(validation.error || "Please check your key and try again.", 'error');
                return;
            }
        }

        await updateUserSettings({
            apiKey: newKey,
            userName: nameInput.trim(),
            interests: selectedInterests
        });
        setIsSaving(false);
        showToast("Settings updated successfully.", 'success');
    };

    const handleProfileSave = async () => {
        setIsSaving(true);
        await updateUserSettings({
            userName: nameInput.trim(),
            interests: selectedInterests
        });
        setIsSaving(false);
        showToast("Profile updated.", 'success');
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
        <ScreenWrapper>
            <View style={[styles.mainContainer, { backgroundColor: 'transparent', paddingTop: insets.top || 20 }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.container}>
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

                            <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Interests (Max 5)</Text>
                            <View style={styles.interestsGrid}>
                                {INTEREST_OPTIONS.map(item => {
                                    const Icon = item.icon;
                                    const isSelected = selectedInterests.includes(item.id);
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.interestTag,
                                                styles.boxShadow,
                                                {
                                                    backgroundColor: isSelected ? theme.primary : theme.card,
                                                    borderRadius: 20,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 12,
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }
                                            ]}
                                            onPress={() => toggleInterest(item.id)}
                                        >
                                            <Icon
                                                size={14}
                                                color={isSelected ? '#fff' : theme.textSecondary}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={{
                                                color: isSelected ? '#fff' : theme.textSecondary,
                                                fontWeight: isSelected ? '700' : '600',
                                                fontSize: 12
                                            }}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.primary, borderRadius: theme.radius, marginTop: 24, marginBottom: 0 }]}
                                onPress={handleProfileSave}
                            >
                                <Text style={styles.saveButtonText}>Save Profile</Text>
                            </TouchableOpacity>
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

                            <TouchableOpacity
                                style={[styles.linkButton, { marginTop: 12 }]}
                                onPress={() => Linking.openURL('https://www.youtube.com/shorts/7_HFmLrfZHg')}
                            >
                                <Text style={[styles.linkText, { color: theme.primary }]}>Watch Tutorial: How to get API Key</Text>
                                <PlayCircle size={14} color={theme.primary} />
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
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },

    container: { paddingHorizontal: 20 },
    header: {
        marginBottom: 24,
    },
    brandingSection: {
        display: 'none',
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
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    card: {
        padding: 20,
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
        paddingHorizontal: 10,
        marginBottom: 16,
        height: 50,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    boxShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
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
