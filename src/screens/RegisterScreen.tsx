import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || 
                                error?.response?.data?.message || 
                                error?.message || 
                                'Something went wrong. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to start your financial journey</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SIZES.xl,
    },
    headerContainer: {
        marginBottom: SIZES.xxl,
    },
    title: {
        fontSize: 28,
        fontFamily: FONTS.bold,
        color: COLORS.gray900,
        marginBottom: SIZES.xs,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.gray500,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: SIZES.lg,
    },
    label: {
        fontSize: 14,
        fontFamily: FONTS.medium,
        color: COLORS.gray700,
        marginBottom: SIZES.xs,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.sm,
        padding: SIZES.md,
        fontSize: 16,
        fontFamily: FONTS.regular,
        color: COLORS.gray900,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: SIZES.md,
        borderRadius: SIZES.sm,
        alignItems: 'center',
        marginTop: SIZES.sm,
        marginBottom: SIZES.xl,
        ...SHADOWS.medium,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: COLORS.gray600,
    },
    footerLink: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
});

export default RegisterScreen;
