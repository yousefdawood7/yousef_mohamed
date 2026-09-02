import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { DiagnosisResult } from '../services/api';

export type AuthStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string } | undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  ScanHistoryTab: undefined;
  NewScanTab: undefined;
  ProfileTab: undefined;
};

export type ScanStackParamList = {
  ScanHistory: undefined;
  DiagnosticReport: {
    scanId: string;
    title?: string;
    imageUri?: string;
    diagnosisData?: DiagnosisResult;
  };
};

export type NewScanStackParamList = {
  NewScan: undefined;
  DiagnosticReport: {
    scanId: string;
    title?: string;
    imageUri?: string;
    diagnosisData?: DiagnosisResult;
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  DiagnosticReport: {
    scanId: string;
    title?: string;
    imageUri?: string;
    diagnosisData?: DiagnosisResult;
  };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthNavigationProp<RouteName extends keyof AuthStackParamList> =
  CompositeNavigationProp<
    NativeStackNavigationProp<AuthStackParamList, RouteName>,
    NativeStackNavigationProp<RootStackParamList>
  >;

export type MainTabNavProp<RouteName extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, RouteName>,
    NativeStackNavigationProp<RootStackParamList>
  >;

export type ScanNavProp<RouteName extends keyof ScanStackParamList> =
  CompositeNavigationProp<
    NativeStackNavigationProp<ScanStackParamList, RouteName>,
    BottomTabNavigationProp<MainTabParamList>
  >;

export type NewScanNavProp<RouteName extends keyof NewScanStackParamList> =
  CompositeNavigationProp<
    NativeStackNavigationProp<NewScanStackParamList, RouteName>,
    BottomTabNavigationProp<MainTabParamList>
  >;

export type ProfileNavProp<RouteName extends keyof ProfileStackParamList> =
  CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, RouteName>,
    BottomTabNavigationProp<MainTabParamList>
  >;

export type ScanRouteProp<RouteName extends keyof ScanStackParamList> =
  RouteProp<ScanStackParamList, RouteName>;

export type NewScanRouteProp<RouteName extends keyof NewScanStackParamList> =
  RouteProp<NewScanStackParamList, RouteName>;

export type ProfileRouteProp<RouteName extends keyof ProfileStackParamList> =
  RouteProp<ProfileStackParamList, RouteName>;
