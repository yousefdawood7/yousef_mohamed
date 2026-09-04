import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../types/navigation';
import { AuthLayout } from '../../components/AuthLayout';
import { FormInput } from '../../components/FormInput';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SignUpFormData {
  fullName: string;
  email: string;
  licenseNumber?: string;
  password: string;
  confirmPassword: string;
}

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'SignUp'>>();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      licenseNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Stable validate callback. Uses non-reactive getValues() instead of watch()
  // to avoid re-rendering the whole screen on every password keystroke.
  const validateConfirmPassword = useCallback(
    (value?: string) =>
      value === getValues('password') || 'Passwords do not match',
    [getValues]
  );

  // Stable rule objects so React.memo(FormInput) can skip re-renders.
  const fullNameRules = useMemo(
    () => ({
      required: 'Full name is required',
      minLength: {
        value: 3,
        message: 'Name must be at least 3 characters',
      },
    }),
    []
  );
  const emailRules = useMemo(
    () => ({
      required: 'Work email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Please enter a valid email address',
      },
    }),
    []
  );
  const passwordRules = useMemo(
    () => ({
      required: 'Password is required',
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters',
      },
    }),
    []
  );
  const confirmPasswordRules = useMemo(
    () => ({
      required: 'Please confirm your password',
      validate: validateConfirmPassword,
    }),
    [validateConfirmPassword]
  );

  const onSubmit = useCallback(async (data: SignUpFormData) => {
    setLoading(true);
    setAuthError(null);
    try {
      await register(
        data.fullName,
        data.email,
        data.password,
        data.confirmPassword
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        err?.response?.data?.errors?.password?.[0] ||
        err?.message ||
        'Unable to create account. Please verify your details.';
      setAuthError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  }, [register]);

  const onPressCreateAccount = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  return (
    <AuthLayout
      bgImageSource={require('../../../assets/images/signup_bg.png')}
      headline={'Join the secure AI ecosystem\nfor diagnostic support.'}
      subheadline={
        'Elevate your clinical decisions with precision-engineered\nAI insights. Designed exclusively for healthcare\nprofessionals.'
      }
      badgeTitle="HIPAA Compliant Environment"
      badgeDescription="Your patient data is secured with enterprise-grade encryption and strict clinical compliance protocols."
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start leveraging AI diagnostics today.</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {authError ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={18} color="#DC2626" style={styles.errorIcon} />
            <Text style={styles.errorBannerText}>{authError}</Text>
          </View>
        ) : null}
        <FormInput
          control={control}
          name="fullName"
          label="FULL NAME"
          placeholder="Dr. Jane Doe"
          rules={fullNameRules}
        />

        <FormInput
          control={control}
          name="email"
          label="WORK EMAIL"
          placeholder="jane.doe@hospital.org"
          keyboardType="email-address"
          rules={emailRules}
        />

        <FormInput
          control={control}
          name="licenseNumber"
          label="MEDICAL LICENSE NUMBER"
          badge="(Optional)"
          placeholder="e.g. MD1234567"
        />

        <FormInput
          control={control}
          name="password"
          label="PASSWORD"
          placeholder="••••••••"
          isPassword={true}
          rules={passwordRules}
        />

        <FormInput
          control={control}
          name="confirmPassword"
          label="CONFIRM PASSWORD"
          placeholder="••••••••"
          isPassword={true}
          rules={confirmPasswordRules}
        />

        {/* Submit Button */}
        <GradientButton
          title="Create Account"
          iconName="arrow-forward"
          onPress={onPressCreateAccount}
          loading={loading}
          style={styles.submitBtn}
        />

        {/* Switch to Sign In */}
        <View style={styles.switchAuthRow}>
          <Text style={styles.switchAuthText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.switchAuthLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.bodyText,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: colors.bodyText,
  },
  switchAuthLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
