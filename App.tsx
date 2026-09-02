import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F0F9FF',
  },
};

const linking: LinkingOptions<any> = {
  prefixes: ['http://localhost:8081', 'drhakeem://', '/'],
  config: {
    screens: {
      Splash: 'splash',
      SignIn: 'signin',
      SignUp: 'signup',
      ForgotPassword: 'forgot-password',
      Dashboard: 'dashboard',
      ScanHistoryTab: {
        screens: {
          ScanHistory: 'history',
          DiagnosticReport: 'report/:scanId',
        },
      },
      NewScanTab: {
        screens: {
          NewScan: 'new-scan',
          DiagnosticReport: 'new-scan/report/:scanId',
        },
      },
      ProfileTab: {
        screens: {
          Profile: 'profile',
          DiagnosticReport: 'profile/report/:scanId',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme} linking={linking}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
