import React, { useEffect } from 'react';
import {  } from 'lucide-react-native';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * LogoutModal Component
 * 
 * Bottom sheet modal shown when user session expires or auth fails.
 * Provides a friendly way to redirect to login screen.
 */
export const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onConfirm, onCancel }) => {
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <View style={styles.backdrop} />

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle Bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="log-out-outline" size={48} color={COLORS.warning} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Session Expired</Text>

          {/* Message */}
          <Text style={styles.message}>
            You've been logged out for security reasons. Please log in again to continue.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
