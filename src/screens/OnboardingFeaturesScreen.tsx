import React, { useRef } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface Feature {
  icon: string;
  gradient: [string, string];
  title: string;
  description: string;
  example?: string;
}

interface OnboardingFeaturesScreenProps {
  onComplete: () => void;
}

export default function OnboardingFeaturesScreen({ onComplete }: OnboardingFeaturesScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = React.useState(0);

  const features: Feature[] = [
    {
      icon: 'chatbubbles',
      gradient: ['#5B5FFF', '#8B7FFF'],
      title: 'AI Financial Assistant',
      description: 'Chat naturally about your finances. Ask questions, get instant insights, and receive personalized advice powered by advanced AI.',
      example: '"How much did I spend on food last month?"\n"Should I save more or invest?"',
    },
    {
      icon: 'mic',
      gradient: ['#10B981', '#34D399'],
      title: 'Natural Language Transactions',
      description: 'Record transactions by just typing or speaking normally. Our AI automatically categorizes and understands context.',
      example: '"Spent Rp 50k on lunch at Grand Indonesia"\n"Received salary Rp 15 million"',
    },
    {
      icon: 'wallet',
      gradient: ['#F59E0B', '#FBBF24'],
      title: 'Multi-Account Tracking',
      description: 'Track all your money in one place: cash, bank accounts, e-wallets, savings, investments, and even debts.',
      example: 'See your complete net worth across BCA, GoPay, stocks, and more',
    },
    {
      icon: 'pie-chart',
      gradient: ['#EF4444', '#F87171'],
      title: 'Smart Budgeting',
      description: 'AI creates realistic budgets based on your spending patterns. Track progress and get alerts when you\'re off track.',
      example: 'Auto-generated budget with category limits and real-time tracking',
    },
    {
      icon: 'trending-up',
      gradient: ['#8B5CF6', '#A78BFA'],
      title: 'Financial Health Score',
      description: 'Get a clear score (0-100) of your financial health with actionable recommendations to improve.',
      example: 'Score: 75/100 - Good! Save 5% more to reach "Excellent"',
    },
    {
      icon: 'shield-checkmark',
      gradient: ['#06B6D4', '#22D3EE'],
      title: 'Bank-Level Security',
      description: 'Your data is encrypted and secure. Only you can access it with your unique authentication token.',
      example: 'AES-256 encryption • TLS 1.3 • Your data, your control',
    },
  ];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({ x: width * (currentStep + 1), y: 0, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {features.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const step = Math.round(offsetX / width);
          if (step !== currentStep) {
            setCurrentStep(step);
          }
        }}
        scrollEnabled={false}
      >
        {features.map((feature, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <CreditCard size={48} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </View>

            <Text style={styles.slideTitle}>{feature.title}</Text>
            <Text style={styles.slideDescription}>{feature.description}</Text>

            {feature.example && (
              <View style={styles.exampleBox}>
                <MessageCircleMore size={20} color="#5B5FFF" />
                <Text style={styles.exampleText}>{feature.example}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {currentStep < features.length - 1 ? (
          <>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <LinearGradient
                colors={[COLORS.primary, '#8B7FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextGradient}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={handleNext} style={[styles.nextButton, styles.finishButton]}>
            <LinearGradient
              colors={[COLORS.success, '#34D399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextGradient}
            >
              <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.nextButtonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  slideTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  exampleBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    maxWidth: 340,
  },
  exampleText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
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
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  finishButton: {
    shadowColor: COLORS.success,
  },
  nextGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  nextButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
