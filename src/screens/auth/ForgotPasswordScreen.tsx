import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthNavigationProp } from '../../types/navigation';
import { AuthLayout } from '../../components/AuthLayout';
import { FormInput } from '../../components/FormInput';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';
import { authApi } from '../../services/api';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'ForgotPassword'>>();
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });

  // Stable rule object so React.memo(FormInput) can skip re-renders.
  const emailRules = useMemo(
    () => ({
      required: 'Professional email address is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Please enter a valid email address',
      },
    }),
    []
  );

  const onSubmit = useCallback(async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      Alert.alert(
        'Recovery Email Dispatched',
        `A secure reset link has been dispatched to ${data.email}. Please follow the instructions to restore access.`,
        [
          {
            text: 'Return to Sign In',
            onPress: () => navigation.navigate('SignIn'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Reset Failed', err?.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const onPressSendResetLink = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  return (
    <AuthLayout
      bgImageSource={require('../../../assets/images/forgot_bg.png')}
      headline="Secure Access for Medical Professionals"
      subheadline={
        'Protecting patient data is our highest priority. Our AI Diagnostic Suite utilizes enterprise-grade encryption and HIPAA-compliant protocols to ensure your clinical workspace remains secure and private.'
      }
      isForgotPasswordLayout={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Please enter your professional email address associated with your medical institution to receive a secure recovery link.
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <FormInput
          control={control}
          name="email"
          label="PROFESSIONAL EMAIL ADDRESS"
          placeholder="dr.hakeem@medicalcenter.org"
          keyboardType="email-address"
          leftIcon="mail-outline"
          rules={emailRules}
        />

        {/* Submit Action */}
        <GradientButton
          title="Send Reset Link"
          iconName="arrow-forward"
          onPress={onPressSendResetLink}
          loading={loading}
          borderRadius={12}
          style={styles.submitBtn}
        />

        {/* Back to Sign In Link */}
        <TouchableOpacity
          style={styles.backLinkRow}
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary} />
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* System Security Compliance Footer (node 72:143 - 72:158) */}
        <View style={styles.securityFooter}>
          <View style={styles.securityDividerRow}>
            <View style={styles.securityDividerLine} />
            <Text style={styles.securityDividerLabel}>SYSTEM SECURITY</Text>
            <View style={styles.securityDividerLine} />
          </View>

          <View style={styles.securityBadgeCard}>
            <Image
              source={require('../../../assets/images/hipaa_badge.png')}
              style={styles.securityBadgeIcon}
              resizeMode="contain"
            />
            <View style={styles.securityBadgeTextGroup}>
              <Text style={styles.securityBadgeTitle}>HIPAA COMPLIANT</Text>
              <Text style={styles.securityBadgeSubtitle}>
                256-bit AES Encryption Active
              </Text>
            </View>
          </View>
        </View>

        {/* Support Help Pill */}
        <View style={styles.supportFabRow}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() =>
              Alert.alert(
                'Clinical Support',
                'Contact 24/7 Medical IT Support: support@dr-hakeem.internal or +1 (800) 555-0199'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.supportButtonText}>Support</Text>
          </TouchableOpacity>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.bodyText,
    lineHeight: 23,
  },
  formContainer: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 28,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  securityFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  securityDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  securityDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201, 196, 215, 0.4)',
  },
  securityDividerLabel: {
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.mutedText,
  },
  securityBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: 'rgba(201, 196, 215, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  securityBadgeIcon: {
    width: 28,
    height: 28,
  },
  securityBadgeTextGroup: {
    justifyContent: 'center',
  },
  securityBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.5,
  },
  securityBadgeSubtitle: {
    fontSize: 11,
    color: colors.bodyText,
    marginTop: 2,
  },
  supportFabRow: {
    alignItems: 'flex-end',
    marginTop: 24,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 196, 215, 0.5)',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.4,
  },
});
