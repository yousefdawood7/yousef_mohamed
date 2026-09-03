import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      licenseNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
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
        err?.message ||
        'Unable to create account. Please verify your details.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

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
        <FormInput
          control={control}
          name="fullName"
          label="FULL NAME"
          placeholder="Dr. Jane Doe"
          rules={{
            required: 'Full name is required',
            minLength: {
              value: 3,
              message: 'Name must be at least 3 characters',
            },
          }}
        />

        <FormInput
          control={control}
          name="email"
          label="WORK EMAIL"
          placeholder="jane.doe@hospital.org"
          keyboardType="email-address"
          rules={{
            required: 'Work email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          }}
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
          rules={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
        />

        <FormInput
          control={control}
          name="confirmPassword"
          label="CONFIRM PASSWORD"
          placeholder="••••••••"
          isPassword={true}
          rules={{
            required: 'Please confirm your password',
            validate: (value) =>
              value === passwordValue || 'Passwords do not match',
          }}
        />

        {/* Submit Button */}
        <GradientButton
          title="Create Account"
          iconName="arrow-forward"
          onPress={handleSubmit(onSubmit)}
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
  googleBtn: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201, 196, 215, 0.6)',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.bodyText,
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
