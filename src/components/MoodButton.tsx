import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Icons from 'lucide-react-native';
import { MoodConfig } from '../types/mood';

interface MoodButtonProps {
    config: MoodConfig;
    onPress: () => void;
}

export const MoodButton: React.FC<MoodButtonProps> = ({ config, onPress }) => {
    const IconComponent = (Icons as any)[config.icon];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: config.color + '20' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
                <IconComponent size={32} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.label}>{config.label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '45%',
        aspectRatio: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
});
