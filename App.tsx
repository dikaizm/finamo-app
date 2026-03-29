import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { Home, PieChart, Wallet, Calculator, User } from 'lucide-react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
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
      <Stack.Screen name="SpendingHome" component={ExpensesScreen} options={{ title: 'Transactions' }} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction Detail' }} />
    </Stack.Navigator>
  );
}

function RootTabs() {
  const insets = useSafeAreaInsets();

  const iconConfig: Record<string, { regular: any; filled: any }> = {
    Home: { regular: Home, filled: Home },
    Txns: { regular: PieChart, filled: PieChart },
    Wallet: { regular: Wallet, filled: Wallet },
    Budget: { regular: Calculator, filled: Calculator },
    Account: { regular: User, filled: User },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = iconConfig[route.name] || iconConfig.Home;
        const IconComponent = config.regular;
        
        return ({
          tabBarIcon: ({ focused, color, size }) => (
            <IconComponent 
              size={size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
              absoluteStrokeWidth
            />
          ),
          tabBarActiveTintColor: COLORS.primary,
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
        });
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
          const hide = routeName === 'BudgetDetail' || routeName === 'ManualTransaction';
          return {
            tabBarStyle: [
              {
                borderTopWidth: 0,
                elevation: 10,
                height: 70 + insets.bottom,
                paddingTop: 8,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
                backgroundColor: '#fff',
                marginTop: -24,
              },
              hide ? { display: 'none' } : null,
            ],
          };
        }}
      />
      <Tab.Screen
        name="Txns"
        component={SpendingStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SpendingHome';
          const hide = routeName === 'TransactionDetail';
          return {
            tabBarLabel: 'Txns',
            tabBarStyle: [
              {
                borderTopWidth: 0,
                elevation: 10,
                height: 70 + insets.bottom,
                paddingTop: 8,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
                backgroundColor: '#fff',
                marginTop: -24,
              },
              hide ? { display: 'none' } : null,
            ],
          };
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            backgroundColor: '#fff',
            marginTop: -24,
          }
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Budget',
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            backgroundColor: '#fff',
            marginTop: -24,
          }
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen}
        options={{
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            backgroundColor: '#fff',
            marginTop: -24,
          }
        }}
      />
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
