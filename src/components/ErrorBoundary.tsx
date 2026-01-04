import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AlertTriangle, RefreshCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    countdown: number;
    errorCount: number;
    lastErrorMessage: string;
}

const ErrorFallbackView = ({
    isInfiniteLoop,
    countdown,
    error,
    errorCount,
    onRetry,
    onReset
}: {
    isInfiniteLoop: boolean;
    countdown: number;
    error: Error | null;
    errorCount: number;
    onRetry: () => void;
    onReset: () => void;
}) => {
    const { theme } = useMood();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <AlertTriangle size={64} color="#EF4444" style={styles.icon} />
                <Text style={styles.title}>
                    {isInfiniteLoop ? '⚠️ Infinite Error Loop Detected' : 'Oops! Something went wrong.'}
                </Text>
                <Text style={styles.subtitle}>
                    {isInfiniteLoop
                        ? 'The same error occurred multiple times. Auto-reload has been disabled to prevent crashes.'
                        : 'The app will automatically reload in:'}
                </Text>

                {!isInfiniteLoop && (
                    <>
                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdown}>{countdown}</Text>
                            <Text style={styles.seconds}>seconds</Text>
                        </View>
                        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
                    </>
                )}

                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error?.message || 'Unknown error occurred'}
                    </Text>
                    {isInfiniteLoop && (
                        <Text style={[styles.errorText, { marginTop: 8, fontWeight: 'bold' }]}>
                            Error occurred {errorCount} times
                        </Text>
                    )}
                </View>

                {isInfiniteLoop ? (
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={onReset}>
                        <RefreshCcw size={20} color="#FFF" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Reset & Try Again</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={onRetry}>
                        <RefreshCcw size={20} color="#FFF" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Reload Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

export class ErrorBoundary extends Component<Props, State> {
    private countdownInterval: NodeJS.Timeout | null = null;
    private static errorHistory: { message: string; timestamp: number }[] = [];

    public state: State = {
        hasError: false,
        error: null,
        countdown: 10,
        errorCount: 0,
        lastErrorMessage: '',
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Track error history to detect infinite loops
        const now = Date.now();
        const errorMessage = error.message || error.toString();

        // Clean up old errors (older than 30 seconds)
        ErrorBoundary.errorHistory = ErrorBoundary.errorHistory.filter(
            e => now - e.timestamp < 30000
        );

        // Add current error
        ErrorBoundary.errorHistory.push({ message: errorMessage, timestamp: now });

        // Count how many times this same error occurred recently
        const sameErrorCount = ErrorBoundary.errorHistory.filter(
            e => e.message === errorMessage
        ).length;

        this.setState({
            errorCount: sameErrorCount,
            lastErrorMessage: errorMessage
        });

        // Only start auto-reload if error count is less than 3 (prevent infinite loops)
        if (sameErrorCount < 3) {
            this.startCountdown();
        } else {
            console.error('Infinite error loop detected. Auto-reload disabled.');
        }
    }

    private startCountdown = () => {
        // Clear any existing interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Start countdown from 10
        this.setState({ countdown: 10 });

        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            this.setState((prevState) => {
                const newCountdown = prevState.countdown - 1;

                if (newCountdown <= 0) {
                    this.clearTimer();
                    this.handleRetry();
                }

                return { countdown: newCountdown };
            });
        }, 1000);
    };

    private clearTimer = () => {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    };

    private handleRetry = () => {
        this.clearTimer();
        this.setState({
            hasError: false,
            error: null,
            countdown: 10
        });
    };

    private handleClearErrorHistory = () => {
        ErrorBoundary.errorHistory = [];
        this.setState({ errorCount: 0 });
        this.handleRetry();
    };

    public componentWillUnmount() {
        this.clearTimer();
    }

    public render() {
        if (this.state.hasError) {
            return (
                <ErrorFallbackView
                    isInfiniteLoop={this.state.errorCount >= 3}
                    countdown={this.state.countdown}
                    error={this.state.error}
                    errorCount={this.state.errorCount}
                    onRetry={this.handleRetry}
                    onReset={this.handleClearErrorHistory}
                />
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    countdown: {
        fontSize: 48,
        fontWeight: '900',
        color: '#9cb167',
        marginRight: 8,
    },
    seconds: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
    },
    loader: {
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: '#FEE2E2',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 14,
        fontFamily: 'Courier',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#4B5563',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 50,
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
