import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#5B5FFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#5B5FFF" />
          </TouchableOpacity>
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
                      <Ionicons name={item.icon as any} size={24} color="#5B5FFF" />
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
                      trackColor={{ false: '#E5E7EB', true: '#5B5FFF' }}
                      thumbColor="white"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 24,
  },
});
