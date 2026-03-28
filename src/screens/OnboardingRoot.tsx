import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingConsentScreen from './OnboardingConsentScreen';
import OnboardingFeaturesScreen from './OnboardingFeaturesScreen';
import OnboardingBalanceScreen from './OnboardingBalanceScreen';
import { 
  initializeAccounts, 
  completeOnboarding,
  BalanceInput 
} from '../services/accountService';
import { useAuth } from '../context/AuthContext';

type OnboardingStep = 'consent' | 'features' | 'balance' | 'complete';

export default function OnboardingRoot({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>('consent');
  const { logout } = useAuth();

  const handleConsentAgree = async () => {
    try {
      // Initialize default accounts after consent
      await initializeAccounts();
      setStep('features');
    } catch (error) {
      console.error('Failed to initialize accounts:', error);
      alert('Failed to setup your account. Please try again.');
      // Still proceed to features even if initialization fails
      setStep('features');
    }
  };

  const handleFeaturesComplete = () => {
    setStep('balance');
  };

  const handleBalanceComplete = async (balances: BalanceInput[]) => {
    try {
      // Convert balances to required format for API
      const formattedBalances = balances.map(b => ({
        account_type: b.account_type,
        balance: parseFloat(b.balance.replace(/[^0-9]/g, '')),
        description: b.note,
      }));

      // Complete onboarding by setting initial balances
      await completeOnboarding(formattedBalances);
      
      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 500);
      
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      alert(
        `Failed to save initial balances: ${error.message || 'Please try again'}`
      );
      // Still complete onboarding even if balance save fails
      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const handleSkipBalance = async () => {
    try {
      // Complete without initial balances
      await completeOnboarding([]);
    } catch (error) {
      console.error('Failed to skip balance:', error);
      // Continue anyway
    }
    
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <View style={styles.container}>
      {step === 'consent' && (
        <OnboardingConsentScreen 
          onAgree={handleConsentAgree}
        />
      )}
      
      {step === 'features' && (
        <OnboardingFeaturesScreen 
          onComplete={handleFeaturesComplete}
        />
      )}
      
      {step === 'balance' && (
        <OnboardingBalanceScreen 
          onComplete={handleBalanceComplete}
          onSkip={handleSkipBalance}
        />
      )}
      
      {step === 'complete' && (
        <View style={styles.completeContainer}>
          {/* This is just a brief transition */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
