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
import { patientApi, dashboardApi, PatientProfileData, DashboardStats } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

interface ProfileScreenProps {
  onSignOut?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSignOut }) => {
  const navigation = useNavigation<ProfileNavProp<'Profile'>>();
  const { user, patientProfile: authProfile, signOut, refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 850;

  const [profile, setProfile] = useState<PatientProfileData | null>(authProfile || null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(!authProfile);

  useEffect(() => {
    loadProfileAndStats();
  }, []);

  const loadProfileAndStats = async () => {
    setLoading(true);
    try {
      const [profileData, statsData] = await Promise.allSettled([
        patientApi.getProfile(),
        dashboardApi.getStats(),
      ]);

      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value);
      }
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
    } catch (e) {
      console.warn('[ProfileScreen] Failed to load profile:', e);
    } finally {
      setLoading(false);
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
        console.warn('[ProfileScreen] Sign out error:', err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out of Dr. Hakeem?')
          : true;
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

  const userName = user?.name || profile?.user?.name || 'Yousef Dawood';
  const userEmail = user?.email || profile?.user?.email || 'yousefdawood31@gmail.com';
  const patientCode = profile?.patient_code || 'PAT-QCIWL3';

  // Compute clean Google-style initials (Arabic: "س م", English: "YD")
  const initials = getInitials(userName);

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading practitioner profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/images/dr_hakeem_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandTitle}>DR. HAKEEM</Text>
            <Text style={styles.brandSubtitle}>Clinical Dermatology AI Suite</Text>
          </View>
        </View>

        <View style={styles.profileBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.profileBadgeText}>VERIFIED CLINICIAN SESSION</Text>
        </View>
      </View>

      {/* 2. MAIN CONTENT AREA */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.bentoContainer, !isTablet && styles.columnLayout]}>
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Clinician Identity Card + Actions (flex 1)                    */}
          {/* ========================================================================= */}
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
                    <Text style={styles.avatarInitialsText}>{initials}</Text>
                  </LinearGradient>
                  <View style={styles.onlineBadge} />
                </View>

                <Text style={styles.doctorName}>{userName}</Text>
                <View style={styles.doctorCodePill}>
                  <Feather name="tag" size={12} color="#0284C7" />
                  <Text style={styles.doctorCodeText}>CLINICAL ID: {patientCode}</Text>
                </View>
                <View style={styles.verifiedRoleBadge}>
                  <Feather name="check-circle" size={13} color="#059669" />
                  <Text style={styles.verifiedRoleText}>Active Licensed Clinician</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactList}>
                <View style={styles.contactItem}>
                  <View style={styles.contactIconBox}>
                    <Feather name="mail" size={14} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>EMAIL ADDRESS</Text>
                    <Text style={styles.contactText}>{userEmail}</Text>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={styles.contactIconBox}>
                    <Feather name="activity" size={14} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>PHYSIOLOGICAL PROFILE</Text>
                    <Text style={styles.contactText}>
                      Skin Type: {profile?.skin_type || 'Type II'} • Blood Group: {profile?.blood_group || 'A+'}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={styles.contactIconBox}>
                    <Feather name="calendar" size={14} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>AGE / DEMOGRAPHICS</Text>
                    <Text style={styles.contactText}>
                      {profile?.age ? `${profile.age} years old` : '34 years old'}
                    </Text>
                  </View>
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
              <Text style={styles.signOutText}>Sign Out of Dr. Hakeem</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Clinical Activity & Medical Profile (flex 1.2)              */}
          {/* ========================================================================= */}
          <View style={[styles.rightColumn, isTablet && { flex: 1.2 }]}>
            {/* Clinical Activity & Repository Metrics Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="database" size={16} color="#0284C7" />
                <Text style={styles.sectionTitle}>Repository & Diagnostics Summary</Text>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>
                    {stats?.total_scans !== undefined ? stats.total_scans : 0}
                  </Text>
                  <Text style={styles.metricLabel}>Total Cases Recorded</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={[styles.metricNumber, { color: '#059669' }]}>
                    {stats?.completed_scans !== undefined ? stats.completed_scans : 0}
                  </Text>
                  <Text style={styles.metricLabel}>Verified Completed Scans</Text>
                </View>
              </View>
            </View>

            {/* Medical Profile & Allergies Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="clipboard" size={16} color="#0284C7" />
                <Text style={styles.sectionTitle}>Documented Medical Conditions</Text>
              </View>

              <View style={styles.attributesList}>
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>CHRONIC SKIN CONDITIONS:</Text>
                  {profile?.conditions && profile.conditions.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profile.conditions.map((c, i) => (
                        <View key={i} style={styles.conditionTag}>
                          <Text style={styles.conditionTagText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyNoticeBox}>
                      <Feather name="info" size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.emptyMedicalText}>
                        No chronic conditions documented in this patient file.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>ACTIVE DRUG & SKIN ALLERGIES:</Text>
                  {profile?.active_allergies && profile.active_allergies.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {profile.active_allergies.map((a, i) => (
                        <View key={i} style={styles.allergyTag}>
                          <Text style={styles.allergyTagText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyNoticeBox}>
                      <Feather name="check" size={14} color="#059669" style={{ marginRight: 6 }} />
                      <Text style={[styles.emptyMedicalText, { color: '#059669' }]}>
                        No known drug allergies recorded (NKDA).
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Clinical Security & Encryption Notice */}
            <View style={styles.securityBanner}>
              <Feather name="shield" size={18} color="#059669" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>HIPAA Encrypted Clinical Environment</Text>
                <Text style={styles.securityDesc}>
                  All dermoscopic imagery, Grad-CAM attention layers, and diagnostic predictions are securely stored with SHA-256 tokens and accessible only to authorized medical personnel.
                </Text>
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Top App Bar
  topAppBar: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },

  // Main Scroll Content
  scrollContent: {
    padding: 28,
    paddingBottom: 48,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Avatar & Identity
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 2,
    right: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  doctorCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  doctorCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  verifiedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedRoleText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },

  // Contact Info
  contactList: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  contactText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 1,
  },

  // Sign Out Button
  signOutCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
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

  // Right Column Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Medical Profile Attributes
  attributesList: {
    gap: 16,
  },
  attributeItem: {
    gap: 8,
  },
  attributeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  conditionTagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  allergyTag: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  allergyTagText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyMedicalText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Security Banner
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  securityDesc: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});
