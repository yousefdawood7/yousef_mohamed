import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface FormInputProps<T extends FieldValues> extends Omit<TextInputProps, 'defaultValue'> {
  name: Path<T>;
  control: Control<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
  badge?: string;
  rightAction?: {
    text: string;
    onPress: () => void;
  };
  containerStyle?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

function FormInputBase<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  badge,
  rightAction,
  containerStyle,
  leftIcon,
  isPassword = false,
  placeholder,
  ...textInputProps
}: FormInputProps<T>) {
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          {(label || rightAction || badge) && (
            <View style={styles.labelRow}>
              <View style={styles.labelLeftGroup}>
                {label && <Text style={styles.label}>{label}</Text>}
                {badge && <Text style={styles.badge}>{badge}</Text>}
              </View>
              {rightAction && (
                <TouchableOpacity onPress={rightAction.onPress} activeOpacity={0.7}>
                  <Text style={styles.rightActionText}>{rightAction.text}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View
            style={[
              styles.inputWrapper,
              isFocused && styles.inputWrapperFocused,
              error && styles.inputError,
            ]}
          >
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={18}
                color={isFocused ? colors.primary : colors.mutedText}
                style={styles.leftIcon}
              />
            )}

            <TextInput
              style={[
                styles.input,
                leftIcon ? styles.inputWithLeftIcon : null,
                isPassword ? styles.inputWithRightIcon : null,
                Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : null,
              ]}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              onChangeText={onChange}
              value={value}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholderText}
              secureTextEntry={isPassword && !showPassword}
              autoCapitalize="none"
              {...textInputProps}
            />

            {isPassword && (
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isFocused ? colors.primary : colors.mutedText}
                />
              </TouchableOpacity>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.bodyText,
  },
  rightActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.navy,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginRight: 4,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

// Memoized to prevent sibling fields from re-rendering when one field changes.
// `control` is stable across renders and `rules` are memoized at call sites,
// so props stay referentially stable and memoization is effective.
export const FormInput = React.memo(FormInputBase) as typeof FormInputBase;
