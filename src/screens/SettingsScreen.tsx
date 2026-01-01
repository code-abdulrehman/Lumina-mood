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
    Image,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { ExternalLink, Key, ShieldCheck, Sparkles, Trash2, Palette, BrainCircuit, Activity } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        <View style={styles.mainContainer}>
            {/* AMBIENT BACKGROUND */}
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '10', top: -100, right: -100 }]} />
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '05', bottom: -50, left: -50, width: 400, height: 400 }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}>
                    {/* BRANDING HEADER */}
                    <View style={styles.brandingSection}>
                        <Image
                            source={require('../../assets/branding_logo.png')}
                            style={styles.brandingLogo}
                            resizeMode="contain"
                        />
                        <View style={styles.brandingTextContainer}>
                            <Text style={[styles.brandTitle, { color: theme.text }]}>Lumina</Text>
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

                    {/* THEME SECTION */}
                    <BlurView intensity={30} tint="light" style={[styles.glassCard, { borderColor: theme.glassBorder }]}>
                        <View style={styles.cardHeader}>
                            <Palette size={20} color={primaryColor} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>App Essence</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Select a primary color that resonates with your emotional spectrum.
                        </Text>
                        <View style={styles.colorGrid}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: color },
                                        primaryColor === color && { borderWidth: 3, borderColor: theme.text }
                                    ]}
                                    onPress={() => updatePrimaryColor(color)}
                                >
                                    {primaryColor === color && <View style={styles.checkMark} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </BlurView>

                    {/* AI SECTION */}
                    <BlurView intensity={30} tint="light" style={[styles.glassCard, { borderColor: theme.glassBorder }]}>
                        <View style={styles.cardHeader}>
                            <Sparkles size={20} color={primaryColor} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>AI Cognition</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Connect your Gemini API key to activate advanced neural mindfulness.
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: theme.darkGlass, borderColor: theme.border, borderRadius: theme.radius }]}>
                            <Key size={18} color={theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Neural Key Token"
                                value={keyInput}
                                onChangeText={setKeyInput}
                                secureTextEntry
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: primaryColor, borderRadius: theme.radius }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>{isSaving ? "Syncing..." : "Activate Key"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkButton} onPress={openStudio}>
                            <Text style={[styles.linkText, { color: primaryColor }]}>Secure a free key via AI Studio</Text>
                            <ExternalLink size={14} color={primaryColor} />
                        </TouchableOpacity>
                    </BlurView>

                    {/* DATA SECTION */}
                    <BlurView intensity={30} tint="light" style={[styles.glassCard, { borderColor: theme.glassBorder }]}>
                        <View style={styles.cardHeader}>
                            <Trash2 size={20} color="#EF4444" />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Neural Memory</Text>
                        </View>
                        <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                            Permanently wipe all logs and neural profiles.
                        </Text>
                        <TouchableOpacity style={[styles.clearButton, { borderColor: "#EF4444", borderRadius: theme.radius }]} onPress={handleClearData}>
                            <Text style={styles.clearButtonText}>Flush All Data</Text>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={[styles.infoCard, { backgroundColor: primaryColor + '05', borderRadius: 24 }]}>
                        <ShieldCheck size={20} color={primaryColor} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Encryption Note: Your neural keys and logs exist strictly on-device for total privacy.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.versionText, { color: theme.textSecondary }]}>LUMINA v1.5.0 • NEURAL EDITION</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },
    container: { padding: 24 },
    header: { marginBottom: 32 },
    brandingSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    brandingLogo: { width: 64, height: 64, borderRadius: 16, marginRight: 16 },
    brandingTextContainer: { flex: 1 },
    brandTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    taglineRow: { flexDirection: 'row', alignItems: 'center' },
    brandTagline: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 8 },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
    subtitle: { fontSize: 16, fontWeight: '600', opacity: 0.7 },
    glassCard: { padding: 28, borderRadius: 32, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '900', marginLeft: 10 },
    cardDescription: { fontSize: 14, lineHeight: 22, fontWeight: '600', marginBottom: 28, opacity: 0.8 },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    colorSwatch: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    checkMark: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 20, marginBottom: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 56, fontSize: 15, fontWeight: '700' },
    saveButton: { height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    clearButton: { borderWidth: 2, height: 56, justifyContent: 'center', alignItems: 'center' },
    clearButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    linkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    linkText: { fontSize: 14, fontWeight: '700', marginRight: 8 },
    infoCard: { flexDirection: 'row', padding: 24, alignItems: 'flex-start' },
    infoText: { flex: 1, marginLeft: 16, fontSize: 13, lineHeight: 20, fontWeight: '600' },
    footer: { marginTop: 48, alignItems: 'center', paddingBottom: 20 },
    versionText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 }
});
