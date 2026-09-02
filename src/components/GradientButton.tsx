import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'right' | 'left';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  borderRadius?: number;
  size?: 'normal' | 'large';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconName = 'arrow-forward',
  iconPosition = 'right',
  style,
  textStyle,
  gradientColors = colors.gradientPrimary,
  borderRadius = 8,
  size = 'normal',
}) => {
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.wrapper, { borderRadius }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          { borderRadius },
          isLarge ? styles.largePadding : styles.normalPadding,
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {iconName && iconPosition === 'left' && (
              <Ionicons
                name={iconName}
                size={isLarge ? 18 : 16}
                color="#FFFFFF"
                style={styles.leftIcon}
              />
            )}
            <Text style={[styles.text, isLarge && styles.largeText, textStyle]}>
              {title}
            </Text>
            {iconName && iconPosition === 'right' && (
              <Ionicons
                name={iconName}
                size={isLarge ? 18 : 16}
                color="#FFFFFF"
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#451EBB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalPadding: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  largePadding: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  largeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
