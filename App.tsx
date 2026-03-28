import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SpendingScreen from './src/screens/SpendingScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import WalletScreen from './src/screens/WalletScreen';
import AccountScreen from './src/screens/AccountScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BudgetDetailScreen from './src/screens/BudgetDetailScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import ManualTransactionScreen from './src/screens/ManualTransactionScreen';

// Context
import { FinanceProvider } from './src/context/FinanceContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ManualTransaction"
        component={ManualTransactionScreen}
        options={({ navigation }) => ({
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarHidden: true,
        })}
      />
    </Stack.Navigator>
  );
}

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

  const tabConfig: Record<string, { icon: string; iconFocused: string; label: string }> = {
    Home: { icon: 'home-outline', iconFocused: 'home', label: 'Home' },
    Spending: { icon: 'pie-chart-outline', iconFocused: 'pie-chart', label: 'Spending' },
    Wallet: { icon: 'card-outline', iconFocused: 'card', label: 'Wallet' },
    Budget: { icon: 'grid-outline', iconFocused: 'grid', label: 'Budget' },
    Account: { icon: 'person-outline', iconFocused: 'person', label: 'Account' },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = tabConfig[route.name] || tabConfig.Home;
        return {
          tabBarIcon: ({ focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? `${COLORS.primary}12` : 'transparent',
            }}>
              <Ionicons
                name={(focused ? config.iconFocused : config.icon) as any}
                size={22}
                color={focused ? COLORS.primary : '#94A3B8'}
                style={{ marginBottom: -1 }}
              />
            </View>
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: 11,
              fontWeight: focused ? '600' : '500',
              color,
              marginTop: 2,
            }}>
              {config.label}
            </Text>
          ),
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0,
            height: 64 + insets.bottom,
            paddingTop: 6,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
          },
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
          const hide = routeName === 'BudgetDetail' || routeName === 'ManualTransaction';
          return {
            tabBarStyle: hide ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen
        name="Spending"
        component={SpendingStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SpendingHome';
          const hide = routeName === 'Expenses' || routeName === 'TransactionDetail';
          return {
            tabBarStyle: hide ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { user, isLoading, showLogoutModal } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {/* Show auth screens when logged out OR logout modal is visible */}
      {(user && !showLogoutModal) ? <RootTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FinanceProvider>
          <NavigationRoot />
        </FinanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
