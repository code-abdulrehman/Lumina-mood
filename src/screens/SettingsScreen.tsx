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
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { ExternalLink, Key, ShieldCheck, Sparkles, Trash2, Palette } from 'lucide-react-native';

const COLOR_OPTIONS = [
    '#6366F1', // Indigo (Default)
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EF4444', // Red
];

export const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { apiKey, updateApiKey, clearAllData, primaryColor, updatePrimaryColor, theme } = useMood();
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (apiKey) setKeyInput(apiKey);
    }, [apiKey]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateApiKey(keyInput);
        setIsSaving(false);
        Alert.alert("Success", "API key updated.");
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

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background, paddingTop: insets.top || 20 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Customize your experience.</Text>
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
                                        { borderColor: theme.border },
                                        { borderRadius: theme.radius },
                                        { backgroundColor: color },
                                        primaryColor === color && { borderWidth: 3, borderColor: theme.text }
                                    ]}
                                    onPress={() => updatePrimaryColor(color)}
                                >
                                    {primaryColor === color && (
                                        <View style={styles.checkMark} />
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
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save API Key"}</Text>
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
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
        gap: 12,
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
