/**
 * Logged Out Modal - Shows when user is logged out
 */
import React from 'react';
import {  } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

interface LoggedOutModalProps {
  visible: boolean;
  onLogin: () => void;
}

export default function LoggedOutModal({
  visible,
  onLogin
}: LoggedOutModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={60} color={COLORS.primary} />
          </View>

          {/* Text */}
          <Text style={styles.title}>Session Expired</Text>
          <Text style={styles.message}>
            Your session has expired. Please log in again to continue.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={onLogin}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => {}}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '85%',
    maxWidth: 400,
    paddingHorizontal: 32,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(91, 91, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  laterButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  laterButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});
