import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as Icons from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';

interface MoodIconProps {
    iconName: string;
    size?: number;
    color?: string;
    customImage?: string | number;
    strokeWidth?: number;
}

const MoodIcon: React.FC<MoodIconProps> = ({
    iconName,
    size = 24,
    color = '#000',
    customImage,
    strokeWidth = 2
}) => {
    if (customImage) {
        // If it's a numeric resource ID from require()
        if (typeof customImage === 'number') {
            return (
                <Image
                    source={customImage}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                />
            );
        }

        // If it's a string (Base64, URL, or raw SVG)
        if (typeof customImage === 'string') {
            const trimmed = customImage.trim();
            const isRawSvg = trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');

            if (isRawSvg) {
                return (
                    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                        <SvgXml xml={trimmed} width="100%" height="100%" />
                    </View>
                );
            }

            return (
                <Image
                    source={{ uri: customImage }}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                />
            );
        }

        // If it's an object (Webpack module or object with uri)
        if (typeof customImage === 'object') {
            return (
                <Image
                    source={customImage as any}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                />
            );
        }
    }

    const LucideIcon = (Icons as any)[iconName] || Icons.Smile;
    return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
};

export default MoodIcon;
