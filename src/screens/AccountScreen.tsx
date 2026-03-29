import React, { useEffect, useState } from 'react';
import { Settings, User, Edit2, ChevronRight } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getHealthScore, getRecommendations } from '../services/accountService';

export default function AccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const [healthScore, setHealthScore] = useState<{ score: number; rating: string; color: string; issues_count: number; top_issues: string[] } | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{ type: string; category: string; priority: string; title: string; message: string; action: string }>>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [score, recs] = await Promise.all([getHealthScore(), getRecommendations()]);
        setHealthScore(score);
        setRecommendations(recs.slice(0, 3));
      } catch (e) {
        console.error('[AccountScreen] insights error:', e);
      } finally {
        setInsightsLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will automatically switch to auth screens via AuthContext
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: 'person-outline', title: 'Profile Settings', subtitle: 'Update your personal info' },
        { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your cards' },
        { icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password and authentication' },
      ],
    },
    {
      section: 'Preferences',
      items: [
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Push notifications', hasSwitch: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'finger-print-outline', title: 'Biometric Login', subtitle: 'Use fingerprint/face ID', hasSwitch: true, value: biometricsEnabled, onToggle: setBiometricsEnabled },
        { icon: 'color-palette-outline', title: 'Appearance', subtitle: 'Theme and display' },
      ],
    },
    {
      section: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help Center', subtitle: 'Get help and support' },
        { icon: 'chatbubble-outline', title: 'Contact Us', subtitle: 'Reach out to our team' },
        { icon: 'document-text-outline', title: 'Terms & Privacy', subtitle: 'Legal information' },
      ],
    },
  ];

  // Get user display info
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity>
            <Bell size={24} color="#1F2937" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color={COLORS.primary} strokeWidth={2} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Edit2 size={20} color={COLORS.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Financial Health Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Health</Text>
          <View style={styles.menuCard}>
            {insightsLoading ? (
              <View style={styles.insightsLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.insightsLoadingText}>Analyzing your finances...</Text>
              </View>
            ) : healthScore ? (
              <View style={styles.healthCard}>
                <View style={styles.healthScoreRow}>
                  <View style={[styles.healthScoreBadge, { backgroundColor: healthScore.color + '20' }]}>
                    <Text style={[styles.healthScoreNum, { color: healthScore.color }]}>{healthScore.score}</Text>
                    <Text style={[styles.healthScoreLabel, { color: healthScore.color }]}>/100</Text>
                  </View>
                  <View style={styles.healthScoreInfo}>
                    <Text style={styles.healthRating}>{healthScore.rating}</Text>
                    {healthScore.issues_count > 0 && (
                      <Text style={styles.healthIssues}>{healthScore.issues_count} issue{healthScore.issues_count > 1 ? 's' : ''} detected</Text>
                    )}
                    {healthScore.top_issues.slice(0, 2).map((issue, i) => (
                      <Text key={i} style={styles.healthIssueItem}>• {issue}</Text>
                    ))}
                  </View>
                </View>
                {recommendations.length > 0 && (
                  <View style={styles.recsContainer}>
                    <Text style={styles.recsTitle}>Recommendations</Text>
                    {recommendations.map((rec, i) => (
                      <View key={i} style={[styles.recItem, i < recommendations.length - 1 && styles.recBorder]}>
                        <View style={[styles.recPriorityDot, { backgroundColor: rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#10B981' }]} />
                        <View style={styles.recContent}>
                          <Text style={styles.recTitle}>{rec.title}</Text>
                          <Text style={styles.recMessage} numberOfLines={2}>{rec.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.insightsLoading}>
                <Text style={styles.insightsLoadingText}>Unable to load health score</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                      thumbColor="white"
                    />
                  ) : (
                    <View 20 #9CA3AF />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>Version 0.1.0-alpha.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 10,
    color: '#6B7280',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  signOutText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.danger,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 32,
  },
  insightsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  insightsLoadingText: { fontSize: 12, color: '#9CA3AF' },
  healthCard: { padding: 16 },
  healthScoreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
  healthScoreBadge: { borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 80 },
  healthScoreNum: { fontSize: 32, fontWeight: '800' },
  healthScoreLabel: { fontSize: 11, fontWeight: '600' },
  healthScoreInfo: { flex: 1, paddingTop: 4 },
  healthRating: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  healthIssues: { fontSize: 11, color: '#EF4444', marginBottom: 4 },
  healthIssueItem: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
  recsContainer: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  recsTitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  recBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recPriorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  recContent: { flex: 1 },
  recTitle: { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  recMessage: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
});
