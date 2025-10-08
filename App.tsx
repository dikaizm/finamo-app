import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SpendingScreen from './src/screens/SpendingScreen';
import SavingScreen from './src/screens/SavingScreen';
import AccountScreen from './src/screens/AccountScreen';

// Context
import { FinanceProvider } from './src/context/FinanceContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanceProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Spending') {
                  iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                } else if (route.name === 'Saving') {
                  iconName = focused ? 'wallet' : 'wallet-outline';
                } else if (route.name === 'Account') {
                  iconName = focused ? 'person' : 'person-outline';
                } else {
                  iconName = 'help-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#5B5FFF',
              tabBarInactiveTintColor: '#9CA3AF',
              headerShown: false,
              tabBarStyle: {
                paddingBottom: 8,
                paddingTop: 8,
                height: 60,
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Spending" component={SpendingScreen} />
            <Tab.Screen name="Saving" component={SavingScreen} />
            <Tab.Screen name="Account" component={AccountScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
