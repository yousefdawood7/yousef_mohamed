import React, { useCallback, useState } from 'react';
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

interface SignInFormData {
  email: string;
  password: string;
}

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'SignIn'>>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: 'salma.mohamed@example.com',
      password: 'Password123!',
    },
  });

  const onSubmit = useCallback(async (data: SignInFormData) => {
    setLoading(true);
    setAuthError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        err?.response?.data?.errors?.password?.[0] ||
        err?.message ||
        'The provided credentials do not match our records. Please check your email and password.';
      setAuthError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Sign In Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }, [login]);

  const onPressSignIn = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  return (
    <AuthLayout
      bgImageSource={require('../../../assets/images/signin_bg.png')}
      headline={'Precision Skin Analysis\nPowered by AI'}
      subheadline={
        'Access high-fidelity diagnostic support and longitudinal\npatient history in a secure, clinical environment.'
      }
      badgeTitle="HIPAA Compliant Environment"
      badgeDescription="Your patient data is secured with enterprise-grade encryption and strict clinical compliance protocols."
    >
      {/* Title & Subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to access your clinical dashboard.</Text>
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
          name="email"
          label="EMAIL ADDRESS"
          placeholder="doctor@clinic.com"
          keyboardType="email-address"
          rules={{
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          }}
        />

        <FormInput
          control={control}
          name="password"
          label="PASSWORD"
          placeholder="••••••••"
          isPassword={true}
          rightAction={{
            text: 'FORGOT PASSWORD?',
            onPress: () => navigation.navigate('ForgotPassword'),
          }}
          rules={{
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          }}
        />

        {/* Submit Button */}
        <GradientButton
          title="SIGN IN"
          iconName="arrow-forward"
          onPress={onPressSignIn}
          loading={loading}
          style={styles.submitBtn}
        />

        {/* Sign Up Navigation Link */}
        <View style={styles.switchAuthRow}>
          <Text style={styles.switchAuthText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.switchAuthLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Privacy Notice */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing in, you agree to the{' '}
            <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
            <Text style={styles.termsHighlight}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
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
    marginBottom: 16,
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
  termsContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  termsText: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsHighlight: {
    color: colors.primary,
    fontWeight: '500',
  },
});
