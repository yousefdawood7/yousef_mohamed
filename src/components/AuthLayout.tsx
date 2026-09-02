import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AuthLayoutProps {
  children: React.ReactNode;
  bgImageSource?: ImageSourcePropType;
  headline: string;
  subheadline: string;
  badgeTitle?: string;
  badgeDescription?: string;
  isForgotPasswordLayout?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  bgImageSource,
  headline,
  subheadline,
  badgeTitle = 'HIPAA Compliant Environment',
  badgeDescription = 'Your patient data is secured with enterprise-grade encryption and strict clinical compliance protocols.',
  isForgotPasswordLayout = false,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.mainRow, !isTablet && styles.mainColumn]}>
        {/* Left Column: Branding & Value Prop */}
        <View style={[styles.leftColumn, !isTablet && styles.leftColumnCompact]}>
          {isForgotPasswordLayout ? (
            <LinearGradient
              colors={['#451EBB', '#00687A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundLightBlue }]} />
          )}

          {bgImageSource && (
            <Image
              source={bgImageSource}
              style={[
                StyleSheet.absoluteFill,
                styles.bgImage,
                isForgotPasswordLayout && { opacity: 0.15 },
              ]}
              resizeMode="cover"
            />
          )}

          {!isForgotPasswordLayout && (
            <LinearGradient
              colors={[
                'rgba(248, 249, 255, 0.85)',
                'rgba(248, 249, 255, 0.70)',
                'rgba(220, 233, 255, 0.80)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View style={styles.leftContent}>
            {/* Top Brand Logo */}
            <View>
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/images/dr_hakeem_logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.brandName,
                    isForgotPasswordLayout && styles.brandNameWhite,
                  ]}
                >
                  Dr. Hakeem
                </Text>
              </View>

              {/* Headings */}
              <View style={styles.headlineContainer}>
                <Text
                  style={[
                    styles.headline,
                    isForgotPasswordLayout && styles.headlineWhite,
                  ]}
                >
                  {headline}
                </Text>
                <Text
                  style={[
                    styles.subheadline,
                    isForgotPasswordLayout && styles.subheadlineWhite,
                  ]}
                >
                  {subheadline}
                </Text>
              </View>
            </View>

            {/* Bottom Glassmorphic Card or Feature Boxes */}
            {isForgotPasswordLayout ? (
              <View style={styles.forgotCardsRow}>
                <View style={styles.forgotFeatureCard}>
                  <Ionicons name="shield-checkmark" size={24} color="#D8CEFF" />
                  <Text style={styles.forgotFeatureTitle}>HIPAA Secure</Text>
                  <Text style={styles.forgotFeatureText}>
                    Full regulatory compliance for diagnostic integrity.
                  </Text>
                </View>
                <View style={styles.forgotFeatureCard}>
                  <Ionicons name="lock-closed" size={24} color="#8CE7F3" />
                  <Text style={[styles.forgotFeatureTitle, { color: '#8CE7F3' }]}>
                    Encrypted Reset
                  </Text>
                  <Text style={styles.forgotFeatureText}>
                    Secure, multi-factor identity verification process.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.glassCard}>
                <View style={styles.glassCardRow}>
                  <View style={styles.glassIconWrapper}>
                    <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
                  </View>
                  <View style={styles.glassTextWrapper}>
                    <Text style={styles.glassTitle}>{badgeTitle}</Text>
                    <Text style={styles.glassDesc}>{badgeDescription}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Right Column: Form Area */}
        <View style={styles.rightColumn}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formCard}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainColumn: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  leftColumnCompact: {
    flex: 0.45,
    minHeight: 280,
  },
  bgImage: {
    opacity: 0.25,
  },
  leftContent: {
    flex: 1,
    padding: 44,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  brandNameWhite: {
    color: '#FFFFFF',
  },
  headlineContainer: {
    maxWidth: 480,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  headlineWhite: {
    color: '#FFFFFF',
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.bodyText,
  },
  subheadlineWhite: {
    color: 'rgba(255, 255, 255, 0.88)',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(201, 196, 215, 0.45)',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 520,
  },
  glassCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  glassIconWrapper: {
    marginTop: 2,
  },
  glassTextWrapper: {
    flex: 1,
  },
  glassTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 4,
  },
  glassDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.bodyText,
  },
  forgotCardsRow: {
    flexDirection: 'row',
    gap: 14,
    maxWidth: 520,
  },
  forgotFeatureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 16,
  },
  forgotFeatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotFeatureText: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  formCard: {
    width: '100%',
    maxWidth: 480,
  },
});
