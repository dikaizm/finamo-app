import React, { useState } from 'react';
import { CheckCircle, XCircle, Check, X, ShieldCheck, CreditCard } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingConsentScreenProps {
  onAgree: () => void;
  onSkip?: () => void;
}

export default function OnboardingConsentScreen({ onAgree, onSkip }: OnboardingConsentScreenProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.primary, '#8B7FFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <ShieldCheck size={48} color="#FFFFFF" />
          </LinearGradient>
          
          <Text style={styles.title}>Your Privacy & Security</Text>
          <Text style={styles.subtitle}>
            We're committed to protecting your financial data with the highest security standards.
          </Text>
        </View>

        {/* Security Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 How We Protect Your Data</Text>
          
          <SecurityFeature
            icon="lock-closed"
            title="Bank-Level Encryption"
            description="All data is encrypted in transit (TLS 1.3) and at rest (AES-256), the same standard used by major banks."
          />
          
          <SecurityFeature
            icon="key"
            title="Unique Access Token"
            description="Only your personal authentication token can access your data. Not even we can view it without your credentials."
          />
          
          <SecurityFeature
            icon="server"
            title="Secure Storage"
            description="Your data is stored in isolated, secure databases with regular security audits and backups."
          />
          
          <SecurityFeature
            icon="person-check"
            title="Your Data, Your Control"
            description="You own your data completely. Export or delete it anytime from your account settings."
          />
        </View>

        {/* What We Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 What Data We Collect</Text>
          
          <DataItem
            icon="wallet"
            label="Account Balances"
            description="Cash, savings, and investment account balances you choose to track"
          />
          
          <DataItem
            icon="receipt"
            label="Transaction History"
            description="Income, expenses, and transfers you record for financial insights"
          />
          
          <DataItem
            icon="chatbubble-ellipses"
            label="AI Conversations"
            description="Chat history with your AI financial advisor for personalized recommendations"
          />
          
          <DataItem
            icon="pie-chart"
            label="Financial Analytics"
            description="Spending patterns, budget progress, and net worth calculations"
          />
        </View>

        {/* What We Do With It */}
        <View style={styles.infoBox}>
          <CheckCircle size={24} color={COLORS.success} strokeWidth={2} />
          <Text style={styles.infoText}>
            ✅ <strong>We use your data ONLY to:</strong> Provide personalized financial insights, 
            track your progress, and improve your AI assistant's recommendations.
          </Text>
        </View>
        
        <View style={[styles.infoBox, styles.warningBox]}>
          <XCircle size={24} color={COLORS.danger} strokeWidth={2} />
          <Text style={styles.infoText}>
            ❌ <strong>We NEVER:</strong> Sell your data, share it with third parties, 
            or use it for advertising without your explicit consent.
          </Text>
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsChecked(!isChecked)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
            {isChecked && <Check size={16} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the Privacy Policy and Terms of Service
          </Text>
        </TouchableOpacity>

        {/* Agree Button */}
        <TouchableOpacity
          style={[styles.agreeButton, !isChecked && styles.agreeButtonDisabled]}
          onPress={onAgree}
          disabled={!isChecked}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!isChecked ? [COLORS.gray400, COLORS.gray300] : [COLORS.primary, '#8B7FFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.agreeGradient}
          >
            <ShieldCheck size={20} color="#FFFFFF" />
            <Text style={styles.agreeButtonText}>
              I Agree & Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          By agreeing, you consent to secure storage and processing of your financial data 
          as described above. You can withdraw consent and delete your data at any time.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityFeature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <CreditCard size={20} color={COLORS.primary} strokeWidth={2} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

function DataItem({ icon, label, description }: { icon: string; label: string; description: string }) {
  return (
    <View style={styles.dataItem}>
      <View style={styles.dataIcon}>
        <CreditCard size={18} color="#5B5FFF" strokeWidth={2} />
      </View>
      <View style={styles.dataContent}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 18,
  },
  dataItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dataIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dataContent: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dataDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  warningBox: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 20,
  },
  agreeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  agreeButtonDisabled: {
    opacity: 0.6,
  },
  agreeGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  agreeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
