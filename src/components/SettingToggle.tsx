import React from 'react';
import { View, Text, StyleSheet, Switch, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface SettingToggleProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  style,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={styles.iconBox}>
          <Feather name={icon} size={18} color={value ? colors.primary : '#64748B'} />
        </View>
      )}

      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textGroup: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#131B2E',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
});
