import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { authStorage } from '../../services/api';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'Splash'>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const checkAuthAndNavigate = async () => {
      setTimeout(() => {
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          navigation.replace('SignIn');
        }
      }, 2200);
    };

    checkAuthAndNavigate();
  }, [navigation, fadeAnim, scaleAnim]);

  const handleGetStarted = () => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      navigation.replace('SignIn');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Subtle Gradient & Circles */}
      <LinearGradient
        colors={['#F8F9FF', '#EDF2FE', '#E5EDFD']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with Glow, Border & Shadow (node 66:213 - 66:217) */}
        <View style={styles.logoOuterWrapper}>
          <View style={styles.logoGlow} />
          <View style={styles.logoCard}>
            <Image
              source={require('../../../assets/images/dr_hakeem_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Headline (node 66:208 - 66:210) */}
        <Text style={styles.headline}>
          Precision Skin Analysis{'\n'}Powered by Intelligence
        </Text>

        {/* Subheadline (node 66:211 - 66:212) */}
        <Text style={styles.subheadline}>
          Empowering healthcare professionals with immediate, high-fidelity diagnostic support.{'\n'}
          Elevate your clinical decisions with quiet power and reliable precision.
        </Text>

        {/* Action Button: Get Started (node 66:218 - 66:222) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleGetStarted}
          style={styles.actionButtonWrapper}
        >
          <LinearGradient
            colors={['#451EBB', '#00687A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Security / Trust Badge (node 66:223 - 66:228) */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={16} color="rgba(72, 69, 84, 0.75)" />
          <Text style={styles.trustBadgeText}>
            HIPAA Compliant Diagnostic Suite
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(69, 30, 187, 0.04)',
    top: -150,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(0, 104, 122, 0.04)',
    bottom: -120,
    left: -80,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: 820,
  },
  logoOuterWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
  },
  logoGlow: {
    position: 'absolute',
    width: 212,
    height: 212,
    borderRadius: 28,
    backgroundColor: 'rgba(69, 30, 187, 0.12)',
    shadowColor: '#451EBB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
  },
  logoCard: {
    width: 192,
    height: 192,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(211, 228, 254, 0.6)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#451EBB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headline: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0B1C30',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#484554',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 680,
    marginBottom: 40,
  },
  actionButtonWrapper: {
    borderRadius: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 48,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 9999,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(211, 228, 254, 0.45)',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  trustBadgeText: {
    fontSize: 14,
    color: 'rgba(72, 69, 84, 0.85)',
    fontWeight: '500',
  },
});
