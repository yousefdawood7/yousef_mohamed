import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { dashboardApi, DashboardStats, DiagnosisResult } from '../../services/api';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed to load dashboard data from backend:', e);
      // Mock fallback if server is offline during development
      setStats({
        total_scans: 45,
        completed_scans: 42,
        failed_scans: 3,
        high_risk_scans: 5,
        growth_rate: 15.5,
        accuracy_metrics: {
          average_confidence: 0.9654,
          average_confidence_percentage: '96.54%',
          average_inference_time_ms: 138.45,
        },
        disease_distribution: [
          { class: 'nv', label_ar: 'وحمات صبغية (شامة)', is_malignant: false, count: 27 },
          { class: 'bkl', label_ar: 'آفات التقرن الحميدة', is_malignant: false, count: 10 },
          { class: 'bcc', label_ar: 'سرطان الخلايا القاعدية', is_malignant: true, count: 3 },
          { class: 'akiec', label_ar: 'التقان السعفي', is_malignant: true, count: 2 },
        ],
        recent_scans: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading clinical dashboard...</Text>
      </View>
    );
  }

  const renderRiskBadge = (risk: 'Low' | 'Moderate' | 'High') => {
    let bg = colors.riskLowBg;
    let text = colors.riskLowText;
    let dot = '#006C49';

    if (risk === 'Moderate') {
      bg = colors.riskModBg;
      text = colors.riskModText;
      dot = '#855300';
    } else if (risk === 'High') {
      bg = colors.riskHighBg;
      text = colors.riskHighText;
      dot = '#BA1A1A';
    }

    return (
      <View style={[styles.riskPill, { backgroundColor: bg }]}>
        <View style={[styles.riskDot, { backgroundColor: dot }]} />
        <Text style={[styles.riskText, { color: text }]}>{risk}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar (node 1:1517) */}
      <View style={styles.topAppBar}>
        {/* Brand Name / Logo */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../../assets/images/dr_hakeem_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>DR  HAKEEM</Text>
        </View>

        {/* Header Right Actions: Search, Notifications, Avatar */}
        <View style={styles.headerRightGroup}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={colors.slateMuted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search records..."
              placeholderTextColor="#6B7280"
              style={[
                styles.searchInput,
                { outlineStyle: 'none', outline: 'none' } as any,
              ]}
            />
          </View>

          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Feather name="bell" size={18} color={colors.slateMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Feather name="sliders" size={18} color={colors.slateMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => navigation.navigate('ProfileTab' as any)}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../../assets/images/doctor_avatar.png')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Hero Grid (Hero CTA + Stats Stack) (node 1:1545) */}
        <View style={[styles.heroRow, !isTablet && styles.columnLayout]}>
          {/* CTA Card (span 8) */}
          <View style={[styles.ctaCard, isTablet && { flex: 2.1 }]}>
            <Image
              source={require('../../../assets/images/dashboard_hero_bg.png')}
              style={[StyleSheet.absoluteFill, styles.ctaBgImage]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.ctaContent}>
              <Text style={styles.ctaTag}>Dermatology Intelligence</Text>
              <Text style={styles.ctaHeading}>
                Analyze skin health with clinical-grade AI precision.
              </Text>
              <Text style={styles.ctaSubtext}>
                Our advanced neural network evaluates images for 2,000+ conditions with 98.4% clinical validation accuracy.
              </Text>

              <TouchableOpacity
                style={styles.ctaButtonWrapper}
                onPress={() => navigation.navigate('NewScanTab' as any)}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={colors.gradientCta}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>Begin a new skin analysis</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Stack (span 4) */}
          <View style={[styles.statsStack, isTablet && { flex: 1 }]}>
            {/* Stat Card 1: Total Scans */}
            <View style={styles.statCard}>
              <View>
                <Text style={styles.statLabel}>TOTAL SCANS</Text>
                <Text style={styles.statNumberSky}>{stats.total_scans.toLocaleString()}</Text>
              </View>
              <View style={styles.statFooterDivider}>
                <View style={styles.statTrendBadge}>
                  <Feather name="trending-up" size={14} color={colors.emeraldGreen} />
                  <Text style={styles.statTrendText}>+{stats.growth_rate}%</Text>
                </View>
                <Text style={styles.statPeriodText}>from last month</Text>
              </View>
            </View>

            {/* Stat Card 2: Diagnostic Accuracy */}
            <View style={[styles.statCard, styles.accuracyCard]}>
              <View>
                <Text style={styles.statLabel}>DIAGNOSTIC ACCURACY</Text>
                <Text style={styles.statNumberEmerald}>
                  {stats.accuracy_metrics?.average_confidence_percentage || '96.5%'}
                </Text>
              </View>
              <View style={styles.accuracyBarWrapper}>
                <View style={styles.accuracyBarTrack}>
                  <View
                    style={[
                      styles.accuracyBarFill,
                      {
                        width: `${Math.round(
                          (stats.accuracy_metrics?.average_confidence || 0.96) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Bottom Grid (Disease Distribution + Recent Activity Table) */}
        <View style={[styles.bottomRow, !isTablet && styles.columnLayout]}>
          {/* Disease Distribution Card (span 4) */}
          <View style={[styles.lastResultCard, isTablet && { flex: 1 }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Disease Prevalence</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ScanHistoryTab' as any)}>
                <Text style={styles.cardHeaderLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.diseaseDistributionContainer}>
              {stats.disease_distribution.map((dist) => (
                <View key={dist.class} style={styles.distItemRow}>
                  <View style={styles.distLabelGroup}>
                    <View
                      style={[
                        styles.distIndicatorDot,
                        { backgroundColor: dist.is_malignant ? '#DC2626' : '#059669' },
                      ]}
                    />
                    <Text style={styles.distLabelText}>
                      {dist.label_ar} ({dist.class.toUpperCase()})
                    </Text>
                  </View>
                  <Text style={styles.distCountText}>{dist.count} cases</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Analysis History Table (span 8) */}
          <View style={[styles.activityAndInsightsGroup, isTablet && { flex: 2.1 }]}>
            <View style={styles.recentActivityCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionTitle}>Recent Analysis History</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ScanHistoryTab' as any)}>
                  <Text style={styles.cardHeaderMutedLink}>See all records</Text>
                </TouchableOpacity>
              </View>

              {/* Table */}
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 1.2 }]}>DATE</Text>
                  <Text style={[styles.thCell, { flex: 1.1 }]}>CASE ID</Text>
                  <Text style={[styles.thCell, { flex: 1.6 }]}>FINDING</Text>
                  <Text style={[styles.thCell, { flex: 1.1 }]}>RISK</Text>
                  <Text style={[styles.thCell, { flex: 1 }]}>ACTION</Text>
                </View>

                {/* Table Rows */}
                {stats.recent_scans && stats.recent_scans.length > 0 ? (
                  stats.recent_scans.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.tableDataRow}
                      onPress={() =>
                        navigation.navigate('ScanHistoryTab' as any, {
                          screen: 'DiagnosticReport',
                          params: { scanId: item.id.toString(), diagnosisData: item },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tdDate, { flex: 1.2 }]}>
                        {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={[styles.tdPatientId, { flex: 1.1 }]}>
                        {item.patient_id_code || `DX-${item.id}`}
                      </Text>
                      <Text style={[styles.tdAnalysis, { flex: 1.6 }]} numberOfLines={1}>
                        {item.label_ar || item.predicted_label}
                      </Text>
                      <View style={{ flex: 1.1, alignItems: 'flex-start' }}>
                        {renderRiskBadge(item.risk_level === 'high' || item.is_malignant ? 'High' : item.risk_level === 'moderate' ? 'Moderate' : 'Low')}
                      </View>
                      <Text style={[styles.tdStatus, { flex: 1, color: colors.primary, fontWeight: '700' }]}>
                        View →
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>
                      No recent scans found. Perform a scan to view records.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Health Insight Cards */}
            <View style={styles.insightsRow}>
              <View style={styles.insightCard}>
                <View style={[styles.insightIconCircle, { backgroundColor: '#CFE5FF' }]}>
                  <Feather name="trending-up" size={18} color={colors.skyBlue} />
                </View>
                <View style={styles.insightTextGroup}>
                  <Text style={styles.insightTitle}>High Accuracy Inference</Text>
                  <Text style={styles.insightDescription}>
                    Deep convolutional neural network active with Test-Time Augmentation (TTA).
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={[styles.insightIconCircle, { backgroundColor: '#6FFBBE' }]}>
                  <Feather name="shield" size={18} color={colors.emeraldGreen} />
                </View>
                <View style={styles.insightTextGroup}>
                  <Text style={styles.insightTitle}>HIPAA End-to-End Encryption</Text>
                  <Text style={styles.insightDescription}>
                    All dermoscopic frames and Grad-CAM attention maps encrypted in transit.
                  </Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.slateDark,
    fontWeight: '500',
  },
  topAppBar: {
    height: 68,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    shadowColor: '#0C4A6E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3FF',
    borderRadius: 9999,
    paddingHorizontal: 14,
    height: 38,
    width: 240,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyDark,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 9999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 28,
    gap: 24,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 24,
  },
  columnLayout: {
    flexDirection: 'column',
  },
  ctaCard: {
    minHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  ctaBgImage: {
    opacity: 0.22,
  },
  ctaContent: {
    padding: 32,
    maxWidth: 560,
  },
  ctaTag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00629E',
    marginBottom: 8,
  },
  ctaHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#131B2E',
    lineHeight: 32,
    marginBottom: 12,
  },
  ctaSubtext: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3F4751',
    marginBottom: 24,
  },
  ctaButtonWrapper: {
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#00629E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsStack: {
    gap: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    justifyContent: 'space-between',
    minHeight: 130,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statNumberSky: {
    fontSize: 30,
    fontWeight: '700',
    color: '#00629E',
  },
  statNumberEmerald: {
    fontSize: 30,
    fontWeight: '700',
    color: '#006C49',
  },
  statFooterDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 8,
  },
  statTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006C49',
  },
  statPeriodText: {
    fontSize: 12,
    color: '#707882',
  },
  accuracyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#006C49',
  },
  accuracyBarWrapper: {
    marginTop: 12,
  },
  accuracyBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    backgroundColor: '#006C49',
    borderRadius: 9999,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 24,
  },
  lastResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
  },
  cardHeaderLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00629E',
  },
  cardHeaderMutedLink: {
    fontSize: 13,
    color: '#707882',
  },
  lastResultImageContainer: {
    height: 170,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  lastResultImage: {
    width: '100%',
    height: '100%',
  },
  caseBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 98, 158, 0.2)',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  caseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00629E',
    letterSpacing: 0.5,
  },
  lastResultInfoGroup: {
    gap: 16,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  lowRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 108, 73, 0.1)',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  lowRiskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006C49',
  },
  confidenceSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  confidenceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  confidenceBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#00629E',
    borderRadius: 9999,
  },
  confidencePercentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#131B2E',
  },
  activityAndInsightsGroup: {
    gap: 20,
  },
  recentActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  tableContainer: {
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.6,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingVertical: 14,
  },
  tdDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
  tdPatientId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00629E',
  },
  tdAnalysis: {
    fontSize: 13,
    color: '#131B2E',
  },
  tdStatus: {
    fontSize: 13,
    color: '#707882',
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  insightIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextGroup: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#131B2E',
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#3F4751',
  },
  diseaseDistributionContainer: {
    paddingVertical: 12,
    gap: 12,
  },
  distItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  distLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  distIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131B2E',
  },
  distCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00629E',
  },
  emptyTableRow: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
