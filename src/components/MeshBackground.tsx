import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useMood } from '../context/MoodContext';

const { width, height } = Dimensions.get('window');

export const MeshBackground = ({ children }: { children?: React.ReactNode }) => {
    const { theme } = useMood();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
                    <Defs>
                        {/* Indigo/Violet */}
                        <RadialGradient id="grad1" cx="20%" cy="10%" rx="80%" ry="80%" fx="20%" fy="10%" gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
                            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                        </RadialGradient>
                        {/* Amber/Orange */}
                        <RadialGradient id="grad2" cx="85%" cy="25%" rx="70%" ry="70%" fx="85%" fy="25%" gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.12" />
                            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                        </RadialGradient>
                        {/* Teal/Emerald */}
                        <RadialGradient id="grad3" cx="15%" cy="70%" rx="60%" ry="60%" fx="15%" fy="70%" gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#008080" stopOpacity="0.1" />
                            <Stop offset="100%" stopColor="#008080" stopOpacity="0" />
                        </RadialGradient>
                        {/* Pink/Coral */}
                        <RadialGradient id="grad4" cx="80%" cy="85%" rx="80%" ry="80%" fx="80%" fy="85%" gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#EC4899" stopOpacity="0.12" />
                            <Stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>

                    {/* Background Rect */}
                    <Rect x="0" y="0" width="100%" height="100%" fill={theme.background} />

                    {/* Mesh Orbs */}
                    <Circle cx="20%" cy="10%" r={width * 1.0} fill="url(#grad1)" />
                    <Circle cx="85%" cy="25%" r={width * 0.9} fill="url(#grad2)" />
                    <Circle cx="15%" cy="70%" r={width * 0.8} fill="url(#grad3)" />
                    <Circle cx="80%" cy="85%" r={width * 1.1} fill="url(#grad4)" />
                </Svg>
            </View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
