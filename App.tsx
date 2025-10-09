import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SpendingScreen from './src/screens/SpendingScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import SavingScreen from './src/screens/SavingScreen';
import AccountScreen from './src/screens/AccountScreen';

// Context
import { FinanceProvider } from './src/context/FinanceContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SpendingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SpendingHome" component={SpendingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'All Expenses' }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction Detail' }} />
    </Stack.Navigator>
  );
}

function RootTabs() {
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

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

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#5B5FFF',
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            backgroundColor: '#fff',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Spending"
          component={SpendingStack}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'SpendingHome';
            const hide = routeName === 'Expenses' || routeName === 'TransactionDetail';
            return {
              tabBarStyle: [
                {
                  borderTopWidth: 0,
                  elevation: 10,
                  height: 70 + insets.bottom,
                  paddingTop: 8,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
                  backgroundColor: '#fff',
                  marginTop: -15,
                },
                hide ? { display: 'none' } : null,
              ],
            };
          }}
        />
        <Tab.Screen name="Saving" component={SavingScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanceProvider>
        <RootTabs />
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
