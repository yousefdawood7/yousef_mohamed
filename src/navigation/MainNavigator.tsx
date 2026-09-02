import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
  MainTabParamList,
  ScanStackParamList,
  NewScanStackParamList,
  ProfileStackParamList,
} from '../types/navigation';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { ScanHistoryScreen } from '../screens/main/ScanHistoryScreen';
import { DiagnosticReportScreen } from '../screens/main/DiagnosticReportScreen';
import { NewScanScreen } from '../screens/main/NewScanScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const NewScanStack = createNativeStackNavigator<NewScanStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ScanStackNavigator() {
  return (
    <ScanStack.Navigator
      initialRouteName="ScanHistory"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <ScanStack.Screen name="ScanHistory" component={ScanHistoryScreen} />
      <ScanStack.Screen name="DiagnosticReport" component={DiagnosticReportScreen} />
    </ScanStack.Navigator>
  );
}

function NewScanStackNavigator() {
  return (
    <NewScanStack.Navigator
      initialRouteName="NewScan"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <NewScanStack.Screen name="NewScan" component={NewScanScreen} />
      <NewScanStack.Screen name="DiagnosticReport" component={DiagnosticReportScreen} />
    </NewScanStack.Navigator>
  );
}

function ProfileStackNavigator({ onSignOut }: { onSignOut?: () => void }) {
  return (
    <ProfileStack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <ProfileStack.Screen name="Profile">
        {() => <ProfileScreen onSignOut={onSignOut} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="DiagnosticReport" component={DiagnosticReportScreen} />
    </ProfileStack.Navigator>
  );
}

interface MainNavigatorProps {
  onSignOut?: () => void;
}

export const MainNavigator: React.FC<MainNavigatorProps> = ({ onSignOut }) => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="grid" size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="ScanHistoryTab"
        component={ScanStackNavigator}
        options={{
          tabBarLabel: 'Scan History',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="file-text" size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="NewScanTab"
        component={NewScanStackNavigator}
        options={{
          tabBarLabel: 'New Scan',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="camera" size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        children={() => <ProfileStackNavigator onSignOut={onSignOut} />}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Feather name="user" size={20} color={focused ? colors.primary : color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeIconContainer: {
    backgroundColor: '#EFF4FF',
  },
});
