import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ProfileNavProp } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { SettingToggle } from '../../components/SettingToggle';
import { patientApi, PatientProfileData } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ProfileScreenProps {
  onSignOut?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSignOut }) => {
  const navigation = useNavigation<ProfileNavProp<'Profile'>>();
  const { user, patientProfile: authProfile, signOut, refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;

  const [profile, setProfile] = useState<PatientProfileData | null>(authProfile || null);
  const [loading, setLoading] = useState(!authProfile);

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    authProfile?.settings?.notifications_enabled ?? true
  );
  const [darkMode, setDarkMode] = useState(authProfile?.settings?.dark_mode ?? false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await patientApi.getProfile();
      setProfile(data);
      if (data.settings) {
        setNotificationsEnabled(data.settings.notifications_enabled);
        setDarkMode(data.settings.dark_mode);
      }
    } catch (e) {
      console.warn('Failed to load profile from backend:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    try {
      await patientApi.updateSettings({
        settings: {
          notifications_enabled: val,
          dark_mode: darkMode,
          language: 'ar',
        },
      });
      await refreshProfile();
    } catch (err) {
      console.warn('Failed to update notification setting:', err);
    }
  };

  const handleToggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    try {
      await patientApi.updateSettings({
        settings: {
          notifications_enabled: notificationsEnabled,
          dark_mode: val,
          language: 'ar',
        },
      });
      await refreshProfile();
    } catch (err) {
      console.warn('Failed to update dark mode setting:', err);
    }
  };

  const handleSignOutPress = async () => {
    const doSignOut = async () => {
      try {
        await signOut();
        if (onSignOut) {
          onSignOut();
        }
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out of Dr. Hakeem?') : true;
      if (confirmed) {
        await doSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of Dr. Hakeem?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doSignOut,
        },
      ]);
    }
  };

  const userName = user?.name || profile?.user?.name || 'سلمى محمد';
  const userEmail = user?.email || profile?.user?.email || 'salma.mohamed@example.com';
  const patientCode = profile?.patient_code || 'PAT-A8F2K1';

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/images/dr_hakeem_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>DR  HAKEEM</Text>
        </View>

        <View style={styles.profileBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#00629E" />
          <Text style={styles.profileBadgeText}>PATIENT & CLINICIAN PROFILE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bento Grid Layout (Left Column + Right Column) */}
        <View style={[styles.bentoContainer, !isTablet && styles.columnLayout]}>
          {/* LEFT COLUMN: Identity + Medical Profile + Sign Out (flex 1) */}
          <View style={[styles.leftColumn, isTablet && { flex: 1 }]}>
            {/* Identity Card */}
            <View style={styles.card}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  <LinearGradient
                    colors={['#7A04BB', '#04ADC2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarCircle}
                  >
                    <Text style={styles.avatarInitialsText}>
                      {userName
                        ? userName
                            .trim()
                            .split(/\s+/)
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'YD'}
                    </Text>
                  </LinearGradient>
                  <View style={styles.onlineBadge} />
                </View>
                <Text style={styles.doctorName}>{userName}</Text>
                <Text style={styles.doctorRole}>CODE: {patientCode}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactList}>
                <View style={styles.contactItem}>
                  <Feather name="mail" size={15} color="#00629E" style={styles.contactIcon} />
                  <Text style={styles.contactText}>{userEmail}</Text>
                </View>

                <View style={styles.contactItem}>
                  <Feather name="activity" size={15} color="#00629E" style={styles.contactIcon} />
                  <Text style={styles.contactText}>
                    Skin Type: {profile?.skin_type || 'Type II'} • Blood: {profile?.blood_group || 'A+'}
                  </Text>
                </View>

                <View style={styles.contactItem}>
                  <Feather name="user" size={15} color="#00629E" style={styles.contactIcon} />
                  <Text style={styles.contactText}>Age: {profile?.age ? `${profile.age} years` : '34 years'}</Text>
                </View>
              </View>
            </View>

            {/* Clinical Conditions & Allergies Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="shield" size={16} color="#00629E" />
                <Text style={styles.sectionTitle}>Medical Profile & Allergies</Text>
              </View>

              <View style={styles.attributesList}>
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>DOCUMENTED CONDITIONS:</Text>
                  {profile?.conditions && profile.conditions.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profile.conditions.map((c, i) => (
                        <View key={i} style={styles.conditionTag}>
                          <Text style={styles.conditionTagText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyMedicalText}>No chronic conditions documented in clinical file</Text>
                  )}
                </View>

                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>ACTIVE ALLERGIES:</Text>
                  {profile?.active_allergies && profile.active_allergies.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profile.active_allergies.map((a, i) => (
                        <View key={i} style={styles.allergyTag}>
                          <Text style={styles.allergyTagText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyMedicalText}>No known drug or skin allergies (NKDA)</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Sign Out Card */}
            <TouchableOpacity
              style={styles.signOutCard}
              onPress={handleSignOutPress}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#DC2626" />
              <Text style={styles.signOutText}>Sign Out of System</Text>
            </TouchableOpacity>
          </View>

          {/* RIGHT COLUMN: Settings & System Info (flex 1.2) */}
          <View style={[styles.rightColumn, isTablet && { flex: 1.2 }]}>
            {/* System Preferences Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="sliders" size={16} color="#00629E" />
                <Text style={styles.sectionTitle}>Preferences & Interface</Text>
              </View>

              <View style={styles.settingsList}>
                <SettingToggle
                  icon="bell"
                  title="Clinical Push Notifications"
                  subtitle="Receive instant alerts for urgent malignant scan classifications."
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                />

                <SettingToggle
                  icon="moon"
                  title="Dark Theme Preference"
                  subtitle="Optimize contrast for low-light clinical examination environments."
                  value={darkMode}
                  onValueChange={handleToggleDarkMode}
                />
              </View>
            </View>

            {/* AI Diagnostics System Info Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="cpu" size={16} color="#00629E" />
                <Text style={styles.sectionTitle}>AI System Information</Text>
              </View>

              <View style={styles.systemInfoGrid}>
                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoKey}>Inference Engine:</Text>
                  <Text style={styles.sysInfoVal}>EfficientNet-B3 (PyTorch + TTA consensus)</Text>
                </View>

                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoKey}>Explainability Mode:</Text>
                  <Text style={styles.sysInfoVal}>Grad-CAM Attention Heatmap (α = 0.45)</Text>
                </View>

                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoKey}>Hardware Interface:</Text>
                  <Text style={styles.sysInfoVal}>UVC 2.0/3.0 USB Digital Microscope</Text>
                </View>

                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoKey}>IoT Robot Eyes:</Text>
                  <Text style={styles.sysInfoVal}>HiveMQ Cloud MQTT (wss://...:8884)</Text>
                </View>

                <View style={styles.sysInfoRow}>
                  <Text style={styles.sysInfoKey}>Cloud API Host:</Text>
                  <Text style={styles.sysInfoVal}>Hostinger SSL (Laravel 11 Sanctum)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  topAppBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00629E',
    letterSpacing: 1.5,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF4FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00629E',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 28,
  },
  bentoContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  columnLayout: {
    flexDirection: 'column',
  },
  leftColumn: {
    gap: 20,
  },
  rightColumn: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyMedicalText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  onlineBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#131B2E',
  },
  doctorRole: {
    fontSize: 13,
    color: '#00629E',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    marginRight: 10,
    width: 20,
  },
  contactText: {
    fontSize: 13,
    color: '#475569',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
  },
  attributesList: {
    gap: 14,
  },
  attributeItem: {
    gap: 6,
  },
  attributeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  conditionTagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  allergyTag: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  allergyTagText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  signOutCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsList: {
    gap: 16,
  },
  systemInfoGrid: {
    gap: 10,
  },
  sysInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sysInfoKey: {
    fontSize: 13,
    color: '#64748B',
  },
  sysInfoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
});
