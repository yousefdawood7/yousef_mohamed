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
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ScanNavProp } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { diagnosesApi, DiagnosisResult } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CardImageProps {
  imageUrl?: string;
  isMalignant?: boolean;
  id: string | number;
}

const CardImage: React.FC<CardImageProps> = ({ imageUrl, isMalignant, id }) => {
  const [imageError, setImageError] = useState(false);
  const isValidUrl = imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost');

  if (!isValidUrl || imageError) {
    return (
      <View style={styles.imagePlaceholder}>
        <LinearGradient
          colors={['#F8FAFC', '#E2E8F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.placeholderIconCircle}>
          <Ionicons name="scan-outline" size={28} color="#0284C7" />
        </View>
        <Text style={styles.placeholderTitle}>Archived Scan #{id}</Text>
        <Text style={styles.placeholderSub}>Dermoscopic capture record</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.cardImage}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
};

export const ScanHistoryScreen: React.FC = () => {
  const navigation = useNavigation<ScanNavProp<'ScanHistory'>>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 800;
  const numColumns = isTablet ? 3 : 1;
  const pageSize = isTablet ? 9 : 6;

  const [scans, setScans] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Compute initials for the doctor avatar
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'YD';

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await diagnosesApi.getHistory({
        per_page: 50,
      });

      // Handle both flat array and paginated object structure
      let list: DiagnosisResult[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && Array.isArray((response as any).data)) {
        list = (response as any).data;
      }

      setScans(list);
    } catch (e) {
      console.warn('[ScanHistoryScreen] Failed to load scan history:', e);
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter scans by search query
  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    const query = searchQuery.toLowerCase();
    return scans.filter(
      (s) =>
        s.label_ar?.toLowerCase().includes(query) ||
        s.predicted_label?.toLowerCase().includes(query) ||
        s.patient_id_code?.toLowerCase().includes(query) ||
        s.id?.toString().includes(query)
    );
  }, [scans, searchQuery]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Client-side pagination calculations
  const totalPages = Math.ceil(filteredScans.length / pageSize) || 1;
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredScans.slice(start, start + pageSize);
  }, [filteredScans, currentPage, pageSize]);

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
          {item.risk_level_label || (isHigh ? 'High Risk' : isMod ? 'Moderate' : 'Low Risk')}
        </Text>
      </View>
    );
  };

  const renderScanCard = ({ item }: { item: DiagnosisResult }) => {
    const confidenceNumeric =
      typeof item.confidence === 'number'
        ? item.confidence > 1
          ? item.confidence
          : item.confidence * 100
        : 0;

    return (
      <TouchableOpacity
        style={[styles.card, isTablet && styles.cardTablet]}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('DiagnosticReport', {
            scanId: item.id.toString(),
            title: `${item.label_ar || ''} (${item.predicted_label || ''})`,
            diagnosisData: item,
            imageUri: item.image_url,
          })
        }
      >
        {/* Image / Fallback Placeholder & Status Badge */}
        <View style={styles.cardImageContainer}>
          <CardImage imageUrl={item.image_url} isMalignant={item.is_malignant} id={item.id} />
          {renderBadge(item)}
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.idTitleGroup}>
              <Text style={styles.cardIdText}>{item.patient_id_code || `CASE #${item.id}`}</Text>
              <Text style={styles.cardTitleText} numberOfLines={1}>
                {item.label_ar || item.predicted_label || 'Unclassified Lesion'}
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
                  width: `${Math.min(100, Math.max(0, confidenceNumeric))}%`,
                  backgroundColor: item.is_malignant ? '#DC2626' : '#0284C7',
                },
              ]}
            />
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.dateGroup}>
              <Feather name="calendar" size={13} color="#94A3B8" />
              <Text style={styles.dateText}>
                {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.viewReportBtn}>
              <Text style={styles.viewReportText}>INSPECT REPORT →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. TOP APP BAR (Logo, Search, Avatar) - Removed refresh button */}
      <View style={styles.topBarRow}>
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

        <View style={styles.headerRightGroup}>
          {/* Global Search Bar */}
          <View style={styles.headerSearch}>
            <Feather name="search" size={15} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by diagnosis, English term, or ID..."
              placeholderTextColor="#94A3B8"
              style={[
                styles.searchInput,
                Platform.OS === 'web' && ({ outlineStyle: 'none', outline: 'none' } as any),
              ]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Initials Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => navigation.navigate('ProfileTab' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7A04BB', '#04ADC2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitialsText}>{initials}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. PAGE TITLE & NEW SCAN ACTION - Removed filter tags */}
      <View style={styles.titleSection}>
        <View style={styles.titleLeft}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>Clinical Scan History</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredScans.length} Scans</Text>
            </View>
          </View>
          <Text style={styles.pageSubtitle}>
            Comprehensive longitudinal dermoscopic records and AI diagnostic classifications.
          </Text>
        </View>

        {/* New Scan Button */}
        <TouchableOpacity
          style={styles.newScanBtn}
          onPress={() => navigation.navigate('NewScanTab' as any)}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={15} color="#FFFFFF" />
          <Text style={styles.newScanBtnText}>New Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPagination = () => {
    if (filteredScans.length <= pageSize) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, filteredScans.length);

    // Build page number list
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      pages.push(p);
    }

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfoText}>
          Showing {startItem}–{endItem} of {filteredScans.length} clinical evaluations
        </Text>

        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#CBD5E1' : '#1E293B'} />
            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.pageNumbersRow}>
            {pages.map((p) => {
              const isActive = p === currentPage;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.pageNumberBtn, isActive && styles.pageNumberBtnActive]}
                  onPress={() => setCurrentPage(p)}
                >
                  <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>
              Next
            </Text>
            <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#CBD5E1' : '#1E293B'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching scan history from database...</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={paginatedScans}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          renderItem={renderScanCard}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderPagination}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="folder" size={36} color="#0284C7" />
              </View>
              <Text style={styles.emptyTitle}>No Clinical Scans Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No records match your filter query "${searchQuery}".`
                  : 'No dermoscopic scans have been recorded in this account yet. Start an AI analysis using your USB microscope or upload from gallery.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                onPress={() => navigation.navigate('NewScanTab' as any)}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.emptyCtaText}>Launch First AI Scan</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  columnWrapper: {
    gap: 20,
    marginBottom: 20,
  },

  // 1. Top App Bar & Header
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 10,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 260,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // 2. Title & Action Section
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  titleLeft: {
    gap: 4,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    maxWidth: 600,
  },
  newScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  newScanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 3. Scan Cards
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardTablet: {
    maxWidth: '32%',
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  placeholderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  placeholderSub: {
    fontSize: 11,
    color: '#64748B',
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
    borderRadius: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  idTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  cardIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  confidenceGroup: {
    alignItems: 'flex-end',
  },
  confidenceValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  confidenceLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
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
    fontWeight: '500',
  },
  viewReportBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewReportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },

  // 4. Pagination
  paginationContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  paginationInfoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNumberBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 5. Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 460,
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
