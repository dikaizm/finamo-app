import React, { useState } from 'react';
import { Info, ArrowRight, CreditCard, PlusCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { AccountType, BalanceInput } from '../services/accountService';

interface BalanceInput {
  account_type: AccountType;
  balance: string;
  note: string;
}

interface OnboardingBalanceScreenProps {
  onComplete: (balances: BalanceInput[]) => void;
  onSkip: () => void;
}

const DEFAULT_ACCOUNTS: Array<{ type: AccountType; name: string; icon: string }> = [
  { type: 'cash', name: 'Cash', icon: 'wallet' },
  { type: 'checking', name: 'Bank Account', icon: 'home' },
  { type: 'savings', name: 'Savings', icon: 'piggy-bank' },
  { type: 'e_wallet', name: 'E-Wallet', icon: 'phone-portrait' },
];

export default function OnboardingBalanceScreen({ onComplete, onSkip }: OnboardingBalanceScreenProps) {
  const [balances, setBalances] = useState<Record<string, string>>({});

  const handleContinue = () => {
    // Convert to required format
    const formattedBalances: BalanceInput[] = [];
    
    let hasAnyBalance = false;
    Object.entries(balances).forEach(([type, amount]) => {
      const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
      if (!isNaN(numAmount) && numAmount > 0) {
        hasAnyBalance = true;
        formattedBalances.push({
          account_type: type as AccountType,
          balance: amount,
          note: `Initial ${type} balance`,
        });
      }
    });

    if (!hasAnyBalance) {
      Alert.alert(
        'Enter at least one balance',
        'Please enter your current balance for at least one account type to get started.',
        [{ text: 'OK' }]
      );
      return;
    }

    onComplete(formattedBalances);
  };

  const formatRupiah = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numbers));
    
    return `Rp ${formatted}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Initial Balances</Text>
          <Text style={styles.subtitle}>
            Enter your current balances to get an accurate financial picture from day one.
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Info size={24} color="#5B5FFF" strokeWidth={2} />
            <Text style={styles.infoText}>
              These amounts won't be counted as income. They're just your starting point for tracking.
            </Text>
          </View>

          {/* Account Inputs */}
          {DEFAULT_ACCOUNTS.map((account) => {
            const value = balances[account.type] || '';
            
            return (
              <View key={account.type} style={styles.inputCard}>
                <View style={[styles.accountIcon, getIconColor(account.type)]}>
                  <CreditCard size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
                
                <View style={styles.inputContent}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  
                  <TextInput
                    style={styles.balanceInput}
                    placeholder="Enter balance"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={(text) => {
                      const numbers = text.replace(/[^0-9]/g, '');
                      setBalances(prev => ({
                        ...prev,
                        [account.type]: numbers,
                      }));
                    }}
                    onFocus={(e) => {
                      e.target.setNativeProps({
                        style: { borderColor: COLORS.primary, borderWidth: 2 },
                      });
                    }}
                    onBlur={(e) => {
                      e.target.setNativeProps({
                        style: { borderColor: '#E5E7EB', borderWidth: 1 },
                      });
                    }}
                  />
                  
                  {value && (
                    <Text style={styles.formattedBalance}>
                      {formatRupiah(value)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Add More Accounts */}
          <TouchableOpacity style={styles.addAccountButton}>
            <PlusCircle size={20} color={COLORS.primary} />
            <Text style={styles.addAccountText}>Add Other Account Type</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
            <LinearGradient
              colors={[COLORS.primary, '#8B7FFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getIconColor(type: AccountType) {
  const colors: Record<AccountType, { backgroundColor: string }> = {
    cash: { backgroundColor: '#10B981' },
    checking: { backgroundColor: '#5B5FFF' },
    savings: { backgroundColor: '#F59E0B' },
    investment: { backgroundColor: '#EF4444' },
    credit_card: { backgroundColor: '#8B5CF6' },
    loan: { backgroundColor: '#6B7280' },
    e_wallet: { backgroundColor: '#06B6D4' },
  };
  
  return { backgroundColor: colors[type]?.backgroundColor || '#6B7280' };
}

// Add missing import
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 22,
  },
  scrollContent: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 20,
  },
  inputCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  balanceInput: {
    fontSize: 11,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  formattedBalance: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addAccountButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
  },
  addAccountText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  continueButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
