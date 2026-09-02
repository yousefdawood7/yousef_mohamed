import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScanNavProp } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { diagnosesApi, DiagnosisResult } from '../../services/api';

const STATUS_FILTERS = [
  { label: 'All Scans', value: 'ALL' },
  { label: 'Low Risk', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High Risk', value: 'high' },
];

export const ScanHistoryScreen: React.FC = () => {
  const navigation = useNavigation<ScanNavProp<'ScanHistory'>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;
  const numColumns = isTablet ? 3 : 1;

  const [scans, setScans] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const loadData = async (status = selectedStatus) => {
    setLoading(true);
    try {
      const response = await diagnosesApi.getHistory({
        per_page: 30,
        status: status === 'ALL' ? undefined : status,
      });
      setScans(response.data || []);
    } catch (e) {
      console.warn('Failed to load scan history from backend:', e);
      // Fallback empty if backend offline
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedStatus);
  }, [selectedStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedStatus);
  };

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    const query = searchQuery.toLowerCase();
    return scans.filter(
      (s) =>
        s.label_ar?.toLowerCase().includes(query) ||
        s.predicted_label?.toLowerCase().includes(query) ||
        s.patient_id_code?.toLowerCase().includes(query) ||
        s.id.toString().includes(query)
    );
  }, [scans, searchQuery]);

  const renderBadge = (item: DiagnosisResult) => {
    const isHigh = item.is_malignant || item.risk_level === 'high' || item.risk_level === 'critical';
    const isMod = item.risk_level === 'moderate';
    const bg = isHigh ? '#FEE2E2' : isMod ? '#FEF3C7' : '#ECFDF5';
    const dotColor = isHigh ? '#DC2626' : isMod ? '#D97706' : '#059669';
    const textColor = dotColor;

    return (
      <View style={[styles.badgeOverlay, { backgroundColor: bg }]}>
        <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.badgeText, { color: textColor }]}>
          {item.risk_level_label || (isHigh ? 'High Risk' : 'Low Risk')}
        </Text>
      </View>
    );
  };

  const renderScanCard = ({ item }: { item: DiagnosisResult }) => {
    const imgSource =
      item.image_url && item.image_url.startsWith('http')
        ? { uri: item.image_url }
        : require('../../../assets/images/last_scan_result.png');

    const confidenceNumeric = item.confidence > 1 ? item.confidence : item.confidence * 100;

    return (
      <TouchableOpacity
        style={[styles.card, isTablet && styles.cardTablet]}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('DiagnosticReport', {
            scanId: item.id.toString(),
            title: `${item.label_ar} (${item.predicted_label})`,
            diagnosisData: item,
            imageUri: item.image_url,
          })
        }
      >
        {/* Top Image & Status Badge */}
        <View style={styles.cardImageContainer}>
          <Image source={imgSource} style={styles.cardImage} resizeMode="cover" />
          {renderBadge(item)}
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.idTitleGroup}>
              <Text style={styles.cardIdText}>{item.patient_id_code || `SCAN #${item.id}`}</Text>
              <Text style={styles.cardTitleText} numberOfLines={1}>
                {item.label_ar || item.predicted_label}
              </Text>
            </View>
            <View style={styles.confidenceGroup}>
              <Text style={styles.confidenceValueText}>
                {item.confidence_percentage || `${confidenceNumeric.toFixed(1)}%`}
              </Text>
              <Text style={styles.confidenceLabelText}>CONFIDENCE</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${confidenceNumeric}%`,
                  backgroundColor: item.is_malignant ? '#DC2626' : '#00629E',
                },
              ]}
            />
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.dateGroup}>
              <Feather name="calendar" size={13} color={colors.slateMuted} />
              <Text style={styles.dateText}>
                {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewReportBtn}
              onPress={() =>
                navigation.navigate('DiagnosticReport', {
                  scanId: item.id.toString(),
                  title: `${item.label_ar} (${item.predicted_label})`,
                  diagnosisData: item,
                  imageUri: item.image_url,
                })
              }
            >
              <Text style={styles.viewReportText}>VIEW REPORT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top App Bar Search & Identity */}
      <View style={styles.topBarRow}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/images/dr_hakeem_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>DR  HAKEEM</Text>
        </View>

        <View style={styles.headerSearch}>
          <Feather name="search" size={16} color={colors.slateMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Arabic name, English label, or patient ID..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.slateMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Hero Title & Filter Chips */}
      <View style={styles.titleSection}>
        <View>
          <Text style={styles.pageTitle}>Clinical Scan History</Text>
          <Text style={styles.pageSubtitle}>
            Comprehensive longitudinal dermoscopic records and AI diagnostic classifications.
          </Text>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterChipsRow}>
          {STATUS_FILTERS.map((f) => {
            const isSelected = selectedStatus === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedStatus(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching scan history from server...</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={filteredScans}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          renderItem={renderScanCard}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Clinical Scans Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No records match your search filter.'
                  : 'Start a new scan with your USB digital microscope to record diagnoses.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 20,
    marginBottom: 20,
  },
  headerContainer: {
    paddingTop: 18,
    paddingBottom: 24,
    gap: 20,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    width: '50%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#131B2E',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#131B2E',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#00629E',
    borderColor: '#00629E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  cardTablet: {
    flex: 1,
    marginBottom: 0,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 18,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  idTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  cardIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.5,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 2,
  },
  confidenceGroup: {
    alignItems: 'flex-end',
  },
  confidenceValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00629E',
  },
  confidenceLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#707882',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  viewReportBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewReportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00629E',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#131B2E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
